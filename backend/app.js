require('dotenv').config()

const http = require('http')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { URL } = require('url')
const Busboy = require('busboy')
const AlbumBD = require('./database/AlbumBD')
const PagamentoBD = require('./database/PagamentoBD')
const UsuarioBD = require('./database/UsuarioBD')
const { criarToken, validarToken } = require('./autenticacao')
const MercadoPago = require('./mercadopago')

const maxBodyBytes = 64 * 1024
const maxAudioBytes = 25 * 1024 * 1024
const maxTracks = 10
const audioDirectory = path.join(__dirname, 'uploads', 'audio')
const audioTypes = new Map([
    ['audio/mpeg', '.mp3'],
    ['audio/mp4', '.m4a'],
    ['audio/aac', '.aac'],
    ['audio/wav', '.wav'],
    ['audio/x-wav', '.wav'],
    ['audio/ogg', '.ogg'],
    ['audio/flac', '.flac'],
    ['audio/x-flac', '.flac'],
    ['audio/webm', '.webm']
])

fs.mkdirSync(audioDirectory, { recursive: true })

class ApiError extends Error {
    constructor(statusCode, message) {
        super(message)
        this.statusCode = statusCode
    }
}

function enviar(res, statusCode, dados) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(dados === undefined ? '' : JSON.stringify(dados))
}

function lerJson(req) {
    return new Promise((resolve, reject) => {
        let body = ''
        let rejeitada = false
        req.setEncoding('utf8')
        req.on('data', (parte) => {
            if (rejeitada) {
                return
            }
            body += parte
            if (Buffer.byteLength(body, 'utf8') > maxBodyBytes) {
                rejeitada = true
                reject(new ApiError(413, 'Corpo da requisição muito grande.'))
            }
        })
        req.on('end', () => {
            if (rejeitada) {
                return
            }
            if (!body) {
                reject(new ApiError(400, 'Envie os dados da requisição.'))
                return
            }
            try {
                resolve(JSON.parse(body))
            } catch {
                reject(new ApiError(400, 'O corpo da requisição deve ser um JSON válido.'))
            }
        })
        req.on('error', reject)
    })
}

function receberLancamento(req) {
    return new Promise((resolve, reject) => {
        let lancamentoJson = ''
        let erro
        let lancamentoRecebido = false
        let finalizacao
        const arquivos = []
        const gravacoes = []
        let parser

        try {
            parser = Busboy({
                headers: req.headers,
                limits: {
                    fieldSize: 32 * 1024,
                    fields: 1,
                    files: maxTracks,
                    parts: maxTracks + 1,
                    fileSize: maxAudioBytes
                }
            })
        } catch {
            reject(new ApiError(400, 'Envie o cadastro como formulário com arquivos de áudio.'))
            return
        }

        const registrarErro = (mensagem, statusCode = 400) => {
            if (!erro) {
                erro = new ApiError(statusCode, mensagem)
            }
        }

        const finalizar = () => {
            if (finalizacao) {
                return finalizacao
            }
            finalizacao = (async () => {
                await Promise.all(gravacoes)
                let lancamento
                if (!erro) {
                    try {
                        lancamento = JSON.parse(lancamentoJson)
                    } catch {
                        registrarErro('Os dados do lançamento estão em formato inválido.')
                    }
                }
                if (erro) {
                    await Promise.all(
                        arquivos.map((arquivo) => fs.promises.rm(arquivo.path, { force: true }))
                    )
                    reject(erro)
                    return
                }
                resolve({ lancamento, arquivos })
            })()
            return finalizacao
        }

        parser.on('field', (nome, valor, info) => {
            if (info.valueTruncated) {
                registrarErro('As informações do cadastro excedem o limite permitido.', 413)
                return
            }
            if (nome !== 'lancamento' || lancamentoRecebido) {
                registrarErro('O formulário contém campos inválidos.')
                return
            }
            lancamentoRecebido = true
            lancamentoJson = valor
        })

        parser.on('file', (nome, arquivo, info) => {
            const extensao = audioTypes.get(info.mimeType)
            if (!/^audio_\d+$/.test(nome) || !extensao) {
                registrarErro('Envie somente arquivos MP3, M4A, AAC, WAV, OGG, FLAC ou WEBM.')
                arquivo.resume()
                return
            }

            const nomeArmazenado = `${crypto.randomUUID()}${extensao}`
            const caminho = path.join(audioDirectory, nomeArmazenado)
            const gravacao = fs.createWriteStream(caminho, { flags: 'wx' })
            const registro = {
                fieldName: nome,
                audioUrl: `/midias/audio/${nomeArmazenado}`,
                path: caminho
            }
            let bytesRecebidos = 0
            arquivos.push(registro)
            gravacoes.push(new Promise((resolveGravacao) => {
                gravacao.on('error', (error) => {
                    registrarErro('Não foi possível salvar um dos arquivos de áudio.', 500)
                    resolveGravacao(error)
                })
                gravacao.on('finish', () => resolveGravacao())
            }))
            arquivo.on('limit', () => {
                registrarErro('Cada arquivo de áudio deve ter no máximo 25 MB.', 413)
            })
            arquivo.on('data', (parte) => {
                bytesRecebidos += parte.length
            })
            arquivo.on('end', () => {
                if (bytesRecebidos === 0) {
                    registrarErro('Os arquivos de áudio não podem estar vazios.')
                }
            })
            arquivo.on('error', () => {
                registrarErro('Não foi possível receber um dos arquivos de áudio.', 400)
            })
            arquivo.pipe(gravacao)
        })

        parser.on('fieldsLimit', () => registrarErro('O formulário contém campos demais.'))
        parser.on('filesLimit', () => registrarErro(`Envie no máximo ${maxTracks} faixas.`))
        parser.on('partsLimit', () => registrarErro('O formulário contém partes demais.'))
        parser.on('error', () => registrarErro('Não foi possível ler os arquivos enviados.'))
        parser.on('finish', finalizar)
        parser.on('close', () => {
            if (!req.complete) {
                registrarErro('O envio do arquivo foi interrompido.')
                finalizar()
            }
        })
        req.pipe(parser)
    })
}

