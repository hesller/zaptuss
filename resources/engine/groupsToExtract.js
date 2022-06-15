process.on("message", async function(arg) {
// make the required imports
    const vb = require("venom-bot")
    const fs = require('fs');
    var csvWriter = require('csv-write-stream');
    const groupsToExtract = arg['groupsToExtract'];
    const groupsToExtractName = arg['groupsToExtractName'];
    // create the global variables
    var writer = csvWriter()

    // Connect to Whatsapp and send back the qrCode
    console.log("========================================")
    console.log("      CONNECTING TO WHATSAPP")
    var currUser = await connectToWhatsApp ()
        .catch (err => console.log("unexpected error: " + err) ) // catch any errors

    /*// Connect to Whatsapp and send back the qrCode
    console.log("========================================")
    console.log("      GENERATING AND ANALIZING NUMBERS...")
    await generateNumbers();

    // close the csv
    process.send({"type": 4, "qrcode": '', "message": 'finished'})*/
    writer.end()


    // =================================================
    //      METHODS USED IN THIS MODULE
    //

    // this function connects to whatsap
    async function connectToWhatsApp () {


        var path = directory + 'qrcode/marketing-qr.png';

        // use the library to generate the qr code and send back to the user
        vb.create("groupExtraction", (base64Qr, asciiQR) => {
            // To log the QR in the terminal
            process.send({'type': 1, 'qrcode': path})
            exportQR(base64Qr, path);
        }, (statusGet => console.log(statusGet)),{
            headless: true, // Headless chrome
            devtools: false, // Open devtools by default
            useChrome: true, // If false will use Chromium instance
            debug: false, // Opens a debug session
            logQR: true, // Logs QR automatically in terminal
            browserArgs: [''], // Parameters to be added into the chrome browser instance
            refreshQR: 15000, // Will refresh QR every 15 seconds, 0 will load QR once. Default is 30 seconds
            autoClose: 60000, // Will auto close automatically if not synced, 'false' won't auto close. Default is 60 seconds (#Important!!! Will automatically set 'refreshQR' to 1000#)
            disableSpins: true, // Will disable Spinnies animation, useful for containers (docker) for a better log
        })
            .then(async (client) => {
                console.log('after login', client)
                for (var i = 0; i < groupsToExtract.length - 1; i++) {

                    var currGroup = groupsToExtract[i].toString();
                    console.log("current group ",currGroup);

                    await createCsvFile(groupsToExtractName[i].replace('/', ''));
                    let j = 0;
                    await client.getGroupMembersIds(currGroup)
                        .then(async contact => {
                            console.log(contact)
                            j++;
                            let contactCount = ('0000'+j).slice(-3);
                            await write.write({
                                "contato": `${groupsToExtractName[i]} ${contactCount}`,
                                'whatsapp': contact['user']});

                        })
                        .catch(e => console.log(e.message));
                }

                process.send({'type': 2, 'message': 'Escaneado com sucesso'})

            })
            .catch(err => {console.log(err.toString())});

    }

    // write qr code to image
    // Writes QR in specified path
    function exportQR(qrCode, path) {
        qrCode = qrCode.replace('data:image/png;base64,', '');
        const imageBuffer = Buffer.from(qrCode, 'base64');

        // Creates 'marketing-qr.png' file
        fs.writeFileSync(path, imageBuffer);
    }

    // ==================================
    // create excel file
    async function createCsvFile(groupName) {
        var path = __dirname;
        path = path.replace('engine', '')
        const logName = `${groupName}.csv`
        await writer.pipe(fs.createWriteStream(`${path}logs/groups/${logName}`));
        return true;
    }
})