process.on("message", async function (args) {
    console.log(`[${process.pid}] - process ${args['processID']} `)

    // imports
    const {WAClient, MessageType, MessageOptions, Mimetype} = require('@adiwajshing/baileys');
    const fs = require("fs")
    var csvWriter = require('csv-write-stream');

    // globals
    var writer = csvWriter()
    const logName = `Process_${args['processID']}_${args['initialNumber']}.csv`
    const client = new WAClient();

    // reconnect to the section
    client.loadAuthInfoFromBase64('./auth_info.json') // will load JSON credentials from file
    await client.connect()

    // open the file
    writer.pipe(fs.createWriteStream(`./logs/NumberGenerator/${logName}`));

    // GENERATE AND ANALIZE NUMBERS
    console.log("========================================")
    console.log("      GENERATING AND ANALIZING NUMBERS...")
    await generateNumbers();

    // close the csv
    writer.end()

    // this function generate Numbers
    async function generateNumbers() {
        var currNumber = args['initialNumber'];
        for (var i = 0; i < args['quantity']; i++) {
            // verify if number exists on whatsapp
            const exists = await client.isOnWhatsApp(`${currNumber}@s.whatsapp.net`)

            // output it to the console
            console.log (`${currNumber} ${exists ? " REGISTRADO " : " NÃO REGISTRADO"} no WhatsApp`)
            if (exists) {
                writer.write({"nome": `contato ${i}`,"whatsapp": currNumber})
            }

            // next number
            currNumber ++;
        }
    }
})