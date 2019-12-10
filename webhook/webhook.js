const express = require('express')
const {WebhookClient} = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";
let i = 11;

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

async function _put(url, body) {
    let request = {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
        },
        body: JSON.stringify(body)
    };
    console.log(request)
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
    console.log(request)
    const serverReturn = await fetch(url, request)
    const serverResponse = await serverReturn.json()
    return serverResponse
}

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
    const agent = new WebhookClient({request: req, response: res})

    function welcome() {
        let text = ['Hello!', 'Please login to enter the shop!'];
        agent.add(text[0])
        agent.add(text[1])
    }

    function inputUsername() {
        let text = ['Got it.', 'May I have your password, please?'];
        agent.add(text[0])
        agent.add(text[1])
        username = agent.parameters.username
    }

    async function inputPassword() {
        let text = ['Got it.',
            'Please give me some time to sign you in.',
            'Welcome to WiscShop! What can I do for you today?'
        ];
        password = agent.parameters.password
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

    async function navigate() {
        let successText = [
            'No Problem.',
            'Okay.',
            'Sure.'
        ];
        let url = 'https://mysqlcs639.cs.wisc.edu/application/messages'
        let body = {
            'text': '' + agent.query,
            'isUser': true
        }
        await _post(url, body)
        if (agent.parameters.Page !== null) {
            i++;
            let index = (i + 1) % successText.length;
            agent.add(successText[index])
            let body = {
                'text': '' + successText[index],
                'isUser': false
            }
            let url = 'https://mysqlcs639.cs.wisc.edu/application/messages'
            await _post(url, body)
            if (agent.parameters.Page === 'Home') {
                body = {'page': '/' + username}
            } else if (agent.parameters.Page === 'Cart') {
                body = {'page': '/' + username + '/cart'}
            } else if (agent.parameters.Page === 'Hats') {
                body = {'page': '/' + username + '/Hats'}
            } else if (agent.parameters.Page === 'Hats') {
                body = {'page': '/' + username + '/Hats'}
            } else if (agent.parameters.Page === 'Hats') {
                body = {'page': '/' + username + '/Hats'}
            } else if (agent.parameters.Page === 'Leggings') {
                body = {'page': '/' + username + '/Leggings'}
            } else if (agent.parameters.Page === 'Tees') {
                body = {'page': '/' + username + '/Tees'}
            } else if (agent.parameters.Page === 'Tees') {
                body = {'page': '/' + username + '/Tees'}
            } else if (agent.parameters.Page === 'Back') {
                body = {"back": true}
            }
            url = 'https://mysqlcs639.cs.wisc.edu/application'
            await _put(url, body)
        }

    }

    async function queryProduct() {
        let successText = [
            'No Problem.',
            'Here\'s what you are looking for.',
            'Okay.',
            'I found these products we have.',
            'These should be the products you want.',
            'Sure.'
        ];
        let failText = [
            'Sorry, I can\'t get what you want.',
            'Sorry, we don\'t have what you want.'
        ];
        let url = 'https://mysqlcs639.cs.wisc.edu/application/messages'
        let body = {
            'text': '' + agent.query,
            'isUser': true
        }
        await _post(url, body)

        if (agent.parameters.product !== null) {
            i++;
            let index = (i + 1) % successText.length;
            agent.add(successText[index])
            let body = {
                'text': '' + successText[index],
                'isUser': false
            }
            let url = 'https://mysqlcs639.cs.wisc.edu/application/messages'
            await _post(url, body)
            url = 'https://mysqlcs639.cs.wisc.edu/application'
            body = {
                'page': '/' + username + '/' + agent.parameters.product
            }
            await _put(url, body)
        } else {
            i++;
            let index = (i + 1) % failText.length;
            agent.add(failText[index])
            let body = {
                'text': '' + failText[index],
                'isUser': false
            }
            await _post(url, body)
        }
    }

    async function endSession() {
        let url = 'https://mysqlcs639.cs.wisc.edu/application/messages'
        await _delete(url)
    }

    let intentMap = new Map()
    intentMap.set('Default Welcome Intent', welcome)
    intentMap.set('Input Username Intent', inputUsername)
    intentMap.set('Input Password Intent', inputPassword)
    intentMap.set('Query Product Intent', queryProduct)
    intentMap.set('End Session Intent', endSession)
    intentMap.set('Navigate Intent', navigate)
    agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)
