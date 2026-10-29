function campo(id, valor) {
    const texto = String(valor)
    if (texto.length > 99) {
        throw new Error(`O campo Pix ${id} excede o limite permitido.`)
    }
    return `${id}${String(texto.length).padStart(2, '0')}${texto}`
}

function normalizarTexto(valor, nomeCampo, limite) {
    const texto = String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim()
    if (!texto || texto.length > limite || !/^[A-Z0-9 .&'-]+$/.test(texto)) {
        const error = new Error(`${nomeCampo} deve ter até ${limite} caracteres sem acentos.`)
        error.statusCode = 503
        throw error
    }
    return texto
}

function configuracao() {
    const chave = (process.env.PIX_KEY || '').trim()
    if (!chave) {
        const error = new Error('Configure PIX_KEY, PIX_RECEIVER_NAME e PIX_CITY no backend/.env.')
        error.statusCode = 503
        throw error
    }
    if (chave.length > 77 || !/^[\x20-\x7E]+$/.test(chave)) {
        const error = new Error('PIX_KEY deve conter uma chave Pix válida com até 77 caracteres.')
        error.statusCode = 503
        throw error
    }
    return {
        chave,
        nome: normalizarTexto(process.env.PIX_RECEIVER_NAME, 'PIX_RECEIVER_NAME', 25),
        cidade: normalizarTexto(process.env.PIX_CITY, 'PIX_CITY', 15)
    }
}

function crc16(texto) {
    let crc = 0xffff
    for (const caractere of texto) {
        crc ^= caractere.charCodeAt(0) << 8
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc & 0x8000) !== 0
                ? (crc << 1) ^ 0x1021
                : crc << 1
            crc &= 0xffff
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0')
}

function criarPayload() {
    const { chave, nome, cidade } = configuracao()
    const contaPix = campo('00', 'br.gov.bcb.pix') + campo('01', chave)
    const campos = [
        campo('00', '01'),
        campo('01', '11'),
        campo('26', contaPix),
        campo('52', '0000'),
        campo('53', '986'),
        campo('58', 'BR'),
        campo('59', nome),
        campo('60', cidade),
        campo('62', campo('05', '***'))
    ].join('') + '6304'
    return `${campos}${crc16(campos)}`
}

function obterDados() {
    const { nome } = configuracao()
    return { payload: criarPayload(), receiverName: nome }
}

function configurado() {
    try {
        criarPayload()
        return true
    } catch {
        return false
    }
}

module.exports = { obterDados, configurado }
