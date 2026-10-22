require('dotenv').config()

const mysql = require('mysql')

const albunsFamosos = [
    { artista: 'Michael Jackson', titulo: 'Thriller', genero: 'Pop' },
    { artista: 'Michael Jackson', titulo: 'Bad', genero: 'Pop' },
    { artista: 'Fleetwood Mac', titulo: 'Rumours', genero: 'Rock' },
    { artista: 'Pink Floyd', titulo: 'The Dark Side of the Moon', genero: 'Rock' },
    { artista: 'Nirvana', titulo: 'Nevermind', genero: 'Rock' },
    { artista: 'The Beatles', titulo: 'Abbey Road', genero: 'Rock' },
    { artista: 'Led Zeppelin', titulo: 'Led Zeppelin IV', genero: 'Rock' },
    { artista: 'Queen', titulo: 'A Night at the Opera', genero: 'Rock' },
    { artista: 'Radiohead', titulo: 'OK Computer', genero: 'Rock' },
    { artista: 'Taylor Swift', titulo: '1989', genero: 'Pop' },
    { artista: 'Adele', titulo: '21', genero: 'Pop' },
    { artista: 'Beyoncé', titulo: 'Lemonade', genero: 'Pop' },
    { artista: 'Prince', titulo: 'Purple Rain', genero: 'Pop' },
    { artista: 'Daft Punk', titulo: 'Discovery', genero: 'Eletrônica' },
    { artista: 'Daft Punk', titulo: 'Random Access Memories', genero: 'Eletrônica' },
    { artista: 'Miles Davis', titulo: 'Kind of Blue', genero: 'Jazz' },
    { artista: 'Bob Marley & The Wailers', titulo: 'Legend', genero: 'Reggae' },
    { artista: 'Black Sabbath', titulo: 'Paranoid', genero: 'Metal' },
    { artista: 'Metallica', titulo: 'Metallica', genero: 'Metal' },
    { artista: 'Kendrick Lamar', titulo: 'To Pimp a Butterfly', genero: 'Rap/Hip Hop' },
    { artista: 'Eminem', titulo: 'The Marshall Mathers LP', genero: 'Rap/Hip Hop' },
    { artista: '50 Cent', titulo: 'Get Rich or Die Tryin', genero: 'Rap/Hip Hop' },
    { artista: 'Amy Winehouse', titulo: 'Back to Black', genero: 'Pop' },
    { artista: 'Stevie Wonder', titulo: 'Songs in the Key of Life', genero: 'Funk' }
]

const titulosAlternativos = new Map([
    ['cassiaeller|acusticomtv', ['acusticoaovivo']],
    ['cartola|cartolaii', ['cartola1976']],
    ['galcosta|fatalgalatodovapor', ['galatodovaporlive']],
    ['natiruts|natirutsreggaepower', ['reggaepoweraovivo']],
    ['timmaia|timamaiadiscoclub', ['discoclub']],
    ['zecapagodinho|acusticomtv', ['acusticozecapagodinhodeluxeaovivo']],
    ['micheltelo|michelteloaovivo', ['aovivo', 'aovivoaovivo']]
])
const artistasAlternativos = new Map([
    ['joaogilberto|getzgilberto', ['stangetz']]
])

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loginBD',
    connectionLimit: 2,
    charset: 'utf8mb4'
})

let ultimaConsultaItunes = 0

function query(sql, values = []) {
    return new Promise((resolve, reject) => {
        pool.query(sql, values, (error, results) => {
            if (error) {
                reject(error)
                return
            }
            resolve(results)
        })
    })
}

function normalizar(texto) {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
}

function similar(a, b) {
    const primeiro = normalizar(a)
    const segundo = normalizar(b)
    return primeiro === segundo || primeiro.startsWith(segundo) || segundo.startsWith(primeiro)
}

