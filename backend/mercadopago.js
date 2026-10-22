const crypto = require('crypto')

const authorizationUrl = 'https://auth.mercadopago.com/authorization'
const apiUrl = 'https://api.mercadopago.com'

function configuracaoOAuth() {
    const clientId = process.env.MP_CLIENT_ID
    const clientSecret = process.env.MP_CLIENT_SECRET
    const redirectUri = process.env.MP_OAUTH_REDIRECT_URI
    if (!clientId || !clientSecret || !redirectUri) {
        const error = new Error('O Mercado Pago ainda não está configurado no backend.')
        error.statusCode = 503
        throw error
    }
    validarUrlHttps(redirectUri, 'MP_OAUTH_REDIRECT_URI')
    return { clientId, clientSecret, redirectUri }
}

function configuracaoCheckout() {
    const webhookUrl = process.env.MP_WEBHOOK_URL
    const successUrl = process.env.MP_CHECKOUT_SUCCESS_URL
    const pendingUrl = process.env.MP_CHECKOUT_PENDING_URL
    const failureUrl = process.env.MP_CHECKOUT_FAILURE_URL
    if (!webhookUrl || !successUrl || !pendingUrl || !failureUrl) {
        const error = new Error('Configure as URLs públicas HTTPS do webhook e do retorno do checkout.')
        error.statusCode = 503
        throw error
    }
    validarUrlHttps(webhookUrl, 'MP_WEBHOOK_URL')
    validarUrlHttps(successUrl, 'MP_CHECKOUT_SUCCESS_URL')
    validarUrlHttps(pendingUrl, 'MP_CHECKOUT_PENDING_URL')
    validarUrlHttps(failureUrl, 'MP_CHECKOUT_FAILURE_URL')
    return { webhookUrl, successUrl, pendingUrl, failureUrl }
}

function validarUrlHttps(valor, nome) {
    let url
    try {
        url = new URL(valor)
    } catch {
        const error = new Error(`${nome} precisa ser uma URL HTTPS válida.`)
        error.statusCode = 503
        throw error
    }
    if (url.protocol !== 'https:') {
        const error = new Error(`${nome} precisa usar HTTPS.`)
        error.statusCode = 503
        throw error
    }
    return url
}

function urlAutorizacao(state) {
    const { clientId, redirectUri } = configuracaoOAuth()
    const url = new URL(authorizationUrl)
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('platform_id', 'mp')
    url.searchParams.set('state', state)
    url.searchParams.set('redirect_uri', redirectUri)
    return url.toString()
}

async function respostaJson(url, options, acao) {
    let response
    try {
        response = await fetch(url, options)
    } catch {
        const error = new Error(`Não foi possível conectar ao Mercado Pago para ${acao}.`)
        error.statusCode = 502
        throw error
    }
    let dados
    try {
        dados = await response.json()
    } catch {
        const error = new Error(`O Mercado Pago retornou uma resposta inválida ao ${acao}.`)
        error.statusCode = 502
        throw error
    }
    if (!response.ok) {
        console.error(`Mercado Pago (${acao}) HTTP ${response.status}:`, dados.message || dados.error || 'falha')
        const error = new Error(`O Mercado Pago não conseguiu ${acao}. Tente novamente ou reconecte a conta recebedora.`)
        error.statusCode = response.status === 401 ? 409 : 502
        throw error
    }
    return dados
}

