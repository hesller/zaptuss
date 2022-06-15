process.on('message', async function (arr) {

    // get the process id
    let processId = process.pid;

    // ================================================
    // necessary imports
    const {WAClient, MessageType, MessageOptions, Mimetype} = require('@adiwajshing/baileys');
    var $ = require("jquery")
    const fs = require('fs');
    const helpers = require("./helpers")
    const fetch = require('node-fetch')
    const path = require("path")

    // =================================================
    // declare variables
    var user = arr[9];
    var userMessagesSent = parseInt(user['plan']['messages_sent']);
    var userTotalMessages = parseInt(user['plan']['total_messages']);
    var token = arr[9]['token'];

    const dt = new Date();
    const client = new WAClient()
    client.browserDescription = ['Zaptuss - Impactuss Corporation', 'Chrome', '2.0']
    const url = arr[10]
    const sectionName = (arr[7][0]).toString();
    const nineCheckbox = arr[7][1];

    // --------------------------------------------
    //  arr - is array with data to start the client
    // Do work  (in this case just up-case the string

    // Pass results back to parent process
    // run in main file
    console.log("========================================")
    console.log("      CONNECTING TO WHATSAPP")
    var currUser = await connectToWhatsApp()
        .catch(err => console.log("unexpected error: " + err)) // catch any errors

    // from this point we start to send messages
    console.log("========================================")
    console.log("       START SENDING MESSAGES")

    // format the data accordignly
    var formattedData = await helpers.FormatData(arr).catch(err => console.log("unexpected error: " + err));

    // send the messages
    await StartSendingMessages(formattedData).catch(err => console.log("unexpected error: " + err))

    if (userMessagesSent < userTotalMessages) {
        process.send({"finished": "Processo de envios foi finalizado", 'type': 2, 'section': sectionName});

        // kill the process when all messages are sent
        process.kill(processId);
    }

    // ===========================================
    //     METHODS
    // ===========================================

    // function starts conectio nto whatsapp
    async function connectToWhatsApp() {
        client.onReadyForPhoneAuthentication = ([ref, publicKey, clientID]) => {
            const str = ref + ',' + publicKey + ',' + clientID // the QR string
            // Now, use 'str' to display in QR UI or send somewhere
            process.send({"qrcode": str, 'type': 1, 'section': sectionName})
        };

        const user = await client.connectSlim().then(value => {
            process.send({"message": "Enviando mensagens....", 'type': 4, 'section': sectionName})
        })
            .catch(res => {
                process.send({
                    "error": "Erro ao autenticar no whatsapp, seu numero pode ter sido banido", 'type': 3,
                    'section': sectionName
                })
            });

        return user;
    }

    // function to start sending messages
    async function StartSendingMessages(data) {
        let contacts = data[0];
        let messages = data[1];
        let delayMin = data[2];
        let delayMax = data[3];
        let imagePath = data[4];
        let imageExtension = imagePath !== null ? path.extname(imagePath) : '';
        let imageCaption = data[5];
        let sectionName = data[6];
        let clientData = data[8];

        // declare counter for the messages
        var messageCounter = 0;
        var ArrayOfMessagesLength = data[1].length;

        // start the main loop
        for (var i = 0; i < contacts.length; i++) {

            //verify if user has enough messages to send
            if (userMessagesSent < userTotalMessages) {

                // Obtain a random delay and sleep
                var randomDelay = getRandomValue(delayMin, delayMax);
                var id = `${contacts[i]}@s.whatsapp.net`;
                var message = '';
                var currNumber = contacts[i];

                // inform the user we are in delay
                process.send({
                    "message": `<h6 class="text-info">Aguardando intervalo de ${randomDelay} segundos...`,
                    'type': 5,
                    'section': sectionName,
                    "number": currNumber,
                });

                // await the delay
                let finishedDelay = await new Promise(resolve => setTimeout(() => {
                    console.log("done sleeping")
                    resolve("done")
                }, randomDelay * 1000));

                // send some feedback to the user
                process.send({
                    "message": `<h6 class="text-warning">Enviando mensagem para ${currNumber}</h6>`,
                    'type': 5,
                    'section': sectionName,
                    "number": currNumber,
                });

                // check if we didnt reach the last message
                if (messageCounter < ArrayOfMessagesLength) {

                    // analyse the message and send it
                    await analyseMessages(messageCounter).catch(err => {
                        process.send({
                            "error": "Erro inesperado, entre em contato o suporte! Código: message-analyse",
                            'type': 3,
                            'section': sectionName
                        });
                        process.kill(processId);
                    });;

                    messageCounter++;

                } else {

                    // se the counter to 0
                    messageCounter = 0;

                    // analise the message and send it
                    await analyseMessages(messageCounter).catch(err => {
                        process.send({
                            "error": "Erro inesperado, entre em contato o suporte! Código: message-analyse",
                            'type': 3,
                            'section': sectionName
                        });
                        process.kill(processId);
                    });

                    // update message counter
                    messageCounter++;
                }

            } else {
                process.send({"type": 8, 'messagesSent': userMessagesSent})
                // as the user doesnt have more messages available to send
                // we kill the process
                console.log("user doesnt have any messages left. Killing the process")
                process.kill(processId);
            }
        }

        // function that evaluates the current message, order these properly
        // and start sending
        async function analyseMessages(messageCounter) {

            //get the message from array
            message = `${messages[messageCounter]}`

            // send the text message
            await sendMessageToContact(id, message, MessageType.text, contacts[i], currNumber)

            if (nineCheckbox) {
                // send message without nine
                currNumber = removeNine(contacts[i])
                id = `${currNumber}@s.whatsapp.net`

                await sendMessageToContact(id, message, MessageType.text, contacts[i], currNumber)
            }
            let messageNoEmoji = message.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '[emj]');
            let imageCaptionNoEmoji = imageCaption.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '[emj]');

            let dataMsg = {
                "day_of_week": `${dt.getDay()}`,
                "day_of_month": `${dt.getDate()}`,
                "month": `${dt.getMonth()}`,
                "content": `${messageNoEmoji}`,
                "image_path": `${imagePath}`,
                "image_caption": `${imageCaptionNoEmoji}`,
                "customer": `${arr[8]['clientName']}`,
                "campaign": `${arr[8]['campaign']}`,
                "phone_number": `${contacts[i]}`,
                "user": arr[9]['id'],
            }

            console.log('---------------------')
            console.log("calling fetch")
            console.log(dataMsg);
            console.log(token);
            await fetch(url, {
                method: "post",
                headers: {
                    "X-CSRFToken": token,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify(dataMsg),
            })
                .then(async function (res) {
                    let resValues = Object.values(res);
                    let status = res.status;
                    if (status === 500) {
                        process.send({
                            "error": "Erro inesperado, entre em contato o suporte! Código: save-message",
                            'type': 10,
                            'section': sectionName
                        });

                        process.send({
                            "message": `<h6 class="text-danger">Erro ao salvar mensagem no servidor!</h6>`,
                            'type': 5,
                            'section': sectionName,
                            "number": currNumber,
                        });

                        process.send({
                            "message": `<h6 class="text-info">Salvando mensagem de erro...</h6>`,
                            'type': 5,
                            'section': sectionName,
                            "number": currNumber,
                        });

                        let newDataMsg = dataMsg;
                        newDataMsg['content'] = 'mensagem...';
                        newDataMsg['image_caption'] = 'legenda...';

                        await fetch(url, {
                            method: "post",
                            headers: {
                                "X-CSRFToken": token,
                                "Accept": "application/json",
                                "Content-Type": "application/json",
                                "Authorization": `Token ${token}`
                            },
                            body: JSON.stringify(dataMsg),
                        })
                            .then(res => {
                                // send some feedback to the user
                                process.send({
                                    "message": `Mensagem salva no sevidor com sucesso!`,
                                    'type': 6,
                                    'section': sectionName,
                                    "number": currNumber,
                                });
                            })
                            .catch(err => {
                                // error ao salvar mensagem padrão do no servidor
                                process.send({
                                    "error": "Erro inesperado, entre em contato o suporte! Código: save-message",
                                    'type': 10,
                                    'section': sectionName
                                });
                                process.kill(processId);
                            });
                    }

                    userMessagesSent++;
                    process.send({"type": 7});
                    console.log("message saved successfully");
                })
                .then(res => {
                    // send some feedback to the user
                    process.send({
                        "message": `Mensagem Enviada com sucesso!`,
                        'type': 6,
                        'section': sectionName,
                        "number": currNumber,
                    });
                })
                .catch(function (ex) {
                    process.send({
                        "error": "Erro inesperado, entre em contato o suporte! Código: save-message",
                        'type': 10,
                        'section': sectionName
                    });
                    process.kill(processId)
                    console.log("parsing failed", ex);
                });
        }

        // function to take the client and send the messages
        async function sendMessageToContact(id, message, type, contact, currNumber) {
            return await new Promise(async (resolve, reject) => {
                await client.sendMessage(id, message, type)
                    .then(async res => {

                        // check if user attached image, and send it with caption
                        if (imagePath !== null) {

                            // declare variables
                            const buffer = fs.readFileSync(imagePath.toString()) // load some gif
                            const mediaType = imageExtension === ".jpeg" ? Mimetype.jpeg : Mimetype.png
                            var options = {mimetype: mediaType, caption: imageCaption.toString()}

                            // send message to the user
                            await client.sendMessage(id, buffer, MessageType.image, options);
                        }
                    })
                    .then(res => {
                        // message send successfully
                        console.log(`Promise Resolved. Message sent to ${id}`);
                        resolve(`message sent to ${id}`);
                    })
                    .catch(async res => {
                        // erro while sending the message
                        // TODO make the api recognizes when message is not sent
                        console.log(`Promise not Resolved. ${id} does not exists`);
                        reject("promise not resolved. Probably id does not exists.")
                    });
            })
                .then(res => {
                    // send some feedback to the user
                    process.send({
                        "message": `<h6 class="text-success">Mensagem enviada com sucesso!</h6>`,
                        'type': 5,
                        'section': sectionName,
                        "number": currNumber,
                    });
                })
                .catch(err => {
                    // promised could not be filled, report the error
                    process.send({
                        "error": "Erro ao autenticar no whatsapp, seu numero pode ter sido banido", 'type': 3,
                        'section': sectionName
                    })
                })
        }

    }

    // get random value
    function getRandomValue(min, max) {
        const random = Math.random()
        const random_min_max = random * (max - min)
        const random_min = random_min_max + min
        return random_min;
    }

    // remove the nine of the contact
    function removeNine(number) {
        var sliced1 = number.slice(0, 4)
        var sliced2 = number.slice(5, number.length)
        number = `${sliced1}${sliced2}`
        return number
    }
});


