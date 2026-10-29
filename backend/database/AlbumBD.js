const { query, withTransaction } = require('./conexao')

function mapAlbum(row) {
    return {
        id: String(row.id),
        titulo: row.titulo,
        artista: row.artista,
        ano: row.ano ? String(row.ano) : null,
        genero: row.genero || null,
        imagem: row.imagem || null,
        mediaNota: row.mediaNota === null ? null : Number(row.mediaNota),
        totalAvaliacoes: Number(row.totalAvaliacoes),
        artistaId: String(row.artistaId),
        generoId: row.generoId === null ? null : String(row.generoId)
    }
}

async function listar(busca) {
    const filtro = busca ? `%${busca}%` : null
    const rows = await query(
        `SELECT a.id, a.titulo, ar.id AS artistaId, ar.nome AS artista,
                YEAR(a.data_lancamento) AS ano, g.id AS generoId, g.nome AS genero,
                a.capa_url AS imagem, v.media_nota AS mediaNota,
                COALESCE(v.total_avaliacoes, 0) AS totalAvaliacoes
         FROM albuns a
         INNER JOIN artistas ar ON ar.id = a.artista_id
         LEFT JOIN generos g ON g.id = a.genero_id
         LEFT JOIN vw_media_albuns v ON v.album_id = a.id
         WHERE (? IS NULL OR a.titulo LIKE ? OR ar.nome LIKE ? OR g.nome LIKE ?
                OR EXISTS (
                    SELECT 1 FROM musicas m
                    WHERE m.album_id = a.id AND m.titulo LIKE ?
                ))
         ORDER BY COALESCE(g.nome, 'Outros') COLLATE utf8mb4_general_ci,
                  a.titulo COLLATE utf8mb4_general_ci`,
        [filtro, filtro, filtro, filtro, filtro]
    )

    const categorias = new Map()
    for (const row of rows) {
        const tituloCategoria = row.genero || 'Outros'
        if (!categorias.has(tituloCategoria)) {
            categorias.set(tituloCategoria, {
                id: row.generoId ? String(row.generoId) : 'outros',
                titulo: tituloCategoria,
                albuns: []
            })
        }
        categorias.get(tituloCategoria).albuns.push(mapAlbum(row))
    }
    return Array.from(categorias.values())
}

async function buscarPorId(id) {
    const rows = await query(
        `SELECT a.id, a.titulo, ar.id AS artistaId, ar.nome AS artista,
                YEAR(a.data_lancamento) AS ano, g.id AS generoId, g.nome AS genero,
                a.capa_url AS imagem, v.media_nota AS mediaNota,
                COALESCE(v.total_avaliacoes, 0) AS totalAvaliacoes
         FROM albuns a
         INNER JOIN artistas ar ON ar.id = a.artista_id
         LEFT JOIN generos g ON g.id = a.genero_id
         LEFT JOIN vw_media_albuns v ON v.album_id = a.id
         WHERE a.id = ?
         LIMIT 1`,
        [id]
    )
    if (!rows.length) {
        return null
    }

    const album = mapAlbum(rows[0])
    album.musicas = await query(
        `SELECT id, titulo, numero_faixa AS numeroFaixa,
                duracao_seg AS duracaoSegundos,
                CASE WHEN EXISTS (
                    SELECT 1
                    FROM artistas_independentes ai
                    INNER JOIN albuns ai_album ON ai_album.artista_id = ai.artista_id
                    WHERE ai_album.id = ?
                ) THEN NULL ELSE audio_url END AS audioUrl
         FROM musicas
         WHERE album_id = ?
         ORDER BY numero_faixa`,
        [id, id]
    )
    return album
}