function validarLancamento(lancamento, arquivos) {
    if (!lancamento || typeof lancamento !== 'object' || Array.isArray(lancamento)) {
        throw new ApiError(400, 'Preencha as informações do lançamento.')
    }
    const texto = (valor, limite) =>
        typeof valor === 'string' && valor.trim().length > 0 && valor.trim().length <= limite
    const dataLancamento = lancamento.dataLancamento
    const dataValida = (() => {
        if (!dataLancamento) {
            return true
        }
        if (typeof dataLancamento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataLancamento)) {
            return false
        }
        const [ano, mes, dia] = dataLancamento.split('-').map(Number)
        const data = new Date(Date.UTC(ano, mes - 1, dia))
        return ano >= 1000 &&
            data.getUTCFullYear() === ano &&
            data.getUTCMonth() === mes - 1 &&
            data.getUTCDate() === dia
    })()
    if (!texto(lancamento.nomeArtista, 150)) {
        throw new ApiError(400, 'O nome do artista é obrigatório e deve ter até 150 caracteres.')
    }
    if (lancamento.pais !== undefined && (typeof lancamento.pais !== 'string' || lancamento.pais.trim().length > 60)) {
        throw new ApiError(400, 'O país deve ter até 60 caracteres.')
    }
    if (lancamento.biografia !== undefined && (typeof lancamento.biografia !== 'string' || lancamento.biografia.trim().length > 3000)) {
        throw new ApiError(400, 'A biografia deve ter até 3.000 caracteres.')
    }
    if (!Number.isInteger(Number(lancamento.generoId)) || Number(lancamento.generoId) < 1) {
        throw new ApiError(400, 'Selecione um gênero válido.')
    }
    if (!texto(lancamento.tituloAlbum, 150)) {
        throw new ApiError(400, 'O nome do álbum é obrigatório e deve ter até 150 caracteres.')
    }
    if (!dataValida) {
        throw new ApiError(400, 'Informe uma data de lançamento válida.')
    }
    if (lancamento.capaUrl) {
        try {
            const capa = new URL(lancamento.capaUrl)
            if (capa.protocol !== 'https:' || lancamento.capaUrl.length > 255) {
                throw new Error('invalid url')
            }
        } catch {
            throw new ApiError(400, 'A capa deve ser um endereço HTTPS válido de até 255 caracteres.')
        }
    }
    if (
        !Array.isArray(lancamento.faixas) ||
        lancamento.faixas.length < 1 ||
        lancamento.faixas.length > maxTracks ||
        lancamento.faixas.some((faixa) =>
            !faixa ||
            !texto(faixa.titulo, 150) ||
            !/^audio_\d+$/.test(faixa.fieldName)
        )
    ) {
        throw new ApiError(400, `Informe de 1 a ${maxTracks} músicas, cada uma com título e arquivo de áudio.`)
    }
    const campos = new Set(lancamento.faixas.map((faixa) => faixa.fieldName))
    if (
        campos.size !== lancamento.faixas.length ||
        arquivos.length !== campos.size ||
        arquivos.some((arquivo) => !campos.has(arquivo.fieldName))
    ) {
        throw new ApiError(400, 'Cada faixa precisa ter exatamente um arquivo de áudio.')
    }
    return {
        nome: lancamento.nomeArtista.trim(),
        pais: lancamento.pais?.trim() || null,
        biografia: lancamento.biografia?.trim() || null,
        generoId: Number(lancamento.generoId),
        tituloAlbum: lancamento.tituloAlbum.trim(),
        dataLancamento: lancamento.dataLancamento || null,
        capaUrl: lancamento.capaUrl?.trim() || null,
        faixas: lancamento.faixas.map((faixa) => ({
            titulo: faixa.titulo.trim(),
            audioUrl: arquivos.find((arquivo) => arquivo.fieldName === faixa.fieldName).audioUrl
        }))
    }
}