async function itunes(endpoint, tentativas = 3) {
    let ultimoErro
    for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
        try {
            const espera = Math.max(0, 3500 - (Date.now() - ultimaConsultaItunes))
            if (espera) {
                await new Promise((resolve) => setTimeout(resolve, espera))
            }
            ultimaConsultaItunes = Date.now()
            const resposta = await fetch(endpoint)
            if (!resposta.ok) {
                const erro = new Error(`iTunes respondeu HTTP ${resposta.status}`)
                erro.status = resposta.status
                throw erro
            }
            return await resposta.json()
        } catch (error) {
            ultimoErro = error
            if (tentativa < tentativas) {
                const espera = error.status === 429 ? tentativa * 15000 : tentativa * 1500
                await new Promise((resolve) => setTimeout(resolve, espera))
            }
        }
    }
    throw ultimoErro
}

async function localizarAlbum(artista, titulo) {
    const termos = [`${artista} ${titulo}`, titulo]
    for (const termo of termos) {
        const resposta = await itunes(
            `https://itunes.apple.com/search?term=${encodeURIComponent(termo)}&entity=album&limit=100&country=US`
        )
        const resultados = (resposta.results || []).filter((resultado) =>
            similar(resultado.artistName, artista) && similar(resultado.collectionName, titulo)
        )
        if (resultados.length) {
            resultados.sort((a, b) => {
                const aExato = normalizar(a.collectionName) === normalizar(titulo) ? 1 : 0
                const bExato = normalizar(b.collectionName) === normalizar(titulo) ? 1 : 0
                return bExato - aExato
            })
            return { ...resultados[0], provider: 'itunes' }
        }
    }

    const resposta = await fetch(
        `https://api.deezer.com/search/album?q=${encodeURIComponent(`${artista} ${titulo}`)}`
    )
    if (!resposta.ok) {
        throw new Error(`Deezer respondeu HTTP ${resposta.status}`)
    }
    const dados = await resposta.json()
    const resultados = (dados.data || []).filter((resultado) =>
        typeof resultado.artist?.name === 'string' &&
        typeof resultado.title === 'string' &&
        similar(resultado.artist.name, artista) &&
        similar(resultado.title, titulo)
    )
    resultados.sort((a, b) => {
        const aExato = normalizar(a.title) === normalizar(titulo) ? 1 : 0
        const bExato = normalizar(b.title) === normalizar(titulo) ? 1 : 0
        return bExato - aExato
    })
    const resultado = resultados[0]
    return resultado
        ? {
            provider: 'deezer',
            collectionId: String(resultado.id),
            collectionName: resultado.title,
            artistName: resultado.artist.name,
            artworkUrl100: resultado.cover_xl || resultado.cover_medium,
            releaseDate: resultado.release_date
        }
        : null
}

async function localizarCapaDeezer(artista, titulo) {
    const resposta = await fetch(
        `https://api.deezer.com/search/album?q=${encodeURIComponent(`${artista} ${titulo}`)}`
    )
    if (!resposta.ok) {
        const erro = new Error(`Deezer respondeu HTTP ${resposta.status}`)
        erro.status = resposta.status
        throw erro
    }
    const dados = await resposta.json()
    const artistaAlvo = normalizar(artista)
    const tituloAlvo = normalizar(titulo)
    const aliases = titulosAlternativos.get(`${artistaAlvo}|${tituloAlvo}`) || []
    const artistasAlvo = artista
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .match(/[a-z0-9]{3,}/g) || []
    const aliasesArtista = artistasAlternativos.get(`${artistaAlvo}|${tituloAlvo}`) || []
    const resultados = (dados.data || []).filter((resultado) => {
        if (typeof resultado.artist?.name !== 'string' || typeof resultado.title !== 'string') {
            return false
        }
        const artistaResultado = normalizar(resultado.artist.name)
        const tituloResultado = normalizar(resultado.title)
        const artistaCorrespondente = similar(artistaResultado, artistaAlvo) ||
            artistasAlvo.some((palavra) => artistaResultado.includes(palavra)) ||
            aliasesArtista.some((alias) => artistaResultado.includes(alias))
        const tituloCorrespondente = similar(tituloResultado, tituloAlvo) ||
            aliases.some((alias) => similar(tituloResultado, alias))
        return artistaCorrespondente && tituloCorrespondente
    })
    resultados.sort((a, b) => {
        const aExato = normalizar(a.title) === tituloAlvo ? 1 : 0
        const bExato = normalizar(b.title) === tituloAlvo ? 1 : 0
        return bExato - aExato
    })
    const resultado = resultados[0]
    return resultado?.cover_xl || resultado?.cover_medium || null
}

