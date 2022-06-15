const https = require('http')
const path = require("path")
const vb = require("venom-bot")
const dt = new Date()
const fetch = require("node-fetch")
const url = "http://localhost:8000/api/messages/"
// var part = arr.length / 3
// dividindo por 3 tem que fazer var i =0; i < part - 1; i++
// the last promise must go from part * num_of_cores + 1 to  arr.length

// function starts conectio nto whatsapp
const {WAClient, MessageType, MessageOptions, Mimetype} = require('@adiwajshing/baileys');
let client = new WAClient();
var currUser = connectToWhatsApp()
    .catch(err => console.log("unexpected error: " + err)) // catch any errors

async function connectToWhatsApp() {
    client.onReadyForPhoneAuthentication = ([ref, publicKey, clientID]) => {
        const str = ref + ',' + publicKey + ',' + clientID // the QR string
        // Now, use 'str' to display in QR UI or send somewhere
        console.log(str)
    };
    const user = await client.connectSlim()
        .then(value => {
        console.log("client connected")
    }).catch(res => {
        process.send({
            "error": "Erro ao autenticar no whatsapp, seu numero pode ter sido banido", 'type': 3,
            'section': sectionName
        })
    });
    console.log("returning the user")
    return user;
}