function obterUsuario(req) {
    const autorizacao = req.headers.authorization || ''
    const correspondencia = autorizacao.match(/^Bearer\s+(.+)$/i)
    const usuario = correspondencia
        ? validarToken(correspondencia[1])
        : null
    if (!usuario) {
        throw new ApiError(401, 'Entre na sua conta para continuar.')
    }
    return usuario
}

function obterUsuarioOpcional(req) {
    const autorizacao = req.headers.authorization || ''
    const correspondencia = autorizacao.match(/^Bearer\s+(.+)$/i)
    return correspondencia ? validarToken(correspondencia[1]) : null
}

function urlRetornoOAuth(estado, resultado) {
    const endereco = process.env.MP_OAUTH_RETURN_URL
    if (!endereco) {
        return null
    }
    let url
    try {
        url = new URL(endereco)
    } catch {
        throw new ApiError(503, 'Configure uma URL válida de retorno para a conexão do Mercado Pago.')
    }
    if (url.protocol !== 'https:' && url.protocol !== 'myapp:') {
        throw new ApiError(503, 'A URL de retorno do Mercado Pago precisa usar HTTPS ou o esquema do aplicativo.')
    }
    url.searchParams.set('resultado', resultado)
    if (estado?.artistaId) {
        url.searchParams.set('artistaId', String(estado.artistaId))
    }
    return url.toString()
}

function configurarRedirecionamentoOAuth(res, estado, resultado) {
    const endereco = urlRetornoOAuth(estado, resultado)
    if (endereco) {
        res.writeHead(302, { Location: endereco, 'Cache-Control': 'no-store' })
        res.end()
        return true
    }
    return false
}

function pagamentosProntos() {
    try {
        MercadoPago.configuracaoOAuth()
        MercadoPago.configuracaoCheckout()
        if (!process.env.MP_WEBHOOK_SECRET) {
            return false
        }
        MercadoPago.criptografarToken('verificacao')
        return true
    } catch {
        return false
    }
}

async function obterTokenRecebedor(artistaId, conta) {
    const expiraEm = new Date(conta.expiraEm).getTime()
    if (expiraEm > Date.now() + 5 * 60 * 1000) {
        return MercadoPago.descriptografarToken(conta.accessToken)
    }

    const tokens = await MercadoPago.renovarToken(
        MercadoPago.descriptografarToken(conta.refreshToken)
    )
    if (
        typeof tokens.access_token !== 'string' ||
        typeof tokens.refresh_token !== 'string' ||
        !Number.isFinite(Number(tokens.expires_in)) ||
        Number(tokens.expires_in) <= 0
    ) {
        throw new ApiError(502, 'O Mercado Pago não retornou credenciais de renovação válidas. Reconecte a conta do artista.')
    }
    await PagamentoBD.atualizarTokensRecebedora(artistaId, {
        accessToken: MercadoPago.criptografarToken(tokens.access_token),
        refreshToken: MercadoPago.criptografarToken(tokens.refresh_token),
        expiraEm: new Date(Date.now() + Number(tokens.expires_in) * 1000),
        mercadoPagoUsuarioId: String(tokens.user_id || conta.mercadoPagoUsuarioId)
    })
    return tokens.access_token
}

