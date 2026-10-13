const mysql = require('mysql')
const bcrypt = require('bcrypt')

class UsuarioBD{
    static connect(){
        const connection = mysql.createConnection({
            host:'localhost',
            user:'root',
            password:'',
            database:'loginBD'
        })
        connection.connect()
        return connection
    }

    static getUsuarios(callback){
        const connection = UsuarioBD.connect()

        var sql = 'select name, username, email from usuarios'

        connection.query(sql,(error, results)=>{
            if(error) throw error

            var usuarios = results
            callback(usuarios)
        })
        connection.end()
    }

    static async addUsuario(usuario, callback){
        const connection = UsuarioBD.connect()

        var {name, username, email, password} = usuario

        if(!name || !username || !email || !password){
            return callback({'error':'Insira todos os dados'})
        }

        usuario.password = await bcrypt.hash(usuario.password,12)

        var sql = 'insert into usuarios set ?'

        connection.query(sql, usuario,(error, results)=>{
            if(error) throw error

            callback({'message':'Usuario inserido com sucesso'})
        })
        connection.end()
    }

    static login(usuario, callback){
        const connection = UsuarioBD.connect()

        var {username, password} = usuario

        if(!username || !password){
            return callback({'error':'Insira os dados Corretamente'})
        }

        var sql = 'select username, password from usuarios where username = ?'

        connection.query(sql,username,(error, results)=>{
            if(error) throw error

            if(results.length == 0){
                return callback({'error':'Usuario não cadastrado'})
            }

            var user = results[0]

            var passwordIsValid = bcrypt.compareSync(password,user.password)

            if(usuario.username == user.username && passwordIsValid){
                return callback({'message':'Logado com sucesso!'})
            }

            return callback({'error':'Senha Incorreta'})

        })
        connection.end()
    }

    static async updatePassword(usuario,callback){
        const connection = UsuarioBD.connect()

        var {username, password} = usuario

        if(!username || !password){
            return callback({'error':'Insira os dados Corretamente'})
        }

        password = await bcrypt.hash(usuario.password,12)

        var sql = 'update usuarios set password = ? where username = ?'

        connection.query(sql,[password,username],(error, results)=>{
            if(error) throw error

            return callback({'message':'Senha atualizada'})

        })
        connection.end()

    }

    
}
module.exports = UsuarioBD