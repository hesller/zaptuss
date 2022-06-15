process.on("message", async function (arr) {

    // make the required imports
    const {WAClient, MessageType, MessageOptions, Mimetype} = require('@adiwajshing/baileys');
    const fs = require('fs');
    var csvWriter = require('csv-write-stream');
    var totalNumbersFound = 0;
    var totalNumbersAnalised = 0;

    // create the global variables
    const client = new WAClient();

    var writer = csvWriter()
    const logName = `From_${arr[0]}_Generate_${arr[1]}_Numbers.csv`
    let turboMode = arr[2];

    writer.pipe(fs.createWriteStream(`./arquivos_gerados/GeradorNumeros/${logName}`));

    // Connect to Whatsapp and send back the qrCode
    console.log("========================================")
    console.log("      CONNECTING TO WHATSAPP")
    var currUser = await connectToWhatsApp()
        .catch(err => console.log("unexpected error: " + err)) // catch any errors

    // Connect to Whatsapp and send back the qrCode
    console.log("========================================")
    console.log("      GENERATING AND ANALIZING NUMBERS...");
    await generateNumbers(parseInt(arr[0]), parseInt(arr[0]) + parseInt(arr[1]));

    // close the csv
    process.send({"type": 4, "qrcode": '', 'message': 'Processo de Análise Finalizado'})
    writer.end();
    client.close();

    // =================================================
    //      METHODS USED IN THIS MODULE
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
    async function generateNumbers(initialNumber, finalNumber) {
        var currNumber = initialNumber;
        let lastNumber = finalNumber;

        for (var i = currNumber; i < lastNumber; i++) {
            totalNumbersAnalised++;

            // verify if number exists on whatsapp
            const exists = await new Promise((resolve, reject) => {
                client.isOnWhatsApp(`${currNumber}@s.whatsapp.net`)
                    .then(res => {
                        if(res) {
                            totalNumbersFound++;
                            let index = i - initialNumber;
                            writer.write({"nome": `contato ${index}`, "whatsapp": currNumber});
                            process.send({
                                "type": 5,
                                "qrcode": '',
                                "number": `${currNumber} - REGISTRADO no WhatsApp`,
                                "message": 'Registrado no Whatsapp!',
                                "phoneNumber": currNumber,
                                "contact": `contato ${index}`,
                                'index': index,
                                "totalFound": totalNumbersFound,
                                "totalAnalised": totalNumbersAnalised,
                            });
                        }

                        resolve(res);
                    })
                    .catch(async err => {
                        console.log("error in connecting isOnWhatsapp");
                        console.log(err, err.message);
                        process.send({
                            "type": 3,
                            "qrcode": '',
                            "message": `Restabelecendo conexão`
                        });
                        setTimeout(() => {
                            generateNumbersAfterNetworkDown(currNumber, lastNumber, initialNumber);
                            }, 10000);
                    })
            }).catch(err =>{
                console.log("outter error");
                console.log(err.message);
            });

            // output it to the console
            console.log(`${currNumber} ${exists ? " REGISTRADO " : " NÃO REGISTRADO"} no WhatsApp`);

            // next number
            currNumber++;
        }
    }

    // this function generate Numbers
    async function generateNumbersAfterNetworkDown(number, finalNumber, initialNumber) {
        let lastNumber = finalNumber;
        var currNumber = parseInt(number);

        console.log(currNumber);
        console.log(lastNumber);

        for (var i = currNumber; i < lastNumber; i++) {
            totalNumbersAnalised++;
            const exists = await new Promise((resolve, reject) => {
                client.isOnWhatsApp(`${currNumber}@s.whatsapp.net`)
                    .then(res => {
                        if(res) {
                            totalNumbersFound++;
                            let index = i - initialNumber;
                            writer.write({"nome": `contato ${index}`, "whatsapp": currNumber});
                            process.send({
                                "type": 5,
                                "qrcode": '',
                                "number": `${currNumber} - REGISTRADO no WhatsApp`,
                                "message": 'Registrado no Whatsapp!',
                                "phoneNumber": currNumber,
                                "contact": `contato ${index}`,
                                'index': index,
                                "totalFound": totalNumbersFound,
                                "totalAnalised": totalNumbersAnalised,
                            });
                        }
                        resolve(res);
                    })
                    .catch(async err => {                        process.send({
                            "type": 3,
                            "qrcode": '',
                            "message": `Restabelecendo conexão`
                        });

                        setTimeout(() => {
                            generateNumbersAfterNetworkDown(currNumber, lastNumber);
                        }, 10000)
                    })
            })
                .catch(err => console.log(err.message));

            // output it to the console
            console.log(`${currNumber} ${exists ? " REGISTRADO " : " NÃO REGISTRADO"} no WhatsApp`);

            // next number
            currNumber++;
        }

    }
})