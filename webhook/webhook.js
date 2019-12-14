const express = require('express')
const {WebhookClient} = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";
let i = 11;
let cartProducts = [];

async function getToken() {
    let request = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + base64.encode(username + ':' + password)
        },
        redirect: 'follow'
    }
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/login', request)
    const serverResponse = await serverReturn.json()
    token = serverResponse.token

    return token;
}

async function getCartProducts() {
    let request = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
        },
        redirect: 'follow'
    }
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products/', request)
    const serverResponse = await serverReturn.json()
    cartProducts = serverResponse.products

    return cartProducts;
}

async function _put(url, body) {
    let request = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
        },
        body: JSON.stringify(body)
    };
    //console.log(request)
    const serverReturn = await fetch(url, request)
    const serverResponse = await serverReturn.json()
    return serverResponse
}

async function _post(url, body) {
    let request = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
        },
        body: JSON.stringify(body)
    };
    //console.log(request)
    const serverReturn = await fetch(url, request)
    const serverResponse = await serverReturn.json()
    return serverResponse
}

async function _delete(url) {
    let request = {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
        }
    };
    //console.log(request)
    const serverReturn = await fetch(url, request)
    const serverResponse = await serverReturn.json()
    return serverResponse
}

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
    const agent = new WebhookClient({request: req, response: res})

    //Login methods
    async function login() {
        let text = ['Got it.', 'May I have your username, please?'];
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true}
        )
        agent.add(text[0])
        agent.add(text[1])
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + text[0] + '\n' + text[1], 'isUser': false}
        )
    }

    async function inputUsername() {
        let text = ['Got it.', 'May I have your password, please?'];
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true}
        )
        agent.add(text[0])
        agent.add(text[1])
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + text[0] + '\n' + text[1], 'isUser': false}
        )
        username = agent.parameters.username
    }

    async function inputPassword() {
        let text = ['Got it.',
            'Please give me some time to sign you in.',
            'Welcome to WiscShop! What can I do for you today?'
        ];
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true}
        )
        password = agent.parameters.password
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + text[1], 'isUser': false}
        )
        await getToken()
        let url = 'https://mysqlcs639.cs.wisc.edu/application'
        let body = {
            'page': '/' + username
        }
        await _put(url, body)
        url = 'https://mysqlcs639.cs.wisc.edu/application/messages'
        await _delete(url)
        body = {
            'text': '' + text[2],
            'isUser': false
        }
        await _post(url, body)


    }

    //Browse methods
    async function navigate() {
        let successText = [
            'No Problem.',
            'Okay.',
            'Sure.'
        ];
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true})
        if (agent.parameters.page !== null) {
            i++;
            let index = (i + 1) % successText.length;
            agent.add(successText[index])
            await _post(
                'https://mysqlcs639.cs.wisc.edu/application/messages',
                {'text': '' + successText[index], 'isUser': false})
            let body = {}
            if (agent.parameters.page === 'Home') {
                body = {'page': '/' + username}
            } else if (agent.parameters.page === 'Cart') {
                body = {'page': '/' + username + '/cart'}
            } else if (agent.parameters.page === 'Hats') {
                body = {'page': '/' + username + '/hats'}
            } else if (agent.parameters.page === 'Sweatshirts') {
                body = {'page': '/' + username + '/sweatshirts'}
            } else if (agent.parameters.page === 'Plushes') {
                body = {'page': '/' + username + '/plushes'}
            } else if (agent.parameters.page === 'Leggings') {
                body = {'page': '/' + username + '/leggings'}
            } else if (agent.parameters.page === 'Tees') {
                body = {'page': '/' + username + '/tees'}
            } else if (agent.parameters.page === 'Tees') {
                body = {'page': '/' + username + '/tees'}
            } else if (agent.parameters.page === 'Back') {
                body = {"back": true}
            }
            await _put('https://mysqlcs639.cs.wisc.edu/application', body)
        }

    }

    async function queryCategory() {
        let successText = [
            'No Problem.',
            'Here\'s what you are looking for.',
            'Okay.',
            'I found these products we have.',
            'These should be the products you want.',
            'Sure.'
        ];
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true}
        )
        if (agent.parameters.product !== null) {
            i++;
            let index = (i + 1) % successText.length;
            agent.add(successText[index])
            await _post(
                'https://mysqlcs639.cs.wisc.edu/application/messages',
                {'text': '' + successText[index], 'isUser': false}
            )
            await _put(
                'https://mysqlcs639.cs.wisc.edu/application',
                {'page': '/' + username + '/' + agent.parameters.product}
            )
        }
    }

    //Cart methods
    async function queryCartNum() {
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true}
        )
        await getCartProducts()
        let total = 0
        for (const product of Object.values(cartProducts)) {
            total += product.count
        }
        agent.add('You have ' + total + ' items in your cart.')
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': 'You have ' + total + ' items in your cart.', 'isUser': false}
        )
    }

    async function queryCartSum() {
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true}
        )
        await getCartProducts()
        let totalPrice = 0
        for (const product of Object.values(cartProducts)) {
            totalPrice += product.price * product.count
        }
        agent.add('Your total is ' + totalPrice + ' dollars.')
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': 'Your total is ' + totalPrice + ' dollars.', 'isUser': false}
        )
    }

    async function clearCart() {
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true}
        )
        await _delete(
            'https://mysqlcs639.cs.wisc.edu/application/products/'
        )
        agent.add('Your cart has been cleared.')
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': 'Your cart has been cleared.', 'isUser': false}
        )
    }

    //Details
    async function welcome() {
        let text = ['Hello!', 'What can I do for you today?'];
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true}
        )
        agent.add(text[0])
        agent.add(text[1])
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + text[0] + '\n' + text[1], 'isUser': false}
        )
    }

    async function endSession() {
        let url = 'https://mysqlcs639.cs.wisc.edu/application/messages'
        await _delete(url)
    }

    async function fallback() {
        let text = [
            "I didn't get that. Can you say it again?",
            "I missed what you said. What was that?",
            "Sorry, could you say that again?",
            "Sorry, can you say that again?",
            "Can you say that again?",
            "Sorry, I didn't get that. Can you rephrase?",
            "Sorry, what was that?",
            "One more time?",
            "What was that?",
            "Say that one more time?",
            "I didn't get that. Can you repeat?",
            "I missed that, say that again?"
        ];
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': '' + agent.query, 'isUser': true}
        )
        i++;
        let index = (i + 1) % text.length;
        agent.add(text[index])
        await _post(
            'https://mysqlcs639.cs.wisc.edu/application/messages',
            {'text': text[index], 'isUser': false}
        )
    }

    let intentMap = new Map()
    //Login methods
    intentMap.set('Login Intent', login)
    intentMap.set('Input Username Intent', inputUsername)
    intentMap.set('Input Password Intent', inputPassword)
    //Browse methods
    intentMap.set('Navigate Intent', navigate)
    intentMap.set('Query Category Intent', queryCategory)
    //Cart methods
    intentMap.set('Query Cart Num Intent', queryCartNum)
    intentMap.set('Query Cart Sum Intent', queryCartSum)
    intentMap.set('Clear Intent', clearCart)
    //intentMap.set('Remove Cart Item Intent', null)
    //Details
    intentMap.set('Default Welcome Intent', welcome)
    intentMap.set('End Session Intent', endSession)
    intentMap.set('Default Fallback Intent', fallback)
    agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)