async function confirmarPagamentoMercadoPago(req, res, url, corpo) {
    const dataId = url.searchParams.get('data.id') ||
        url.searchParams.get('id') ||
        corpo?.data?.id
    const tipo = url.searchParams.get('type') ||
        url.searchParams.get('topic') ||
        corpo?.type
    if (tipo && tipo !== 'payment') {
        enviar(res, 200, { recebido: true })
        return
    }
    if (!dataId) {
        throw new ApiError(400, 'Notificação sem identificador de pagamento.')
    }
    if (!process.env.MP_WEBHOOK_SECRET) {
        throw new ApiError(503, 'Configure o segredo de assinatura do webhook do Mercado Pago.')
    }
    if (!MercadoPago.verificarAssinaturaWebhook({
        assinatura: req.headers['x-signature'],
        requisicaoId: req.headers['x-request-id'],
        dataId,
        segredo: process.env.MP_WEBHOOK_SECRET
    })) {
        throw new ApiError(401, 'Assinatura de webhook inválida.')
    }

    const usuarioMercadoPagoId = corpo?.user_id
    if (!usuarioMercadoPagoId) {
        throw new ApiError(400, 'Notificação sem identificação da conta recebedora.')
    }
    const conta = await PagamentoBD.buscarContaPorUsuarioMercadoPago(usuarioMercadoPagoId)
    if (!conta) {
        throw new ApiError(404, 'Conta recebedora não encontrada para esta notificação.')
    }
    const token = await obterTokenRecebedor(conta.artistaId, conta)
    const pagamento = await MercadoPago.buscarPagamento(token, dataId)
    if (
        String(pagamento.id) !== String(dataId) ||
        !pagamento.external_reference ||
        String(pagamento.collector_id) !== String(usuarioMercadoPagoId)
    ) {
        throw new ApiError(400, 'Os dados do pagamento não correspondem à notificação.')
    }
    const atualizado = await PagamentoBD.confirmarPagamento({
        referencia: pagamento.external_reference,
        paymentId: pagamento.id,
        status: pagamento.status,
        statusDetalhe: pagamento.status_detail,
        valor: pagamento.transaction_amount,
        currencyId: pagamento.currency_id,
        collectorId: pagamento.collector_id
    })
    if (!atualizado) {
        throw new ApiError(404, 'O apoio correspondente não foi encontrado ou os dados não conferem.')
    }
    enviar(res, 200, { recebido: true })
}

function validarCredenciais(nome, username, email, senha, cadastro = false) {
    if (
        typeof email !== 'string' ||
        typeof senha !== 'string' ||
        (cadastro && (typeof nome !== 'string' || typeof username !== 'string'))
    ) {
        throw new ApiError(400, 'Preencha os campos obrigatórios.')
    }

    const emailNormalizado = email.trim().toLowerCase()
    if (
        emailNormalizado.length > 30 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)
    ) {
        throw new ApiError(400, 'Informe um e-mail válido de até 30 caracteres.')
    }
    if (senha.length < 8 || senha.length > 72) {
        throw new ApiError(400, 'A senha deve ter entre 8 e 72 caracteres.')
    }
    if (cadastro && !nome.trim()) {
        throw new ApiError(400, 'Informe seu nome.')
    }
    const usernameNormalizado = cadastro ? username.trim() : undefined
    if (
        cadastro &&
        (usernameNormalizado.length > 30 ||
            !/^[\p{L}\p{N}._-]{3,30}$/u.test(usernameNormalizado))
    ) {
        throw new ApiError(
            400,
            'O nome de usuário deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado.'
        )
    }
    return {
        nome: cadastro ? nome.trim() : undefined,
        username: usernameNormalizado,
        email: emailNormalizado,
        senha
    }
}

