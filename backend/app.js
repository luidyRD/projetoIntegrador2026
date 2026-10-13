const http = require('http')
const url = require('url')

const UsuarioBD = require('./database/UsuarioBD')

const callback = (req, res)=>{
    res.setHeader('Access-Control-Allow-Origin','*')
    res.setHeader('Access-Control-Allow-Headers','*')

    var rota = url.parse(req.url,true)

    if(req.method == 'OPTIONS'){
        res.writeHead(204)
        res.end()
        return
    }

    if(req.method == 'GET'){
        if(rota.pathname == '/usuarios'){
            UsuarioBD.getUsuarios((usuarios)=>{
                res.writeHead(200,{'Content-Type':'application/json'})
                res.end(JSON.stringify(usuarios))
            })
        }else{
            res.writeHead(404,{'Content-Type':'application/json'})
            res.end(JSON.stringify({'message':'Rota inválida'}))
        }

    }else if(req.method == 'POST'){
        var body = ''
        req.on('data',(data)=>{
            body += data
        })

        if(rota.pathname == '/registro'){
            req.on('end', ()=>{
                res.writeHead(201,{'Content-Type':'application/json'})
                var usuario = JSON.parse(body)
                UsuarioBD.addUsuario(usuario,(message)=>{
                    res.end(JSON.stringify(message))
                })
            })
        }else if(rota.pathname == '/login'){
            req.on('end',()=>{
                res.writeHead(200,{'Content-Type':'application/json'})
                var usuario = JSON.parse(body)
                UsuarioBD.login(usuario,(message)=>{
                    res.end(JSON.stringify(message))
                })
            })
        }else if(rota.pathname == '/update'){
            req.on('end',()=>{
                res.writeHead(201,{'Content-Type':'application/json'})
                var update = JSON.parse(body)
                UsuarioBD.updatePassword(update,(message)=>{
                    res.end(JSON.stringify(message))
                })
            })          
        }

    }

}

const server = http.createServer(callback)

server.listen(3000,()=>{console.log('Servidor rodando em http://localhost:3000')})