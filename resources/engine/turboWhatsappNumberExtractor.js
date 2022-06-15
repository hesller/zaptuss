process.on("message", async function (arr) {
    // make the required imports
    const {WAClient, MessageType, MessageOptions, Mimetype} = require('@adiwajshing/baileys');
    const fs = require('fs');
    var csvWriter = require('csv-write-stream');
    const os = require('os')
    const numCores = os.cpus().length

    // create the global variables
    const client = new WAClient();

    var writer = csvWriter()
    const logName = `From_${arr[0]}_Generate_${arr[1]}_Numbers.csv`
    let turboMode = arr[2];

    writer.pipe(fs.createWriteStream(`./resources/logs/NumberGenerator/${logName}`));

    // Connect to Whatsapp and send back the qrCode
    console.log("========================================")
    console.log("      CONNECTING TO WHATSAPP")
    var currUser = await connectToWhatsApp()
        .catch(err => console.log("unexpected error: " + err)) // catch any errors

    // Connect to Whatsapp and send back the qrCode
    console.log("========================================")
    console.log("      GENERATING AND ANALIZING NUMBERS...");
    console.log(turboMode);
    console.log(numCores);

    await createPromises(numCores);
    process.send({"type": 4, "qrcode": '', "message": 'finished'})
    writer.end();
    client.close();


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

    async function createPromises(numCores) {
        let part = parseInt(arr[1] / 4);
        let arrFunctions = [];

        for (var i = 0; i < numCores; i++) {
            if (i === numCores - 1) {
                arrFunctions.push(
                    generatePromiseToNumbers(
                        parseInt(arr[0]) + part * i,
                        parseInt(arr[0]) + parseInt(arr[1]),
                        `Processo ${i} finalizado.`
                    )
                )
            } else {
                arrFunctions.push(
                    generatePromiseToNumbers(
                        parseInt(arr[0]) + part * i,
                        parseInt(arr[0]) + part * (i + 1),
                        `Processo ${i} finalizado.`
                    )
                )
            }

        }

        var allPromises = await Promise.all(
            arrFunctions
        )
            .then(values => {
                console.log("thesea re the values ", values)
                process.send({"type": 4, "qrcode": '', "message": 'finished'})
            })
            .catch(err => console.log(err.message));

        function generatePromiseToNumbers(start, finish, message) {
            console.log("inside generatePromise");
            return new Promise(async (resolve) => {
                await generateNumbers(start, finish);
            })
                .catch(err => console.log("inside generatePromise: ", err.message));
        }

    }

    // this function generate Numbers
    async function generateNumbers(initialNumber, finalNumber) {
        var currNumber = initialNumber;
        let lastNumber = finalNumber;
        console.log("inside generate Numbers", initialNumber, finalNumber)

        for (var i = currNumber; i < lastNumber; i++) {

            // verify if number exists on whatsapp
            const exists = await new Promise((resolve, reject) => {
                client.isOnWhatsApp(`${currNumber}@s.whatsapp.net`)
                    .then(res => {
                        console.log(res);
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
                            generateNumbersAfterNetworkDown(currNumber, lastNumber);
                        }, 10000);
                    })
            })
                .catch(err => {
                    console.log("outter error");
                    console.log(err.message);
                });

            // output it to the console
            console.log(`${currNumber} ${exists ? " REGISTRADO " : " NÃO REGISTRADO"} no WhatsApp`);
            if (exists) {
                writer.write({"nome": `contato ${i - parseInt(arr[0])}`, "whatsapp": currNumber});
                process.send({
                    "type": 5,
                    "qrcode": '',
                    "number": `${currNumber} - REGISTRADO no WhatsApp`
                });
            }

            // next number
            currNumber++;
        }
        process.send({"type": 4, "qrcode": '', "message": 'finished'});
        return 'done';
    }

    // this function generate Numbers
    async function generateNumbersAfterNetworkDown(number, finalNumber) {
        let lastNumber = finalNumber;
        var currNumber = parseInt(number);

        console.log(currNumber);
        console.log(lastNumber);

        for (var i = currNumber; i < lastNumber; i++) {

            const exists = await new Promise((resolve, reject) => {
                client.isOnWhatsApp(`${currNumber}@s.whatsapp.net`)
                    .then(res => {
                        console.log(res);
                        resolve(res);
                    })
                    .catch(async err => {
                        process.send({
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
            if (exists) {
                writer.write({"nome": `contato ${i - parseInt(arr[0])}`, "whatsapp": currNumber});
                process.send({
                    "type": 5,
                    "qrcode": '',
                    "number": `${currNumber} - REGISTRADO no WhatsApp`
                });
            }

            // next number
            currNumber++;
        }
        process.send({"type": 4, "qrcode": '', "message": 'finished'})
        return 'done';
    }
})