function validarDadosPerfil(corpo) {
    if (
        typeof corpo.nome !== 'string' ||
        typeof corpo.username !== 'string' ||
        typeof corpo.email !== 'string'
    ) {
        throw new ApiError(400, 'Preencha nome, nome de usuário e e-mail.')
    }
    const nome = corpo.nome.trim()
    const username = corpo.username.trim()
    const email = corpo.email.trim().toLowerCase()
    if (!nome || nome.length > 50) {
        throw new ApiError(400, 'O nome deve ter entre 1 e 50 caracteres.')
    }
    if (!/^[\p{L}\p{N}._-]{3,30}$/u.test(username)) {
        throw new ApiError(
            400,
            'O nome de usuário deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado.'
        )
    }
    if (email.length > 30 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ApiError(400, 'Informe um e-mail válido de até 30 caracteres.')
    }

    const senhaAtual = corpo.senhaAtual || ''
    const novaSenha = corpo.novaSenha || ''
    if (typeof senhaAtual !== 'string' || typeof novaSenha !== 'string') {
        throw new ApiError(400, 'Os campos de senha são inválidos.')
    }
    if (novaSenha && (novaSenha.length < 8 || novaSenha.length > 72)) {
        throw new ApiError(400, 'A nova senha deve ter entre 8 e 72 caracteres.')
    }
    if (senhaAtual && !novaSenha) {
        throw new ApiError(400, 'Informe a nova senha que deseja usar.')
    }

    return { nome, username, email, senhaAtual, novaSenha }
}