async function listarPorGenero(generoId) {
    const rows = await query(
        `SELECT a.id, a.titulo, ar.id AS artistaId, ar.nome AS artista,
                YEAR(a.data_lancamento) AS ano, g.id AS generoId, g.nome AS genero,
                a.capa_url AS imagem, v.media_nota AS mediaNota,
                COALESCE(v.total_avaliacoes, 0) AS totalAvaliacoes
         FROM albuns a
         INNER JOIN artistas ar ON ar.id = a.artista_id
         INNER JOIN generos g ON g.id = a.genero_id
         LEFT JOIN vw_media_albuns v ON v.album_id = a.id
         WHERE g.id = ?
         ORDER BY a.titulo COLLATE utf8mb4_general_ci`,
        [generoId]
    )
    return rows.map(mapAlbum)
}

async function buscarGenero(generoId) {
    const rows = await query(
        'SELECT id, nome FROM generos WHERE id = ? LIMIT 1',
        [generoId]
    )
    return rows[0] || null
}

async function listarArtistas(busca) {
    const filtro = busca ? `%${busca}%` : null
    const rows = await query(
        `SELECT ar.id, ar.nome, ar.pais,
                COALESCE(ar.foto_url, MIN(a.capa_url)) AS foto,
                COUNT(DISTINCT a.id) AS totalAlbuns
         FROM artistas ar
         LEFT JOIN albuns a ON a.artista_id = ar.id
         WHERE ? IS NULL OR ar.nome LIKE ? OR EXISTS (
             SELECT 1 FROM albuns ax
             WHERE ax.artista_id = ar.id AND ax.titulo LIKE ?
         )
         GROUP BY ar.id, ar.nome, ar.pais, ar.foto_url
         ORDER BY ar.nome COLLATE utf8mb4_general_ci`,
        [filtro, filtro, filtro]
    )
    return rows.map((row) => ({
        id: String(row.id),
        nome: row.nome,
        pais: row.pais || null,
        foto: row.foto || null,
        totalAlbuns: Number(row.totalAlbuns)
    }))
}

async function buscarArtista(artistaId) {
    const rows = await query(
        `SELECT ar.id, ar.nome, ar.pais, ar.biografia, ar.spotify_url AS spotifyUrl,
                COALESCE(ar.foto_url, MIN(a.capa_url)) AS foto,
                COUNT(DISTINCT a.id) AS totalAlbuns
         FROM artistas ar
         LEFT JOIN albuns a ON a.artista_id = ar.id
         WHERE ar.id = ?
         GROUP BY ar.id, ar.nome, ar.pais, ar.biografia, ar.spotify_url, ar.foto_url
         LIMIT 1`,
        [artistaId]
    )
    return rows[0] || null
}

async function listarPorArtista(artistaId) {
    const rows = await query(
        `SELECT a.id, a.titulo, ar.id AS artistaId, ar.nome AS artista,
                YEAR(a.data_lancamento) AS ano, g.id AS generoId, g.nome AS genero,
                a.capa_url AS imagem, v.media_nota AS mediaNota,
                COALESCE(v.total_avaliacoes, 0) AS totalAvaliacoes
         FROM albuns a
         INNER JOIN artistas ar ON ar.id = a.artista_id
         LEFT JOIN generos g ON g.id = a.genero_id
         LEFT JOIN vw_media_albuns v ON v.album_id = a.id
         WHERE ar.id = ?
         ORDER BY a.data_lancamento, a.titulo`,
        [artistaId]
    )
    return rows.map(mapAlbum)
}

async function listarGeneros() {
    const rows = await query(
        'SELECT id, nome FROM generos ORDER BY nome COLLATE utf8mb4_general_ci'
    )
    return rows.map((row) => ({ id: String(row.id), nome: row.nome }))
}

async function listarArtistasIndependentes() {
    const rows = await query(
        `SELECT ar.id, ar.nome, ar.pais, ar.biografia,
                COALESCE(ar.foto_url, MIN(a.capa_url)) AS foto,
                COUNT(DISTINCT a.id) AS totalAlbuns
         FROM artistas_independentes ai
         INNER JOIN artistas ar ON ar.id = ai.artista_id
         LEFT JOIN albuns a ON a.artista_id = ar.id
         GROUP BY ar.id, ar.nome, ar.pais, ar.biografia, ar.foto_url
         ORDER BY ar.nome COLLATE utf8mb4_general_ci`
    )
    return rows.map((row) => ({
        id: String(row.id),
        nome: row.nome,
        pais: row.pais || null,
        biografia: row.biografia || null,
        foto: row.foto || null,
        totalAlbuns: Number(row.totalAlbuns)
    }))
}

