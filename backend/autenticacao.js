const crypto = require('crypto')

const tokenSecret = process.env.AUTH_TOKEN_SECRET
if (!tokenSecret || tokenSecret.length < 32) {
    throw new Error('Defina AUTH_TOKEN_SECRET com pelo menos 32 caracteres no arquivo backend/.env.')
}

function codificar(valor) {
    return Buffer.from(JSON.stringify(valor)).toString('base64url')
}

function criarToken(usuario) {
    const agora = Math.floor(Date.now() / 1000)
    const cabecalho = codificar({ alg: 'HS256', typ: 'JWT' })
    const corpo = codificar({
        sub: String(usuario.id),
        nome: usuario.nome,
        iat: agora,
        exp: agora + 60 * 60 * 24 * 7
    })
    const conteudo = `${cabecalho}.${corpo}`
    const assinatura = crypto
        .createHmac('sha256', tokenSecret)
        .update(conteudo)
        .digest('base64url')
    return `${conteudo}.${assinatura}`
}

function validarToken(token) {
    const partes = token.split('.')
    if (partes.length !== 3) {
        return null
    }

    const conteudo = `${partes[0]}.${partes[1]}`
    const assinaturaEsperada = crypto
        .createHmac('sha256', tokenSecret)
        .update(conteudo)
        .digest()
    let assinaturaRecebida
    let payload

    try {
        assinaturaRecebida = Buffer.from(partes[2], 'base64url')
        payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString())
    } catch {
        return null
    }

    if (!payload || typeof payload !== 'object') {
        return null
    }

    if (
        assinaturaRecebida.length !== assinaturaEsperada.length ||
        !crypto.timingSafeEqual(assinaturaRecebida, assinaturaEsperada) ||
        !Number.isInteger(Number(payload.sub)) ||
        !Number.isInteger(payload.exp) ||
        payload.exp <= Math.floor(Date.now() / 1000)
    ) {
        return null
    }

    return { id: Number(payload.sub), nome: payload.nome }
}

module.exports = { criarToken, validarToken }
