process.on("message", async function (arg) {
// make the required imports
    const vb = require("venom-bot")
    const fs = require('fs');
    var csvWriter = require('csv-write-stream');

    console.log(" argment ", arg)

    // Connect to Whatsapp and send back the qrCode
    console.log("========================================")
    console.log("      CONNECTING TO WHATSAPP")
    var currUser = await connectToWhatsApp()
        .catch(err => console.log("unexpected error: " + err)) // catch any errors

    // =================================================
    //      METHODS USED IN THIS MODULE
    //

    // this function connects to whatsap
    async function connectToWhatsApp() {
        var path = './resources/qrcode/marketing-qr.png';

        console.log(arg['mode']);

        // check if we are extracting or listing groups
        if (arg['mode'] === 'listGroups') {
            // use the library to generate the qr code and send back to the user
            vb.create("groupExtraction", (base64Qr, asciiQR, attempts) => {
                // To log the QR in the terminal
                process.send({'type': 1, 'qrcode': path})
                exportQR(base64Qr, path);
            }, (statusGet => console.log(statusGet)), {
                folderNameToken: 'tokens', //folder name when saving tokens
                mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
                headless: false, // Headless chrome
                devtools: false, // Open devtools by default
                useChrome: true, // If false will use Chromium instance
                debug: false, // Opens a debug session
                logQR: true, // Logs QR automatically in terminal
                browserWS: '', // If u want to use browserWSEndpoint
                browserArgs: [''], // Parameters to be added into the chrome browser instance
                puppeteerOptions: {}, // Will be passed to puppeteer.launch
                disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
                disableWelcome: true, // Will disable the welcoming message which appears in the beginning
                updatesLog: true, // Logs info updates automatically in terminal
                autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
                createPathFileToken: false, //creates a folder when inserting an object in the client's browser, to work it is necessary to pass the parameters in the function create browserSessionToken
            })
                .then(async (client) => {
                    console.log(client)
                    const chats = await client.getAllGroups();

                    var groups = {};

                    for (var i = 0; i < chats.length - 1; i++) {
                        groups[`${chats[i]['name']}`] = chats[i]['id']['_serialized'];
                    }
                    console.log(groups);

                    process.send({"type": 2, 'groupList': groups})

                    client.close();
                })
                .catch(err => {
                    console.log('deu um erro ')
                    console.log(err.toString())
                });
        } else {
            let groupsToExtract = arg['groupsToExtract'];
            let groupsToExtractName = arg['groupsToExtractName'];

            startExtraction(groupsToExtract, groupsToExtractName);
        }


    }

    // ==================================
    //  function to start extraction
    function startExtraction(groupsToExtract, groupsToExtractName) {
        vb.create("groupExtraction", (base64Qr, asciiQR) => {
            // To log the QR in the terminal
        }, (statusGet => console.log(statusGet)), {
            folderNameToken: 'tokens', //folder name when saving tokens
            mkdirFolderToken: '', //folder directory tokens, just inside the venom folder, example:  { mkdirFolderToken: '/node_modules', } //will save the tokens folder in the node_modules directory
            headless: true, // Headless chrome
            devtools: false, // Open devtools by default
            useChrome: true, // If false will use Chromium instance
            debug: false, // Opens a debug session
            logQR: true, // Logs QR automatically in terminal
            browserWS: '', // If u want to use browserWSEndpoint
            browserArgs: [''], // Parameters to be added into the chrome browser instance
            puppeteerOptions: {}, // Will be passed to puppeteer.launch
            disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
            disableWelcome: true, // Will disable the welcoming message which appears in the beginning
            updatesLog: true, // Logs info updates automatically in terminal
            autoClose: 60000, // Automatically closes the venom-bot only when scanning the QR code (default 60 seconds, if you want to turn it off, assign 0 or false)
            createPathFileToken: false, //creates a folder when inserting an object in the client's browser, to work it
        })
            .then(async client => {
                console.log("client created!");
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

                        process.send({'type': 5, 'message': `Extraindo contatos de ${groupName}...`});
                        console.log(targetGroup);
                        client.getGroupMembers(targetGroup)
                            .then(contacts => {
                                console.log(contacts)
                                for (var i = 0; i < contacts.length; i++) {
                                    console.log("salvando contato: ", contacts[i]['user']);
                                    writer.write({"Nome do Grupo": `${groupName} - ${pad(i, 3)}`, "whatsapp": contacts[i]['user']});
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
            })
            .then(res => {
                process.send({"type": 4, 'message': "Processo Finalizado"})

            })
            .catch(err => {
                console.log("erro loop geral: ", err.message)
                process.send({"type": 6, 'message': "Error durante a extração! " +
                        "Pode ser que houve um conflito nos registros internos. " +
                        "Recomendamos você clicar no botão 'Limpar Tabela' e 'Mudar Conta', " +
                        "para assim fazer uma limpeza geral dos registros."})
            })
    }

    // ==================================
    // create excel file for each group
    async function createCsvFile(groupName, writer) {

        return new Promise(async (resolve, reject) => {
            const logName = `${groupName}.csv`;
            let path = `./arquivos_gerados/Grupos/${logName}`;
            await writer.pipe(fs.createWriteStream(path));
            try {
                if (fs.existsSync(path)) {
                    //file exists
                    resolve(true)
                }
            } catch(err) {
                console.error(err)
                reject(err.message)
            }
        })
            .then(res => {
                console.log("file created!")
            })
            .catch(err => {
                console.log("erro ao criar arquivo: ", err.message)
            });
    }

    async function closeCsvFile(writer) {
        await writer.destroy();
    }

    // write qr code to image
    // Writes QR in specified path
    function exportQR(qrCode, path) {
        qrCode = qrCode.replace('data:image/png;base64,', '');
        const imageBuffer = Buffer.from(qrCode, 'base64');

        // Creates 'marketing-qr.png' file
        fs.writeFileSync(path, imageBuffer);
    }

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

    // set leading zeros
    function pad(num, size) {
        num = num.toString();
        while (num.length < size) num = "0" + num;
        return num;
    }
})