function capaGrande(url) {
    return url ? url.replace(/\/\d+x\d+bb\./, '/600x600bb.') : null
}

async function obterFaixas(collectionId, provider) {
    if (provider === 'deezer') {
        const resposta = await fetch(`https://api.deezer.com/album/${collectionId}`)
        if (!resposta.ok) {
            throw new Error(`Deezer respondeu HTTP ${resposta.status}`)
        }
        const dados = await resposta.json()
        return (dados.tracks?.data || []).map((faixa) => ({
            trackName: faixa.title,
            trackTimeMillis: Number(faixa.duration) * 1000
        }))
    }
    const resposta = await itunes(
        `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&limit=200&country=US`
    )
    return (resposta.results || []).filter(
        (item) => item.wrapperType === 'track' && item.kind === 'song'
    )
}

async function encontrarArtista(nome, generoId) {
    const existentes = await query('SELECT id, nome FROM artistas')
    const artista = existentes.find((item) => normalizar(item.nome) === normalizar(nome))
    if (artista) {
        return artista
    }
    const resultado = await query(
        'INSERT INTO artistas (nome, genero_id) VALUES (?, ?)',
        [nome, generoId]
    )
    return { id: resultado.insertId, nome }
}

async function adicionarFaixas(albumId, generoId, faixas) {
    if (!faixas.length) {
        return 0
    }
    const existentes = await query(
        'SELECT COUNT(*) AS total FROM musicas WHERE album_id = ?',
        [albumId]
    )
    if (Number(existentes[0].total) > 0) {
        return 0
    }
    for (const [indice, faixa] of faixas.entries()) {
        await query(
            `INSERT INTO musicas
                (album_id, genero_id, titulo, numero_faixa, duracao_seg)
             VALUES (?, ?, ?, ?, ?)`,
            [
                albumId,
                generoId,
                faixa.trackName,
                indice + 1,
                faixa.trackTimeMillis ? Math.round(faixa.trackTimeMillis / 1000) : null
            ]
        )
    }
    return faixas.length
}