async function listarAlbunsIndependentes() {
    const rows = await query(
        `SELECT ar.id AS artistaId, ar.nome AS artista,
                a.id, a.titulo, YEAR(a.data_lancamento) AS ano,
                g.id AS generoId, g.nome AS genero, a.capa_url AS imagem,
                v.media_nota AS mediaNota,
                COALESCE(v.total_avaliacoes, 0) AS totalAvaliacoes
         FROM artistas_independentes ai
         INNER JOIN artistas ar ON ar.id = ai.artista_id
         INNER JOIN albuns a ON a.artista_id = ar.id
         LEFT JOIN generos g ON g.id = a.genero_id
         LEFT JOIN vw_media_albuns v ON v.album_id = a.id
         ORDER BY ar.nome COLLATE utf8mb4_general_ci,
                  a.data_lancamento DESC,
                  a.titulo COLLATE utf8mb4_general_ci`
    )
    const artistas = new Map()
    for (const row of rows) {
        const id = String(row.artistaId)
        if (!artistas.has(id)) {
            artistas.set(id, {
                id,
                nome: row.artista,
                albuns: []
            })
        }
        artistas.get(id).albuns.push(mapAlbum(row))
    }
    return Array.from(artistas.values())
}

async function buscarArtistaDuplicado(nome, executarQuery = query) {
    const rows = await executarQuery(
        'SELECT id FROM artistas WHERE nome = ? LIMIT 1',
        [nome]
    )
    return rows[0] || null
}

