require('dotenv').config()

const { query, withTransaction, encerrar } = require('../database/conexao')

const artistaNome = 'Avenged Sevenfold'
const generoNome = 'Metal'
const albuns = [
    {
        titulo: 'Sounding the Seventh Trumpet',
        data: '2001-07-24',
        deezerId: '572786'
    },
    { titulo: 'Waking the Fallen', data: '2003-08-26', deezerId: '572787' },
    { titulo: 'City of Evil', data: '2005-06-07', deezerId: '345029' },
    { titulo: 'Avenged Sevenfold', data: '2007-10-30', deezerId: '1347100' },
    { titulo: 'Nightmare', data: '2010-07-27', deezerId: '1346846' },
    { titulo: 'Hail to the King', data: '2013-08-23', deezerId: '6872781' },
    { titulo: 'The Stage', data: '2016-10-28', deezerId: '14411836' },
    {
        titulo: 'Life Is But a Dream...',
        data: '2023-06-02',
        deezerId: '442663417'
    }
]

function normalizar(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
}

async function buscarAlbum(alvo) {
    let resposta
    try {
        resposta = await fetch(
            `https://api.deezer.com/album/${encodeURIComponent(alvo.deezerId)}`,
            { signal: AbortSignal.timeout(15000) }
        )
    } catch (error) {
        throw new Error(`Não foi possível consultar Deezer para "${alvo.titulo}": ${error.message}`)
    }
    if (!resposta.ok) {
        throw new Error(`Deezer respondeu HTTP ${resposta.status} para "${alvo.titulo}".`)
    }

    const album = await resposta.json()
    if (
        normalizar(album.title) !== normalizar(alvo.titulo) ||
        normalizar(album.artist?.name) !== normalizar(artistaNome) ||
        !album.cover_xl ||
        !Array.isArray(album.tracks?.data) ||
        !album.tracks.data.length ||
        album.tracks.data.length !== album.nb_tracks
    ) {
        throw new Error(`Os dados de "${alvo.titulo}" não correspondem ao álbum completo esperado.`)
    }

    const faixas = album.tracks.data.map((faixa, indice) => ({
        titulo: faixa.title,
        numero: indice + 1,
        duracao: Number(faixa.duration)
    }))
    if (faixas.some((faixa) =>
        typeof faixa.titulo !== 'string' ||
        !faixa.titulo.trim() ||
        !Number.isFinite(faixa.duracao) ||
        faixa.duracao < 0
    )) {
        throw new Error(`A lista de faixas de "${alvo.titulo}" está incompleta ou inválida.`)
    }

    return {
        ...alvo,
        capa: album.cover_xl,
        faixas
    }
}

async function main() {
    if (!process.argv.includes('--execute')) {
        throw new Error('Este script grava no banco. Execute com --execute para confirmar.')
    }

    const generos = await query(
        'SELECT id FROM generos WHERE nome = ? LIMIT 1',
        [generoNome]
    )
    if (!generos.length) {
        throw new Error(`O gênero "${generoNome}" não foi encontrado no banco.`)
    }

    const dadosAlbuns = []
    for (const alvo of albuns) {
        dadosAlbuns.push(await buscarAlbum(alvo))
    }

    const resumo = await withTransaction(async (executarQuery) => {
        const artistas = await executarQuery(
            'SELECT id FROM artistas WHERE nome = ? LIMIT 1 FOR UPDATE',
            [artistaNome]
        )
        let artistaId = artistas[0]?.id
        if (!artistaId) {
            const insercao = await executarQuery(
                'INSERT INTO artistas (nome, genero_id) VALUES (?, ?)',
                [artistaNome, generos[0].id]
            )
            artistaId = insercao.insertId
        }

        const resultados = []
        for (const album of dadosAlbuns) {
            const existentes = await executarQuery(
                `SELECT id, titulo, capa_url AS capa
                 FROM albuns
                 WHERE artista_id = ?
                 FOR UPDATE`,
                [artistaId]
            )
            const existente = existentes.find((item) =>
                normalizar(item.titulo) === normalizar(album.titulo)
            )

            let albumId = existente?.id
            let adicionado = false
            let capaAdicionada = false
            if (!existente) {
                const insercao = await executarQuery(
                    `INSERT INTO albuns
                        (artista_id, genero_id, titulo, data_lancamento, capa_url)
                     VALUES (?, ?, ?, ?, ?)`,
                    [artistaId, generos[0].id, album.titulo, album.data, album.capa]
                )
                albumId = insercao.insertId
                adicionado = true
                capaAdicionada = true
            } else if (!existente.capa) {
                await executarQuery(
                    `UPDATE albuns SET capa_url = ?
                     WHERE id = ? AND (capa_url IS NULL OR TRIM(capa_url) = '')`,
                    [album.capa, albumId]
                )
                capaAdicionada = true
            }

            const faixasExistentes = await executarQuery(
                'SELECT COUNT(*) AS total FROM musicas WHERE album_id = ?',
                [albumId]
            )
            const totalFaixas = Number(faixasExistentes[0].total)
            if (totalFaixas === 0) {
                for (const faixa of album.faixas) {
                    await executarQuery(
                        `INSERT INTO musicas
                            (album_id, genero_id, titulo, numero_faixa, duracao_seg)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            albumId,
                            generos[0].id,
                            faixa.titulo.trim(),
                            faixa.numero,
                            faixa.duracao
                        ]
                    )
                }
            } else if (totalFaixas !== album.faixas.length) {
                throw new Error(
                    `"${album.titulo}" já tem ${totalFaixas} faixas; Deezer lista ${album.faixas.length}. Nenhuma alteração foi confirmada.`
                )
            }

            resultados.push({
                titulo: album.titulo,
                albumId: String(albumId),
                adicionado,
                capaAdicionada,
                faixasAdicionadas: totalFaixas === 0 ? album.faixas.length : 0,
                faixasExistentes: totalFaixas
            })
        }
        return resultados
    })

    console.log(JSON.stringify(resumo, null, 2))
}

main()
    .catch((error) => {
        console.error('Não foi possível completar o catálogo do Avenged Sevenfold:', error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        try {
            await encerrar()
        } catch (error) {
            console.error('Não foi possível encerrar a conexão com o banco:', error.message)
            process.exitCode = 1
        }
    })