async function main() {
    const apenasCapas = process.argv.includes('--covers-only')
    if (!process.argv.includes('--execute')) {
        throw new Error('Este script grava no banco. Execute novamente com --execute para confirmar.')
    }

    const generos = await query('SELECT id, nome FROM generos')
    const generoPorNome = new Map(generos.map((genero) => [normalizar(genero.nome), genero.id]))
    const alvos = await query(
        `SELECT a.id, a.titulo, ar.nome AS artista, a.capa_url AS imagem, a.genero_id AS generoId,
                (SELECT COUNT(*) FROM musicas m WHERE m.album_id = a.id) AS totalFaixas
         FROM albuns a
         INNER JOIN artistas ar ON ar.id = a.artista_id
         WHERE a.capa_url IS NULL OR a.capa_url = ''
            ${apenasCapas ? '' : 'OR NOT EXISTS (SELECT 1 FROM musicas m WHERE m.album_id = a.id)'}`
    )
    const fila = alvos.map((album) => ({
            id: album.id,
            artista: album.artista,
            titulo: album.titulo,
            generoId: album.generoId,
            imagem: album.imagem,
            totalFaixas: Number(album.totalFaixas),
            existente: true
        }))
    if (!apenasCapas) {
        fila.push(...albunsFamosos.map((album) => ({ ...album, existente: false })))
    }

    const resumo = { capasAtualizadas: 0, albunsAdicionados: 0, faixasAdicionadas: 0, semCorrespondencia: [] }

    if (apenasCapas && !process.argv.includes('--itunes')) {
        let proximoIndice = 0
        const trabalhadores = Array.from({ length: Math.min(5, fila.length) }, async () => {
            while (proximoIndice < fila.length) {
                const alvo = fila[proximoIndice]
                proximoIndice += 1
                try {
                    const capa = await localizarCapaDeezer(alvo.artista, alvo.titulo)
                    if (!capa) {
                        resumo.semCorrespondencia.push(`${alvo.artista} — ${alvo.titulo}`)
                        continue
                    }
                    await query('UPDATE albuns SET capa_url = ? WHERE id = ? AND (capa_url IS NULL OR capa_url = \'\')', [
                        capaGrande(capa),
                        alvo.id
                    ])
                    resumo.capasAtualizadas += 1
                } catch (error) {
                    console.error(`Falha em ${alvo.artista} — ${alvo.titulo}: ${error.message}`)
                    resumo.falhas = resumo.falhas || []
                    resumo.falhas.push(`${alvo.artista} — ${alvo.titulo}: ${error.message}`)
                }
            }
        })
        await Promise.all(trabalhadores)
        console.log(JSON.stringify(resumo, null, 2))
        return
    }

    for (const alvo of fila) {
        try {
            const resultado = await localizarAlbum(alvo.artista, alvo.titulo)
            if (!resultado) {
                resumo.semCorrespondencia.push(`${alvo.artista} — ${alvo.titulo}`)
                continue
            }

            const capa = capaGrande(resultado.artworkUrl100 || resultado.artworkUrl60)
            const generoNome = alvo.genero || null
            const generoId = alvo.generoId || generoPorNome.get(normalizar(generoNome || ''))

            let artistaId
            if (alvo.existente) {
                const artistas = await query(
                    'SELECT id FROM artistas WHERE nome = ? LIMIT 1',
                    [alvo.artista]
                )
                artistaId = artistas[0]?.id
            } else {
                if (!generoId) {
                    throw new Error(`Gênero não encontrado no banco: ${generoNome}`)
                }
                const artista = await encontrarArtista(alvo.artista, generoId)
                artistaId = artista.id
            }

            let albumId = alvo.id
            if (!alvo.existente) {
                const correspondentes = await query(
                    `SELECT a.id, a.titulo, a.capa_url AS imagem
                     FROM albuns a
                     INNER JOIN artistas ar ON ar.id = a.artista_id
                     WHERE ar.id = ?`,
                    [artistaId]
                )
                const duplicado = correspondentes.find((album) =>
                    similar(album.titulo, alvo.titulo) || similar(album.titulo, resultado.collectionName)
                )

                if (duplicado) {
                    albumId = duplicado.id
                    if (!duplicado.imagem && capa) {
                        await query('UPDATE albuns SET capa_url = ? WHERE id = ?', [capa, albumId])
                        resumo.capasAtualizadas += 1
                    }
                } else {
                    const albumInserido = await query(
                        `INSERT INTO albuns (artista_id, genero_id, titulo, data_lancamento, capa_url)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            artistaId,
                            generoId,
                            alvo.titulo,
                            resultado.releaseDate ? resultado.releaseDate.slice(0, 10) : null,
                            capa
                        ]
                    )
                    albumId = albumInserido.insertId
                    resumo.albunsAdicionados += 1
                }
            } else if (!alvo.imagem && capa) {
                await query('UPDATE albuns SET capa_url = ? WHERE id = ?', [capa, albumId])
                resumo.capasAtualizadas += 1
            }

            if (apenasCapas) {
                await new Promise((resolve) => setTimeout(resolve, 120))
                continue
            }

            if (capa && artistaId) {
                await query(
                    'UPDATE artistas SET foto_url = COALESCE(NULLIF(foto_url, ?), ?) WHERE id = ?',
                    ['', capa, artistaId]
                )
            }

            const totalFaixas = await query(
                'SELECT COUNT(*) AS total FROM musicas WHERE album_id = ?',
                [albumId]
            )
            if (Number(totalFaixas[0].total) === 0 && generoId) {
                const faixas = await obterFaixas(resultado.collectionId, resultado.provider)
                resumo.faixasAdicionadas += await adicionarFaixas(albumId, generoId, faixas)
            }
            await new Promise((resolve) => setTimeout(resolve, 120))
        } catch (error) {
            console.error(`Falha em ${alvo.artista} — ${alvo.titulo}: ${error.message}`)
            resumo.falhas = resumo.falhas || []
            resumo.falhas.push(`${alvo.artista} — ${alvo.titulo}: ${error.message}`)
        }
    }

    console.log(JSON.stringify(resumo, null, 2))
}

main()
    .catch((error) => {
        console.error(error.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())
