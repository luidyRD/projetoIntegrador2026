function register() {

    var nome = document.getElementById('name').value
    var usuario = document.getElementById('username').value
    var inEmail = document.getElementById('email').value
    var senha = document.getElementById('password').value
    var senha2 = document.getElementById('password2').value

    if (senha != senha2) {
        document.getElementById('alert').innerText = 'Insira senhas iguais'
        document.getElementById('password').value = ''
        document.getElementById('password2').value = ''
        return
    }

    fetch('http://localhost:3000/registro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: nome,
            username: usuario,
            email: inEmail,
            password: senha
        })
    })
        .then((response) => response.json())
        .then((dados) => {
            if (dados.hasOwnProperty('error')) {
                document.getElementById('alert').innerText = dados.errorvar 
                document.getElementById('name').value
                document.getElementById('username').value =''
                document.getElementById('email').value = ''
                document.getElementById('password').value = ''
                document.getElementById('password2').value = ''
                return
            }
            alert(dados.message)
            window.location.href = 'index.html'
        })
}

function login() {
    var usuario = document.getElementById('username').value
    var senha = document.getElementById('password').value


    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: usuario,
            password: senha
        })
    })
        .then((response) => response.json())
        .then((dados) => {
            if (dados.hasOwnProperty('error')) {
                document.getElementById('alert').innerText = dados.error
                document.getElementById('username').value = ''
                document.getElementById('password').value = ''
                return
            }

            window.location.href = 'log.html'
        })

}

function update() {

    var usuario = document.getElementById('username').value
    var senha = document.getElementById('password').value
    var senha2 = document.getElementById('password2').value

    if (senha != senha2) {
        document.getElementById('alert').innerText = 'Insira senhas iguais'
        document.getElementById('password').value = ''
        document.getElementById('password2').value = ''
        return
    }

    fetch('http://localhost:3000/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: usuario,
            password: senha
        })
    })
        .then((response) => response.json())
        .then((dados) => {
            if (dados.hasOwnProperty('error')) {
                document.getElementById('alert').innerText = dados.error
                document.getElementById('username').value =''
                document.getElementById('password').value = ''
                document.getElementById('password2').value = ''
                return
            }
            alert(dados.message)
            window.location.href = 'index.html'
        })
}