async function trocarCodigoOAuth(code) {
    const config = configuracaoOAuth()
    return respostaJson(
        `${apiUrl}/oauth/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: config.redirectUri
            })
        },
        'conectar a conta'
    )
}

async function renovarToken(refreshToken) {
    const config = configuracaoOAuth()
    return respostaJson(
        `${apiUrl}/oauth/token`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        },
        'renovar a conexão da conta recebedora'
    )
}

function chaveCriptografia() {
    const configurada = process.env.MP_TOKEN_ENCRYPTION_KEY || ''
    let chave
    if (/^[a-f0-9]{64}$/i.test(configurada)) {
        chave = Buffer.from(configurada, 'hex')
    } else {
        chave = Buffer.from(configurada, 'base64')
    }
    if (chave.length !== 32) {
        const error = new Error('Configure MP_TOKEN_ENCRYPTION_KEY com uma chave aleatória de 32 bytes (64 caracteres hexadecimais).')
        error.statusCode = 503
        throw error
    }
    return chave
}

function criptografarToken(valor) {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', chaveCriptografia(), iv)
    const cifrado = Buffer.concat([cipher.update(valor, 'utf8'), cipher.final()])
    return [iv, cipher.getAuthTag(), cifrado].map((parte) => parte.toString('base64')).join('.')
}

function descriptografarToken(valor) {
    const [ivBase64, tagBase64, cifradoBase64] = String(valor || '').split('.')
    if (!ivBase64 || !tagBase64 || !cifradoBase64) {
        throw new Error('O token da conta recebedora está em formato inválido.')
    }
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        chaveCriptografia(),
        Buffer.from(ivBase64, 'base64')
    )
    decipher.setAuthTag(Buffer.from(tagBase64, 'base64'))
    return Buffer.concat([
        decipher.update(Buffer.from(cifradoBase64, 'base64')),
        decipher.final()
    ]).toString('utf8')
}

async function criarPreferencia({ accessToken, referencia, artista, valor }) {
    const config = configuracaoCheckout()
    const adicionarReferencia = (endereco) => {
        const url = new URL(endereco)
        url.searchParams.set('referencia', referencia)
        return url.toString()
    }
    const dados = await respostaJson(
        `${apiUrl}/checkout/preferences`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Idempotency-Key': referencia,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: [{
                    id: `apoio-${referencia}`,
                    title: `Apoio a ${artista}`,
                    description: `Apoio direto ao artista independente ${artista}`,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: valor
                }],
                external_reference: referencia,
                notification_url: config.webhookUrl,
                back_urls: {
                    success: adicionarReferencia(config.successUrl),
                    pending: adicionarReferencia(config.pendingUrl),
                    failure: adicionarReferencia(config.failureUrl)
                },
                auto_return: 'approved',
                binary_mode: false
            })
        },
        'criar o checkout'
    )
    const sandbox = process.env.MP_CHECKOUT_MODE !== 'production'
    const checkoutUrl = sandbox ? dados.sandbox_init_point : dados.init_point
    if (!dados.id || !checkoutUrl) {
        throw new Error('O Mercado Pago não retornou um link de checkout válido.')
    }
    return { id: String(dados.id), url: checkoutUrl }
}

async function buscarPagamento(accessToken, paymentId) {
    return respostaJson(
        `${apiUrl}/v1/payments/${encodeURIComponent(paymentId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
        'confirmar o pagamento'
    )
}

function verificarAssinaturaWebhook({ assinatura, requisicaoId, dataId, segredo }) {
    if (!assinatura || !requisicaoId || !dataId || !segredo) {
        return false
    }
    const valores = Object.fromEntries(
        assinatura.split(',').map((parte) => parte.trim().split('=', 2))
    )
    if (!valores.ts || !valores.v1 || !/^\d+$/.test(valores.ts)) {
        return false
    }
    const manifesto = `id:${String(dataId).toLowerCase()};request-id:${requisicaoId};ts:${valores.ts};`
    const assinaturaEsperada = crypto
        .createHmac('sha256', segredo)
        .update(manifesto)
        .digest()
    let assinaturaRecebida
    try {
        assinaturaRecebida = Buffer.from(valores.v1, 'hex')
    } catch {
        return false
    }
    return assinaturaRecebida.length === assinaturaEsperada.length &&
        crypto.timingSafeEqual(assinaturaRecebida, assinaturaEsperada)
}

module.exports = {
    configuracaoOAuth,
    configuracaoCheckout,
    urlAutorizacao,
    trocarCodigoOAuth,
    renovarToken,
    criptografarToken,
    descriptografarToken,
    criarPreferencia,
    buscarPagamento,
    verificarAssinaturaWebhook
}
