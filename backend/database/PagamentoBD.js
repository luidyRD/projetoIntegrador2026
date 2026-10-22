const { query, withTransaction } = require('./conexao')

async function buscarProprietarioArtista(artistaId) {
    const rows = await query(
        `SELECT ai.artista_id AS artistaId, ai.usuario_id AS usuarioId, ar.nome
         FROM artistas_independentes ai
         INNER JOIN artistas ar ON ar.id = ai.artista_id
         WHERE ai.artista_id = ?
         LIMIT 1`,
        [artistaId]
    )
    return rows[0] || null
}

async function obterEstadoArtista(artistaId, usuarioId) {
    const rows = await query(
        `SELECT ai.artista_id AS artistaId,
                apa.mp_user_id AS mercadoPagoUsuarioId,
                ai.usuario_id AS proprietarioId
         FROM artistas_independentes ai
         LEFT JOIN artista_contas_pagamento apa ON apa.artista_id = ai.artista_id
         WHERE ai.artista_id = ?
         LIMIT 1`,
        [artistaId]
    )
    const artista = rows[0]
    if (!artista) {
        return { independente: false, contaVinculada: false, souProprietario: false }
    }
    return {
        independente: true,
        contaVinculada: Boolean(artista.mercadoPagoUsuarioId),
        souProprietario: Number(artista.proprietarioId) === Number(usuarioId),
        mercadoPagoUsuarioId: artista.mercadoPagoUsuarioId
            ? String(artista.mercadoPagoUsuarioId)
            : null
    }
}

async function criarEstadoOAuth({ state, usuarioId, artistaId, expiraEm }) {
    await query('DELETE FROM mercadopago_oauth_states WHERE expira_em <= CURRENT_TIMESTAMP')
    await query(
        `INSERT INTO mercadopago_oauth_states (state, usuario_id, artista_id, expira_em)
         VALUES (?, ?, ?, ?)`,
        [state, usuarioId, artistaId, expiraEm]
    )
}

async function consumirEstadoOAuth(state) {
    return withTransaction(async (executarQuery) => {
        const rows = await executarQuery(
            `SELECT usuario_id AS usuarioId, artista_id AS artistaId, expira_em AS expiraEm
             FROM mercadopago_oauth_states
             WHERE state = ?
             FOR UPDATE`,
            [state]
        )
        if (!rows.length) {
            return null
        }
        await executarQuery('DELETE FROM mercadopago_oauth_states WHERE state = ?', [state])
        if (new Date(rows[0].expiraEm).getTime() <= Date.now()) {
            return null
        }
        return rows[0]
    })
}

async function salvarContaRecebedora({
    artistaId,
    proprietarioId,
    mercadoPagoUsuarioId,
    accessToken,
    refreshToken,
    expiraEm
}) {
    const resultado = await query(
        `INSERT INTO artista_contas_pagamento
            (artista_id, mp_user_id, access_token_enc, refresh_token_enc, token_expira_em)
         SELECT ?, ?, ?, ?, ?
         FROM artistas_independentes ai
         WHERE ai.artista_id = ? AND ai.usuario_id = ?
         ON DUPLICATE KEY UPDATE
            mp_user_id = VALUES(mp_user_id),
            access_token_enc = VALUES(access_token_enc),
            refresh_token_enc = VALUES(refresh_token_enc),
            token_expira_em = VALUES(token_expira_em),
            atualizado_em = CURRENT_TIMESTAMP`,
        [artistaId, mercadoPagoUsuarioId, accessToken, refreshToken, expiraEm, artistaId, proprietarioId]
    )
    if (!resultado.affectedRows) {
        throw new Error('O artista deixou de pertencer ao usuário que iniciou a conexão Mercado Pago.')
    }
}

async function buscarContaRecebedora(artistaId) {
    const rows = await query(
        `SELECT artista_id AS artistaId, mp_user_id AS mercadoPagoUsuarioId,
                access_token_enc AS accessToken, refresh_token_enc AS refreshToken,
                token_expira_em AS expiraEm
         FROM artista_contas_pagamento
         WHERE artista_id = ?
         LIMIT 1`,
        [artistaId]
    )
    return rows[0] || null
}

async function atualizarTokensRecebedora(artistaId, {
    accessToken,
    refreshToken,
    expiraEm,
    mercadoPagoUsuarioId
}) {
    await query(
        `UPDATE artista_contas_pagamento
         SET access_token_enc = ?,
             refresh_token_enc = ?,
             token_expira_em = ?,
             mp_user_id = ?,
             atualizado_em = CURRENT_TIMESTAMP
         WHERE artista_id = ?`,
        [accessToken, refreshToken, expiraEm, mercadoPagoUsuarioId, artistaId]
    )
}

