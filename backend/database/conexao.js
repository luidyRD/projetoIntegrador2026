const mysql = require('mysql')

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loginBD',
    connectionLimit: 10,
    charset: 'utf8mb4'
})

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

function withTransaction(execute) {
    return new Promise((resolve, reject) => {
        pool.getConnection((connectionError, connection) => {
            if (connectionError) {
                reject(connectionError)
                return
            }

            const executarQuery = (sql, values = []) => new Promise((queryResolve, queryReject) => {
                connection.query(sql, values, (error, results) => {
                    if (error) {
                        queryReject(error)
                        return
                    }
                    queryResolve(results)
                })
            })

            connection.beginTransaction(async (transactionError) => {
                if (transactionError) {
                    connection.release()
                    reject(transactionError)
                    return
                }

                try {
                    const result = await execute(executarQuery)
                    connection.commit((commitError) => {
                        if (commitError) {
                            connection.rollback(() => {
                                connection.release()
                                reject(commitError)
                            })
                            return
                        }
                        connection.release()
                        resolve(result)
                    })
                } catch (error) {
                    connection.rollback((rollbackError) => {
                        connection.release()
                        reject(rollbackError || error)
                    })
                }
            })
        })
    })
}

function encerrar() {
    return new Promise((resolve, reject) => {
        pool.end((error) => {
            if (error) {
                reject(error)
                return
            }
            resolve()
        })
    })
}

module.exports = { query, withTransaction, encerrar }