async function cadastrarArtistaIndependente({
    usuarioId,
    nome,
    pais,
    biografia,
    spotifyUrl,
    generoId,
    tituloAlbum,
    dataLancamento,
    capaUrl,
    faixas
}) {
    return withTransaction(async (executarQuery) => {
        const artistasDoUsuario = await executarQuery(
            `SELECT ar.id
             FROM artistas_independentes ai
             INNER JOIN artistas ar ON ar.id = ai.artista_id
             WHERE ai.usuario_id = ? AND ar.nome = ?
             LIMIT 1`,
            [usuarioId, nome]
        )
        let artistaId = artistasDoUsuario[0]?.id

        if (!artistaId && await buscarArtistaDuplicado(nome, executarQuery)) {
            const error = new Error('Já existe um artista com esse nome no catálogo.')
            error.statusCode = 409
            throw error
        }

        if (artistaId) {
            await executarQuery(
                `UPDATE artistas
                 SET genero_id = ?,
                     pais = COALESCE(NULLIF(?, ''), pais),
                     biografia = COALESCE(NULLIF(?, ''), biografia),
                     spotify_url = COALESCE(NULLIF(?, ''), spotify_url)
                 WHERE id = ?`,
                [generoId, pais || '', biografia || '', spotifyUrl || '', artistaId]
            )
        } else {
            const artista = await executarQuery(
                `INSERT INTO artistas (nome, genero_id, pais, biografia, spotify_url)
                 VALUES (?, ?, ?, ?, ?)`,
                [nome, generoId, pais || null, biografia || null, spotifyUrl || null]
            )
            artistaId = artista.insertId
            await executarQuery(
                'INSERT INTO artistas_independentes (artista_id, usuario_id) VALUES (?, ?)',
                [artistaId, usuarioId]
            )
        }

        const albumExistente = await executarQuery(
            'SELECT id FROM albuns WHERE artista_id = ? AND titulo = ? LIMIT 1',
            [artistaId, tituloAlbum]
        )
        if (albumExistente.length) {
            const error = new Error('Este artista já possui um álbum com esse nome.')
            error.statusCode = 409
            throw error
        }
        const album = await executarQuery(
            `INSERT INTO albuns
                (artista_id, genero_id, titulo, data_lancamento, capa_url)
             VALUES (?, ?, ?, ?, ?)`,
            [artistaId, generoId, tituloAlbum, dataLancamento || null, capaUrl || null]
        )

        for (const [indice, faixa] of faixas.entries()) {
            await executarQuery(
                `INSERT INTO musicas
                    (album_id, genero_id, titulo, numero_faixa, duracao_seg, audio_url)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    album.insertId,
                    generoId,
                    faixa.titulo,
                    indice + 1,
                    null,
                    null
                ]
            )
        }

        return {
            artistaId: String(artistaId),
            albumId: String(album.insertId)
        }
    })
}

async function listarAvaliacoes(albumId) {
    return query(
        `SELECT av.id, av.nota, COALESCE(av.comentario, '') AS comentario, u.name AS autor,
                DATE_FORMAT(av.criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criadoEm
         FROM avaliacoes_albuns av
         INNER JOIN usuarios u ON u.id = av.usuario_id
         WHERE av.album_id = ?
         ORDER BY av.criado_em DESC, av.id DESC`,
        [albumId]
    )
}

async function salvarAvaliacao({ usuarioId, albumId, nota, comentario }) {
    await query(
        `INSERT INTO avaliacoes_albuns (usuario_id, album_id, nota, comentario)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            nota = VALUES(nota),
            comentario = VALUES(comentario),
            atualizado_em = CURRENT_TIMESTAMP`,
        [usuarioId, albumId, nota, comentario]
    )

    const rows = await query(
        `SELECT av.id, av.nota, COALESCE(av.comentario, '') AS comentario, u.name AS autor,
                DATE_FORMAT(av.criado_em, '%Y-%m-%dT%H:%i:%sZ') AS criadoEm
         FROM avaliacoes_albuns av
         INNER JOIN usuarios u ON u.id = av.usuario_id
         WHERE av.usuario_id = ? AND av.album_id = ?
         LIMIT 1`,
        [usuarioId, albumId]
    )
    return rows[0]
}

async function listarFavoritos(usuarioId) {
    const rows = await query(
        `SELECT a.id, a.titulo, ar.id AS artistaId, ar.nome AS artista,
                YEAR(a.data_lancamento) AS ano, g.id AS generoId, g.nome AS genero,
                a.capa_url AS imagem, v.media_nota AS mediaNota,
                COALESCE(v.total_avaliacoes, 0) AS totalAvaliacoes
         FROM favoritos_albuns f
         INNER JOIN albuns a ON a.id = f.album_id
         INNER JOIN artistas ar ON ar.id = a.artista_id
         LEFT JOIN generos g ON g.id = a.genero_id
         LEFT JOIN vw_media_albuns v ON v.album_id = a.id
         WHERE f.usuario_id = ?
         ORDER BY f.criado_em DESC, a.titulo COLLATE utf8mb4_general_ci`,
        [usuarioId]
    )
    return rows.map(mapAlbum)
}

async function possuiFavorito(usuarioId, albumId) {
    const rows = await query(
        `SELECT 1
         FROM favoritos_albuns
         WHERE usuario_id = ? AND album_id = ?
         LIMIT 1`,
        [usuarioId, albumId]
    )
    return rows.length > 0
}

async function adicionarFavorito(usuarioId, albumId) {
    await query(
        `INSERT IGNORE INTO favoritos_albuns (usuario_id, album_id)
         VALUES (?, ?)`,
        [usuarioId, albumId]
    )
}

async function removerFavorito(usuarioId, albumId) {
    await query(
        `DELETE FROM favoritos_albuns
         WHERE usuario_id = ? AND album_id = ?`,
        [usuarioId, albumId]
    )
}

module.exports = {
    listar,
    buscarPorId,
    listarFavoritos,
    possuiFavorito,
    adicionarFavorito,
    removerFavorito,
    listarPorGenero,
    buscarGenero,
    listarArtistas,
    buscarArtista,
    listarPorArtista,
    listarGeneros,
    listarArtistasIndependentes,
    listarAlbunsIndependentes,
    cadastrarArtistaIndependente,
    listarAvaliacoes,
    salvarAvaliacao
}
