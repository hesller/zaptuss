process.on('message', async function (arr) {
    // make the required imports
    const {WAClient, MessageType, MessageOptions, Mimetype} = require('@adiwajshing/baileys');
    const fs = require('fs');
    const hp = require("./helpers")
    const cluster = require("cluster")
    const numCPUs = require("os").cpus().length;
    const cp = require('child_process');

    // global variables
    const client = new WAClient()
    const arrBlock = arr[1] / numCPUs;

    // Connect to Whatsapp and send back the qrCode
    console.log("========================================")
    console.log("      CONNECTING TO WHATSAPP")
    var currUser = await connectToWhatsApp ()
        .catch (err => console.log("unexpected error: " + err) ) // catch any errors

    // contains all the keys you need to restore a session
    const creds = client.base64EncodedAuthInfo ()
    console.log("creds - ", creds)
    // save JSON to file
    fs.writeFileSync('./auth_info.json', JSON.stringify(creds, null, '\t'))

    // =================================================
    //          fork processes to cores
    //
    for (var i = 0; i < numCPUs; i++) {
        var currProcess = cp.fork("./engine/childExtractor.js")
        currProcess.send({
            "processID": i,
            "initialNumber": arr[0] + (i - 1) * arrBlock,
            "quantity": arrBlock
        })
    }

    /*
        var csvWriter = require('csv-write-stream');
        var writer = csvWriter()
        const logName = `From_${arr[0]}_Generate_${arr[1]}_Numbers.csv`
        writer.pipe(fs.createWriteStream(`./logs/NumberGenerator/${logName}`));

        // Connect to Whatsapp and send back the qrCode
        console.log("========================================")
        console.log("      GENERATING AND ANALIZING NUMBERS...")
        await generateNumbers();

        // close the csv

        writer.end()
    */

    // =================================================
    //      METHODS USED IN THIS MODULE
    //

    // this function connects to whatsap
    async function connectToWhatsApp() {
        client.onReadyForPhoneAuthentication = ([ref, publicKey, clientID]) => {
            const str = ref + ',' + publicKey + ',' + clientID // the QR string

            // Now, use 'str' to display in QR UI or send somewhere
            process.send({"type": 1, "qrcode": str})
        };

        const user = await client.connectSlim().then((result) => {
            console.log("the result of connection", result)
            process.send({"type": 2, "qrcode": '', "message": result})

        }).catch(err => {
            console.log("Error trying to connect to whatsapp: " + err);
            process.send({"type": 3, "qrcode": '', "message": err})

        });
        return user;
    }

    // this function generate Numbers
    async function generateNumbers() {
        var currNumber = parseInt(arr[0]);

        for (var i = 0; i < parseInt(arr[1]); i++) {

            // verify if number exists on whatsapp
            const exists = await client.isOnWhatsApp(`${currNumber}@s.whatsapp.net`)

            // output it to the console
            console.log(`${currNumber} ${exists ? " REGISTRADO " : " NÃO REGISTRADO"} no WhatsApp`)
            if (exists) {
                writer.write({"nome": `contato ${i}`, "whatsapp": currNumber})
            }

            // next number
            currNumber++;
        }
    }

    // this function sends message to the parent process
    async function sendMsgToParent() {
        process.send({"type": 4, "qrcode": '', "message": 'finished'})
    }


})
