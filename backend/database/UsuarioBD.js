const bcrypt = require('bcrypt')
const { query } = require('./conexao')

async function buscarPorEmail(email) {
    const rows = await query(
        `SELECT id, name, username, email, password
         FROM usuarios
         WHERE LOWER(email) = ?
         LIMIT 1`,
        [email]
    )
    return rows[0] || null
}

async function buscarPorId(id) {
    const rows = await query(
        `SELECT id, name, username, email
         FROM usuarios
         WHERE id = ?
         LIMIT 1`,
        [id]
    )
    return rows[0] || null
}

async function cadastrar({ nome, username, email, senha }) {
    const existente = await buscarPorEmail(email)
    if (existente) {
        const error = new Error('Este e-mail já está cadastrado.')
        error.statusCode = 409
        throw error
    }

    const password = await bcrypt.hash(senha, 12)
    let resultado
    try {
        resultado = await query(
            'INSERT INTO usuarios (name, username, email, password) VALUES (?, ?, ?, ?)',
            [nome, username, email, password]
        )
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const duplicado = new Error(
                'Este e-mail ou nome de usuário já está cadastrado.'
            )
            duplicado.statusCode = 409
            throw duplicado
        }
        throw error
    }
    return { id: resultado.insertId, nome, username, email }
}

async function autenticar(email, senha) {
    const usuario = await buscarPorEmail(email)
    if (
        !usuario ||
        !usuario.password ||
        !(await bcrypt.compare(senha, usuario.password))
    ) {
        return null
    }
    return {
        id: usuario.id,
        nome: usuario.name,
        username: usuario.username,
        email: usuario.email
    }
}

async function atualizarPerfil(id, { nome, username, email, senhaAtual, novaSenha }) {
    const usuario = await buscarPorEmailOuId(id)
    if (!usuario) {
        const error = new Error('Usuário não encontrado.')
        error.statusCode = 404
        throw error
    }

    if (novaSenha) {
        if (!senhaAtual || !(await bcrypt.compare(senhaAtual, usuario.password))) {
            const error = new Error('A senha atual está incorreta.')
            error.statusCode = 401
            throw error
        }
    }

    try {
        if (novaSenha) {
            const password = await bcrypt.hash(novaSenha, 12)
            await query(
                `UPDATE usuarios
                 SET name = ?, username = ?, email = ?, password = ?
                 WHERE id = ?`,
                [nome, username, email, password, id]
            )
        } else {
            await query(
                `UPDATE usuarios
                 SET name = ?, username = ?, email = ?
                 WHERE id = ?`,
                [nome, username, email, id]
            )
        }
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const duplicado = new Error(
                'Este e-mail ou nome de usuário já está em uso.'
            )
            duplicado.statusCode = 409
            throw duplicado
        }
        throw error
    }

    return buscarPorId(id)
}

async function buscarPorEmailOuId(id) {
    const rows = await query(
        `SELECT id, name, username, email, password
         FROM usuarios
         WHERE id = ?
         LIMIT 1`,
        [id]
    )
    return rows[0] || null
}

module.exports = { cadastrar, autenticar, buscarPorId, atualizarPerfil }
