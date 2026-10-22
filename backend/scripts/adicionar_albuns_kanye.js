require('dotenv').config()

const { query, withTransaction } = require('../database/conexao')

const artista = 'Kanye West'
const genero = 'Rap/Hip Hop'
const albuns = [
    {
        titulo: 'Late Registration',
        dataLancamento: '2005-08-30',
        fonte: 'itunes',
        idFonte: '1440763821'
    },
    {
        titulo: '808s & Heartbreak',
        dataLancamento: '2008-11-24',
        fonte: 'itunes',
        idFonte: '1441410287'
    },
    {
        titulo: 'Yeezus',
        dataLancamento: '2013-06-18',
        fonte: 'deezer',
        idFonte: '6694046'
    },
    {
        titulo: 'Watch the Throne',
        dataLancamento: '2011-08-08',
        fonte: 'itunes',
        idFonte: '1442227821',
        artistaFonte: 'JAŸ-Z & Kanye West'
    },
    {
        titulo: 'The Life of Pablo',
        dataLancamento: '2016-02-14',
        fonte: 'itunes',
        idFonte: '1442966257'
    },
    {
        titulo: 'ye',
        dataLancamento: '2018-06-01',
        fonte: 'itunes',
        idFonte: '1441460375'
    },
    {
        titulo: 'KIDS SEE GHOSTS',
        dataLancamento: '2018-06-08',
        fonte: 'itunes',
        idFonte: '1397651890',
        artistaFonte: 'KIDS SEE GHOSTS, Kanye West & Kid Cudi'
    },
    {
        titulo: 'Jesus Is King',
        dataLancamento: '2019-10-25',
        fonte: 'itunes',
        idFonte: '1484936940'
    },
    {
        titulo: 'Donda',
        dataLancamento: '2021-08-29',
        fonte: 'itunes',
        idFonte: '1587795158'
    },
    {
        titulo: 'VULTURES 1',
        dataLancamento: '2024-02-09',
        fonte: 'deezer',
        idFonte: '624563281',
        artistaFonte: '¥$'
    },
    {
        titulo: 'VULTURES 2',
        dataLancamento: '2024-08-03',
        fonte: 'deezer',
        idFonte: '976440381',
        artistaFonte: '¥$'
    },
    {
        titulo: 'BULLY',
        dataLancamento: '2026-03-28',
        fonte: 'deezer',
        idFonte: '949407771'
    }
]

function normalizar(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
}

async function buscarJson(url, provedor) {
    let resposta
    try {
        resposta = await fetch(url, { signal: AbortSignal.timeout(15000) })
    } catch (error) {
        throw new Error(`Não foi possível consultar ${provedor}: ${error.message}`)
    }
    if (!resposta.ok) {
        throw new Error(`${provedor} respondeu HTTP ${resposta.status}.`)
    }
    return resposta.json()
}

function urlCapaItunes(url) {
    return url
        .replace(/\/\d+x\d+bb\./, '/600x600bb.')
        .replace(/\/100x100bb\./, '/600x600bb.')
}

async function carregarAlbum(album) {
    if (album.fonte === 'deezer') {
        const dados = await buscarJson(
            `https://api.deezer.com/album/${encodeURIComponent(album.idFonte)}`,
            'Deezer'
        )
        if (
            normalizar(dados.title) !== normalizar(album.titulo) ||
            normalizar(dados.artist?.name) !== normalizar(album.artistaFonte || artista) ||
            !dados.cover_xl ||
            !Array.isArray(dados.tracks?.data)
        ) {
            throw new Error(`Os dados do álbum "${album.titulo}" não correspondem ao catálogo Deezer.`)
        }
        return {
            capa: dados.cover_xl,
            faixas: dados.tracks.data.map((faixa, indice) => ({
                titulo: faixa.title,
                numero: indice + 1,
                duracao: Number(faixa.duration)
            }))
        }
    }

    const dados = await buscarJson(
        `https://itunes.apple.com/lookup?id=${encodeURIComponent(album.idFonte)}&entity=song&limit=200&country=US`,
        'iTunes'
    )
    const dadosAlbum = dados.results?.find((item) => item.wrapperType === 'collection')
    const faixas = (dados.results || [])
        .filter((item) => item.wrapperType === 'track' && item.kind === 'song')
        .map((faixa) => ({
            titulo: faixa.trackName,
            numero: Number(faixa.trackNumber),
            duracao: Math.round(Number(faixa.trackTimeMillis) / 1000)
        }))
    if (
        normalizar(dadosAlbum?.collectionName) !== normalizar(album.titulo) ||
        normalizar(dadosAlbum?.artistName) !== normalizar(album.artistaFonte || artista) ||
        !dadosAlbum?.artworkUrl100 ||
        !faixas.length
    ) {
        throw new Error(`Os dados do álbum "${album.titulo}" não correspondem ao catálogo iTunes.`)
    }
    return {
        capa: urlCapaItunes(dadosAlbum.artworkUrl100),
        faixas
    }
}