async function criarApoio({ referencia, artistaId, usuarioId, valor }) {
    await query(
        `INSERT INTO apoios_artistas
            (referencia, artista_id, apoiador_usuario_id, valor, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [referencia, artistaId, usuarioId, valor]
    )
}

async function salvarPreferencia(referencia, preferenceId) {
    await query(
        `UPDATE apoios_artistas
         SET mp_preference_id = ?
         WHERE referencia = ? AND status = 'pending'`,
        [preferenceId, referencia]
    )
}

async function removerApoioPendente(referencia) {
    await query(
        `DELETE FROM apoios_artistas
         WHERE referencia = ? AND status = 'pending' AND mp_payment_id IS NULL`,
        [referencia]
    )
}

async function buscarApoio(referencia, usuarioId) {
    const rows = await query(
        `SELECT aa.referencia, aa.valor, aa.status, aa.status_detalhe AS statusDetalhe,
                aa.criado_em AS criadoEm, ar.nome AS artista
         FROM apoios_artistas aa
         INNER JOIN artistas ar ON ar.id = aa.artista_id
         WHERE aa.referencia = ? AND aa.apoiador_usuario_id = ?
         LIMIT 1`,
        [referencia, usuarioId]
    )
    return rows[0] || null
}

async function buscarContaPorUsuarioMercadoPago(usuarioMercadoPagoId) {
    const rows = await query(
        `SELECT artista_id AS artistaId, mp_user_id AS mercadoPagoUsuarioId,
                access_token_enc AS accessToken, refresh_token_enc AS refreshToken,
                token_expira_em AS expiraEm
         FROM artista_contas_pagamento
         WHERE mp_user_id = ?
         LIMIT 1`,
        [usuarioMercadoPagoId]
    )
    return rows[0] || null
}

async function confirmarPagamento({
    referencia,
    paymentId,
    status,
    statusDetalhe,
    valor,
    currencyId,
    collectorId
}) {
    const permitidos = new Set([
        'pending',
        'approved',
        'authorized',
        'in_process',
        'in_mediation',
        'rejected',
        'cancelled',
        'refunded',
        'charged_back'
    ])
    if (!permitidos.has(status)) {
        throw new Error(`Status de pagamento Mercado Pago desconhecido: ${status}`)
    }
    const estadosFinais = new Set(['approved', 'rejected', 'cancelled', 'refunded', 'charged_back'])

    return withTransaction(async (executarQuery) => {
        const rows = await executarQuery(
            `SELECT artista_id AS artistaId, valor, status, mp_payment_id AS pagamentoId
             FROM apoios_artistas
             WHERE referencia = ?
             FOR UPDATE`,
            [referencia]
        )
        if (!rows.length) {
            return false
        }
        const apoio = rows[0]
        const contas = await executarQuery(
            `SELECT mp_user_id AS usuarioMercadoPagoId
             FROM artista_contas_pagamento
             WHERE artista_id = ?
             LIMIT 1`,
            [apoio.artistaId]
        )
        if (
            !contas.length ||
            String(contas[0].usuarioMercadoPagoId) !== String(collectorId) ||
            currencyId !== 'BRL' ||
            Math.round(Number(apoio.valor) * 100) !== Math.round(Number(valor) * 100)
        ) {
            return false
        }
        if (apoio.pagamentoId && String(apoio.pagamentoId) !== String(paymentId)) {
            return false
        }
        const estornoPosterior = apoio.status === 'approved' &&
            ['refunded', 'charged_back'].includes(status)
        if (estadosFinais.has(apoio.status) && apoio.status !== status && !estornoPosterior) {
            return false
        }
        await executarQuery(
            `UPDATE apoios_artistas
             SET mp_payment_id = ?,
                 status = ?,
                 status_detalhe = ?,
                 atualizado_em = CURRENT_TIMESTAMP
             WHERE referencia = ?`,
            [paymentId, status, String(statusDetalhe || '').slice(0, 100) || null, referencia]
        )
        return true
    })
}

module.exports = {
    buscarProprietarioArtista,
    obterEstadoArtista,
    criarEstadoOAuth,
    consumirEstadoOAuth,
    salvarContaRecebedora,
    buscarContaRecebedora,
    atualizarTokensRecebedora,
    criarApoio,
    salvarPreferencia,
    removerApoioPendente,
    buscarApoio,
    buscarContaPorUsuarioMercadoPago,
    confirmarPagamento
}
