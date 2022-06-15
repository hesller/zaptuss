process.on("message", async function (arg) {
// make the required imports
    const {WAClient} = require('@adiwajshing/baileys');
    const helpers = require("../engine/helpers")
    const vb = require("venom-bot")
    const fs = require('fs');
    var csvWriter = require('csv-write-stream');
    let client = new WAClient();
    let groups = {};

    client.browserDescription = ['Zaptuss - Impactuss Corporation', 'Chrome', '2.0']

    // Connect to Whatsapp and send back the qrCode
    console.log("========================================")
    console.log("      CONNECTING TO WHATSAPP")
    var currUser = await connectToWhatsApp()
        .catch(err => console.log("unexpected error: " + err)) // catch any errors

    // =================================================
    //      METHODS USED IN THIS MODULE
    // this function connects to whatsap
    async function connectToWhatsApp() {
        client.onReadyForPhoneAuthentication = ([ref, publicKey, clientID]) => {
            const str = ref + ',' + publicKey + ',' + clientID // the QR string
            // Now, use 'str' to display in QR UI or send somewhere
            process.send({"qrcode": str, 'type': 1, 'section': ''})
        };

        // check if we are extracting or listing groups
        if (arg['mode'] === 'listGroups') {
            client.connect()
                .then(async (userData) => {

                    // save user auth info
                    let authSaved = await helpers.saveAuthInfo(client);
                    if (authSaved === false) {
                        let authSaved2 = await helpers.saveAuthInfo(client);
                    }

                    // inform the user
                    process.send({
                        'type': 2,
                        'username': userData[0]['name'],
                        'phoneNumber': userData[0]['id'].replace("@s.whatsapp.net", ''),
                    })
                    return userData[2]
                })
                .then(res => {
                    // check every chat and see if it is a group
                    for (var contact in res) {
                        let groupId = res[contact]['jid'];
                        let groupName = res[contact]['name'];
                        if (groupId.includes("@g.us")) {
                            groups[groupName] = groupId;
                        }
                    }
                    return groups
                })
                .then(groupList => {
                    process.send({
                        'type': 8,
                        "groupList": groupList
                    })
                })
                .catch(err => {
                    process.send({
                        'type': 6,
                        'message': `Erro durante o processo: ${err.message}`
                    })
                })
        } else {
            let groupsToExtract = arg['groupsToExtract'];
            let groupsToExtractName = arg['groupsToExtractName'];

            await startExtraction(groupsToExtract, groupsToExtractName);
            extractionFinished();
        }


    }

    // ==================================
    //  function to start extraction
    async function startExtraction(groupsToExtract, groupsToExtractName) {
        // list for when phone auth is ready
        try {
            await client.loadAuthInfoFromBase64("./auth_info.json")
            await connectTheClient(client)
        } catch (err) {
            await connectTheClientNoAuthInfo(client);
        }

        // start the main loop
        for (var i = 0; i < groupsToExtract.length; i++) {

            //pick the group name and create the csv file
            var groupName = (groupsToExtractName[i]).toString();
            groupName = groupName.replace(/[^\w]/g, "_").replace(/[^\w]/g, "_").replace(/[^\w]/g, "_");
            groupName = groupName.replace(/[^\w]/g, "_").replace(/[^\w]/g, "_").replace(/[^\w]/g, "_");
            groupName = groupName.replace(/[^\w]/g, "_").replace(/[^\w]/g, "_").replace(/[^\w]/g, "_");
            groupName = groupName.replace(/[^\w]/g, "_").replace(/[^\w]/g, "_").replace(/[^\w]/g, "_");

            process.send({'type': 5, 'message': `criando arquivo para ${groupName}...`});
            // create the global variables
            let writer = csvWriter();

            await createCsvFile(groupName, writer);

            // await the file to be created
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve('file created')
                }, 2000)
            });

            // remove the empty values from group name
            let targetGroup = groupsToExtract[i].toString();
            targetGroup = targetGroup.replace(' ', '');

            // start the extraction
            const members = await new Promise(async (resolve, reject) => {
                console.log("======================================")
                console.log("   start to extract contacts and ");
                console.log("   write to file");
                console.log("======================================")
                console.log(" Group Name: ", groupName);

                // inform the user which group we are extracting
                process.send({'type': 5, 'message': `Extraindo contatos de ${groupName}...`});
                console.log(targetGroup);

                client.groupMetadata(targetGroup)
                    .then(contacts => {
                        let participants = contacts['participants'];

                        for (var i = 0; i < participants.length; i++) {
                            let idSeparated = participants[i]['id'].replace("@c.us", '')
                            console.log("salvando contato: ", idSeparated);
                            writer.write({"Nome do Grupo": `${groupName} - ${pad(i, 3)}`, "whatsapp": idSeparated});
                        }

                    })
                    .then(result => {
                        resolve("done")
                    })
                    .catch(err => {
                        console.log("erro ao chamar extraão via cliente", err.message)
                        process.send({
                            "type": 6,
                            'message': `Error durante a extração do grupo ${groupName}! Erro: ${err.message}`
                        });
                    });
            });
            await closeCsvFile(writer);
        }
    }

    // ==================================
    //  function connect the client
    async function connectTheClient(client) {
        await client.connectSlim()
            .then(async (userData) => {
                console.log(userData);
            })
            .catch(err => {
                process.send({
                    'type': 6,
                    'message': `Erro durante o processo: ${err.message}`
                })
            });
    }

    // ==================================
    //  function connect the client
    async function connectTheClientNoAuthInfo(client) {
        client.onReadyForPhoneAuthentication = ([ref, publicKey, clientID]) => {
            const str = ref + ',' + publicKey + ',' + clientID // the QR string
            // Now, use 'str' to display in QR UI or send somewhere
            process.send({"qrcode": str, 'type': 1, 'section': ''})
        };

        await client.connectSlim()
            .then(async (userData) => {
                console.log(userData);
            })
            .catch(err => {
                process.send({
                    'type': 6,
                    'message': `Erro durante o processo: ${err.message}`
                })
            });
    }

    // ==================================
    // properly close all process
    async function extractionFinished() {
        await client.close();
        process.send({
            "type": 4,
            "message": "Processo finalizado com sucesso!",
        });
    }

    // ==================================
    // create excel file for each group
    async function createCsvFile(groupName, writer) {
        return new Promise(async (resolve, reject) => {
            const logName = `${groupName}.csv`;
            let path = `./arquivos_gerados/Grupos/${logName}`;
            await writer.pipe(fs.createWriteStream(path));
            resolve("done")
            return path
        })
            .catch(err => {
                console.log("erro ao criar arquivo: ", err.message)
            });
    }

    // close the writer
    async function closeCsvFile(writer) {
        await writer.destroy();
    }

    // ===================================
    // Writes QR in specified path
    function exportQR(qrCode, path) {
        qrCode = qrCode.replace('data:image/png;base64,', '');
        const imageBuffer = Buffer.from(qrCode, 'base64');

        // Creates 'marketing-qr.png' file
        fs.writeFileSync(path, imageBuffer);
    }

    // ===================================
    // remove directories
    function removeTokensDir() {
        const fs = require("fs");
        // ----------------------------------------
        // remove directory in order to remove session credentials

        const dir = './tokens';
        try {
            // delete directory recursively
            fs.rmdir(dir, {recursive: true}, (err) => {
                if (err) {
                    console.log(err);
                }
                console.log(`${dir} is deleted!`);
            });
        } catch (e) {
            return null;
        }

    }

    // ===================================
    // set leading zeros
    function pad(num, size) {
        num = num.toString();
        while (num.length < size) num = "0" + num;
        return num;
    }
})