function validarFaixas(album, faixas) {
    if (!faixas.length || faixas.some((faixa) =>
        typeof faixa.titulo !== 'string' ||
        !faixa.titulo.trim() ||
        !Number.isInteger(faixa.numero) ||
        faixa.numero < 1 ||
        !Number.isFinite(faixa.duracao) ||
        faixa.duracao < 0
    )) {
        throw new Error(`A lista de faixas de "${album.titulo}" está incompleta ou inválida.`)
    }
    const numeros = new Set(faixas.map((faixa) => faixa.numero))
    if (numeros.size !== faixas.length) {
        throw new Error(`A lista de faixas de "${album.titulo}" contém números duplicados.`)
    }
    faixas.sort((a, b) => a.numero - b.numero)
}

async function salvarAlbum(album, dados, artistaId, generoId) {
    return withTransaction(async (executarQuery) => {
        const existentes = await executarQuery(
            `SELECT id, titulo, capa_url AS capa
             FROM albuns
             WHERE artista_id = ?`,
            [artistaId]
        )
        const registro = existentes.find((item) =>
            normalizar(item.titulo) === normalizar(album.titulo)
        )
        let albumId = registro?.id
        let adicionado = false

        if (!registro) {
            const insercao = await executarQuery(
                `INSERT INTO albuns
                    (artista_id, genero_id, titulo, data_lancamento, capa_url)
                 VALUES (?, ?, ?, ?, ?)`,
                [artistaId, generoId, album.titulo, album.dataLancamento, dados.capa]
            )
            albumId = insercao.insertId
            adicionado = true
        } else if (!registro.capa) {
            await executarQuery(
                `UPDATE albuns SET capa_url = ? WHERE id = ? AND (capa_url IS NULL OR capa_url = '')`,
                [dados.capa, albumId]
            )
        }

        const existentesFaixas = await executarQuery(
            `SELECT COUNT(*) AS total FROM musicas WHERE album_id = ?`,
            [albumId]
        )
        const totalFaixas = Number(existentesFaixas[0].total)
        if (totalFaixas === 0) {
            for (const faixa of dados.faixas) {
                await executarQuery(
                    `INSERT INTO musicas
                        (album_id, genero_id, titulo, numero_faixa, duracao_seg)
                     VALUES (?, ?, ?, ?, ?)`,
                    [albumId, generoId, faixa.titulo.trim(), faixa.numero, faixa.duracao]
                )
            }
        } else if (totalFaixas !== dados.faixas.length) {
            throw new Error(
                `O álbum "${album.titulo}" já possui ${totalFaixas} faixas, mas a fonte possui ${dados.faixas.length}; nenhuma faixa foi alterada.`
            )
        }

        return {
            albumId: String(albumId),
            adicionado,
            capaAdicionada: !registro?.capa,
            faixasAdicionadas: totalFaixas === 0 ? dados.faixas.length : 0,
            faixasExistentes: totalFaixas
        }
    })
}

async function main() {
    if (!process.argv.includes('--execute')) {
        throw new Error('Este script grava no banco. Execute com --execute para confirmar.')
    }

    const artistas = await query(
        'SELECT id FROM artistas WHERE nome = ? LIMIT 1',
        [artista]
    )
    const generos = await query(
        'SELECT id FROM generos WHERE nome = ? LIMIT 1',
        [genero]
    )
    if (!artistas.length || !generos.length) {
        throw new Error('O artista Kanye West ou o gênero Rap/Hip Hop não foi encontrado no banco.')
    }

    const resumo = []
    for (const album of albuns) {
        const dados = await carregarAlbum(album)
        validarFaixas(album, dados.faixas)
        const resultado = await salvarAlbum(album, dados, artistas[0].id, generos[0].id)
        resumo.push({
            titulo: album.titulo,
            ...resultado
        })
    }

    console.log(JSON.stringify(resumo, null, 2))
}

main()
    .catch((error) => {
        console.error('Não foi possível completar o catálogo de Kanye West:', error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        const { encerrar } = require('../database/conexao')
        try {
            await encerrar()
        } catch (error) {
            console.error('Não foi possível encerrar a conexão com o banco:', error.message)
            process.exitCode = 1
        }
    })