async function tratarRequisicao(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')

    if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
    }

    const url = new URL(req.url, 'http://localhost')
    const caminho = url.pathname

    if (req.method === 'GET' && caminho === '/pagamentos/mercadopago/oauth/callback') {
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        if (!state || !/^[a-f0-9]{64}$/i.test(state)) {
            throw new ApiError(400, 'Estado OAuth inválido.')
        }
        const estado = await PagamentoBD.consumirEstadoOAuth(state)
        if (!estado) {
            throw new ApiError(400, 'A solicitação de conexão expirou ou já foi utilizada. Tente conectar novamente.')
        }
        if (!code || url.searchParams.get('error')) {
            const redirecionou = configurarRedirecionamentoOAuth(res, estado, 'cancelado')
            if (redirecionou) return
            throw new ApiError(400, 'A conexão com o Mercado Pago foi cancelada.')
        }
        try {
            const tokens = await MercadoPago.trocarCodigoOAuth(code)
            if (
                !tokens.access_token ||
                !tokens.refresh_token ||
                !tokens.user_id ||
                !Number.isFinite(Number(tokens.expires_in)) ||
                Number(tokens.expires_in) <= 0
            ) {
                throw new ApiError(502, 'O Mercado Pago não retornou uma conexão válida.')
            }
            await PagamentoBD.salvarContaRecebedora({
                artistaId: estado.artistaId,
                proprietarioId: estado.usuarioId,
                mercadoPagoUsuarioId: tokens.user_id,
                accessToken: MercadoPago.criptografarToken(tokens.access_token),
                refreshToken: MercadoPago.criptografarToken(tokens.refresh_token),
                expiraEm: new Date(Date.now() + Number(tokens.expires_in) * 1000)
            })
            const redirecionou = configurarRedirecionamentoOAuth(res, estado, 'conectado')
            if (!redirecionou) {
                enviar(res, 200, { message: 'Conta do Mercado Pago conectada. Volte ao aplicativo.' })
            }
        } catch (error) {
            console.error('Não foi possível concluir a conexão OAuth do Mercado Pago:', error)
            if (configurarRedirecionamentoOAuth(res, estado, 'erro')) {
                return
            }
            throw error
        }
        return
    }

    if (req.method === 'POST' && caminho === '/webhooks/mercadopago') {
        const corpo = req.headers['content-type']?.includes('application/json')
            ? await lerJson(req)
            : {}
        await confirmarPagamentoMercadoPago(req, res, url, corpo)
        return
    }

    const arquivoAudio = caminho.match(/^\/midias\/audio\/([a-f0-9-]+\.(?:mp3|m4a|aac|wav|ogg|flac|webm))$/i)
    if (req.method === 'GET' && arquivoAudio) {
        const caminhoArquivo = path.join(audioDirectory, arquivoAudio[1])
        try {
            await fs.promises.access(caminhoArquivo, fs.constants.R_OK)
        } catch {
            throw new ApiError(404, 'Arquivo de áudio não encontrado.')
        }
        const tipos = {
            mp3: 'audio/mpeg',
            m4a: 'audio/mp4',
            aac: 'audio/aac',
            wav: 'audio/wav',
            ogg: 'audio/ogg',
            flac: 'audio/flac',
            webm: 'audio/webm'
        }
        res.writeHead(200, {
            'Content-Type': tipos[path.extname(caminhoArquivo).slice(1)],
            'Content-Length': (await fs.promises.stat(caminhoArquivo)).size,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'public, max-age=86400'
        })
        fs.createReadStream(caminhoArquivo).pipe(res)
        return
    }

    if (req.method === 'GET' && caminho === '/health') {
        enviar(res, 200, { status: 'ok' })
        return
    }

    if (req.method === 'POST' && caminho === '/auth/registro') {
        const corpo = await lerJson(req)
        const dados = validarCredenciais(
            corpo.nome,
            corpo.username,
            corpo.email,
            corpo.senha,
            true
        )
        const usuario = await UsuarioBD.cadastrar(dados)
        enviar(res, 201, { usuario, token: criarToken(usuario) })
        return
    }

    if (req.method === 'POST' && caminho === '/auth/login') {
        const corpo = await lerJson(req)
        const dados = validarCredenciais(undefined, undefined, corpo.email, corpo.senha)
        const usuario = await UsuarioBD.autenticar(dados.email, dados.senha)
        if (!usuario) {
            throw new ApiError(401, 'E-mail ou senha incorretos.')
        }
        enviar(res, 200, { usuario, token: criarToken(usuario) })
        return
    }

    if (req.method === 'GET' && caminho === '/auth/perfil') {
        const sessao = obterUsuario(req)
        const usuario = await UsuarioBD.buscarPorId(sessao.id)
        if (!usuario) {
            throw new ApiError(404, 'Usuário não encontrado.')
        }
        enviar(res, 200, {
            id: usuario.id,
            nome: usuario.name,
            username: usuario.username,
            email: usuario.email
        })
        return
    }

    if (req.method === 'PUT' && caminho === '/auth/perfil') {
        const sessao = obterUsuario(req)
        const dados = validarDadosPerfil(await lerJson(req))
        const usuario = await UsuarioBD.atualizarPerfil(sessao.id, dados)
        enviar(res, 200, {
            id: usuario.id,
            nome: usuario.name,
            username: usuario.username,
            email: usuario.email
        })
        return
    }

    if (req.method === 'GET' && caminho === '/albuns') {
        const busca = url.searchParams.get('busca')?.trim() || ''
        enviar(res, 200, await AlbumBD.listar(busca))
        return
    }

    if (req.method === 'GET' && caminho === '/favoritos') {
        const usuario = obterUsuario(req)
        enviar(res, 200, await AlbumBD.listarFavoritos(usuario.id))
        return
    }

    const rotaFavorito = caminho.match(/^\/albuns\/(\d+)\/favorito$/)
    if (rotaFavorito) {
        const usuario = obterUsuario(req)
        const albumId = Number(rotaFavorito[1])
        if (!(await AlbumBD.buscarPorId(albumId))) {
            throw new ApiError(404, 'Álbum não encontrado.')
        }

        if (req.method === 'GET') {
            enviar(res, 200, {
                favorito: await AlbumBD.possuiFavorito(usuario.id, albumId)
            })
            return
        }
        if (req.method === 'POST') {
            await AlbumBD.adicionarFavorito(usuario.id, albumId)
            enviar(res, 200, { favorito: true })
            return
        }
        if (req.method === 'DELETE') {
            await AlbumBD.removerFavorito(usuario.id, albumId)
            enviar(res, 200, { favorito: false })
            return
        }
    }

    if (req.method === 'GET' && caminho === '/generos') {
        enviar(res, 200, await AlbumBD.listarGeneros())
        return
    }

    if (req.method === 'GET' && caminho === '/artistas-independentes') {
        enviar(res, 200, await AlbumBD.listarArtistasIndependentes())
        return
    }

    if (req.method === 'GET' && caminho === '/albuns-independentes') {
        enviar(res, 200, await AlbumBD.listarAlbunsIndependentes())
        return
    }

    const rotaApoioArtista = caminho.match(/^\/artistas\/(\d+)\/apoio$/)
    if (req.method === 'GET' && rotaApoioArtista) {
        const usuario = obterUsuarioOpcional(req)
        const estado = await PagamentoBD.obterEstadoArtista(
            Number(rotaApoioArtista[1]),
            usuario?.id
        )
        enviar(res, 200, {
            independente: estado.independente,
            contaVinculada: estado.contaVinculada,
            souProprietario: estado.souProprietario,
            pagamentosConfigurados: pagamentosProntos()
        })
        return
    }

    const rotaConectarArtista = caminho.match(/^\/artistas\/(\d+)\/pagamentos\/conectar$/)
    if (req.method === 'POST' && rotaConectarArtista) {
        const usuario = obterUsuario(req)
        const artistaId = Number(rotaConectarArtista[1])
        const artista = await PagamentoBD.buscarProprietarioArtista(artistaId)
        if (!artista) {
            throw new ApiError(404, 'Artista independente não encontrado.')
        }
        if (Number(artista.usuarioId) !== Number(usuario.id)) {
            throw new ApiError(403, 'Somente o responsável pelo artista pode vincular a conta de recebimento.')
        }
        const state = crypto.randomBytes(32).toString('hex')
        await PagamentoBD.criarEstadoOAuth({
            state,
            usuarioId: usuario.id,
            artistaId,
            expiraEm: new Date(Date.now() + 10 * 60 * 1000)
        })
        enviar(res, 200, { url: MercadoPago.urlAutorizacao(state) })
        return
    }

    const rotaApoiarArtista = caminho.match(/^\/artistas\/(\d+)\/apoios$/)
    if (req.method === 'POST' && rotaApoiarArtista) {
        const usuario = obterUsuario(req)
        const artistaId = Number(rotaApoiarArtista[1])
        const artista = await PagamentoBD.buscarProprietarioArtista(artistaId)
        if (!artista) {
            throw new ApiError(404, 'Artista independente não encontrado.')
        }
        if (Number(artista.usuarioId) === Number(usuario.id)) {
            throw new ApiError(400, 'Você não pode enviar um apoio para o seu próprio artista.')
        }
        const corpo = await lerJson(req)
        const valor = Number(corpo?.valor)
        if (!Number.isFinite(valor) || Math.round(valor * 100) !== valor * 100 || valor < 1 || valor > 1000) {
            throw new ApiError(400, 'O valor do apoio deve ser entre R$ 1,00 e R$ 1.000,00.')
        }
        if (!pagamentosProntos()) {
            throw new ApiError(503, 'Os pagamentos ainda não estão configurados para produção.')
        }
        const conta = await PagamentoBD.buscarContaRecebedora(artistaId)
        if (!conta) {
            throw new ApiError(409, 'Este artista ainda não vinculou uma conta de recebimento.')
        }

        const referencia = crypto.randomUUID()
        await PagamentoBD.criarApoio({
            referencia,
            artistaId,
            usuarioId: usuario.id,
            valor: valor.toFixed(2)
        })
        try {
            const accessToken = await obterTokenRecebedor(artistaId, conta)
            const preferencia = await MercadoPago.criarPreferencia({
                accessToken,
                referencia,
                artista: artista.nome,
                valor
            })
            await PagamentoBD.salvarPreferencia(referencia, preferencia.id)
            enviar(res, 201, { referencia, checkoutUrl: preferencia.url })
        } catch (error) {
            await PagamentoBD.removerApoioPendente(referencia)
            throw error
        }
        return
    }

    const rotaConsultarApoio = caminho.match(/^\/apoios\/([a-f0-9-]{36})$/i)
    if (req.method === 'GET' && rotaConsultarApoio) {
        const usuario = obterUsuario(req)
        const apoio = await PagamentoBD.buscarApoio(
            rotaConsultarApoio[1],
            usuario.id
        )
        if (!apoio) {
            throw new ApiError(404, 'Apoio não encontrado.')
        }
        enviar(res, 200, {
            referencia: apoio.referencia,
            artista: apoio.artista,
            valor: Number(apoio.valor),
            status: apoio.status,
            statusDetalhe: apoio.statusDetalhe,
            criadoEm: apoio.criadoEm
        })
        return
    }

    if (req.method === 'POST' && caminho === '/artistas-independentes') {
        const usuario = obterUsuario(req)
        const { lancamento, arquivos } = await receberLancamento(req)
        let dados
        try {
            dados = validarLancamento(lancamento, arquivos)
        } catch (error) {
            await Promise.all(
                arquivos.map((arquivo) => fs.promises.rm(arquivo.path, { force: true }))
            )
            throw error
        }
        try {
            if (!(await AlbumBD.buscarGenero(dados.generoId))) {
                throw new ApiError(400, 'O gênero selecionado não existe.')
            }
            const resultado = await AlbumBD.cadastrarArtistaIndependente({
                usuarioId: usuario.id,
                ...dados
            })
            enviar(res, 201, {
                ...resultado,
                message: 'Artista e álbum cadastrados com sucesso.'
            })
        } catch (error) {
            await Promise.all(
                arquivos.map((arquivo) => fs.promises.rm(arquivo.path, { force: true }))
            )
            throw error
        }
        return
    }

    const rotaGenero = caminho.match(/^\/generos\/(\d+)\/albuns$/)
    if (req.method === 'GET' && rotaGenero) {
        const id = Number(rotaGenero[1])
        const genero = await AlbumBD.buscarGenero(id)
        if (!genero) {
            throw new ApiError(404, 'Gênero não encontrado.')
        }
        enviar(res, 200, {
            id: String(genero.id),
            nome: genero.nome,
            albuns: await AlbumBD.listarPorGenero(id)
        })
        return
    }

    if (req.method === 'GET' && caminho === '/artistas') {
        const busca = url.searchParams.get('busca')?.trim() || ''
        enviar(res, 200, await AlbumBD.listarArtistas(busca))
        return
    }

    const rotaArtista = caminho.match(/^\/artistas\/(\d+)$/)
    if (req.method === 'GET' && rotaArtista) {
        const artista = await AlbumBD.buscarArtista(Number(rotaArtista[1]))
        if (!artista) {
            throw new ApiError(404, 'Artista não encontrado.')
        }
        enviar(res, 200, {
            id: String(artista.id),
            nome: artista.nome,
            pais: artista.pais,
            biografia: artista.biografia,
            foto: artista.foto,
            totalAlbuns: Number(artista.totalAlbuns),
            albuns: await AlbumBD.listarPorArtista(Number(rotaArtista[1]))
        })
        return
    }

    const rotaAlbum = caminho.match(/^\/albuns\/(\d+)(?:\/avaliacoes)?$/)
    if (rotaAlbum) {
        const albumId = Number(rotaAlbum[1])
        const avaliacoes = caminho.endsWith('/avaliacoes')

        if (req.method === 'GET' && avaliacoes) {
            if (!(await AlbumBD.buscarPorId(albumId))) {
                throw new ApiError(404, 'Álbum não encontrado.')
            }
            enviar(res, 200, await AlbumBD.listarAvaliacoes(albumId))
            return
        }

        if (req.method === 'GET' && !avaliacoes) {
            const album = await AlbumBD.buscarPorId(albumId)
            if (!album) {
                throw new ApiError(404, 'Álbum não encontrado.')
            }
            enviar(res, 200, album)
            return
        }

        if (req.method === 'POST' && avaliacoes) {
            const usuario = obterUsuario(req)
            const corpo = await lerJson(req)
            const nota = Number(corpo.nota)
            const comentario =
                typeof corpo.comentario === 'string' ? corpo.comentario.trim() : ''

            if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
                throw new ApiError(400, 'A nota deve ser um número inteiro de 1 a 5.')
            }
            if (!comentario || comentario.length > 500) {
                throw new ApiError(400, 'O comentário é obrigatório e deve ter até 500 caracteres.')
            }
            if (!(await AlbumBD.buscarPorId(albumId))) {
                throw new ApiError(404, 'Álbum não encontrado.')
            }

            enviar(
                res,
                200,
                await AlbumBD.salvarAvaliacao({
                    usuarioId: usuario.id,
                    albumId,
                    nota,
                    comentario
                })
            )
            return
        }
    }

    throw new ApiError(404, 'Rota não encontrada.')
}

const server = http.createServer((req, res) => {
    tratarRequisicao(req, res).catch((error) => {
        const statusCode = error.statusCode || 500
        if (statusCode >= 500) {
            console.error('Erro na API:', error)
        }
        if (!res.headersSent) {
            enviar(res, statusCode, {
                message: statusCode >= 500
                    ? 'Erro interno do servidor.'
                    : error.message
            })
        } else {
            res.destroy()
        }
    })
})

const port = Number(process.env.PORT || 3000)
server.listen(port, '0.0.0.0', () => {
    console.log(`API rodando na porta ${port}`)
})
