const {app, BrowserWindow, ipcMain} = require('electron');
global.jQuery = require('jquery');
const cp = require('child_process');
const path = require("path")

const hp = require( path.join(__dirname+ "/resources/engine/helpers.js"))


// reload at changes
//require('electron-reload')(__dirname);

// declare the user
var user = {};
var planControl = {};

function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 1080,
        height: 600,
        minWidth:  1080,
        minHeight: 600,
        maxHeight: 1080,
        maxWidth: 600,
        frame:false,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            devTools: hp.getDevMode(),
        },
        icon: __dirname + '/static/assets/images/launcher.jpg',
        titleBarStyle: "hidden"
    });


    // and load the index.html of the app.
    win.loadFile('templates/login.html');

    // Open the DevTools.
    //win.webContents.openDevTools()

}


// Listen for the call in dashboard js
ipcMain.on('asynchronous-message', (event, arg) => {
    arg.push(user);
    let urlType = hp.urlType.MESSAGECREATE;
    let url = hp.getUrl(urlType);
    arg.push(url);

    // prepare the child process
    var child = cp.fork(path.join(__dirname +`/resources/engine/zaptussclient.js`));

    // and reply listener to child process
    child.on('message', function (m) {

        // Receive results from child process
        if (m['type'] === 8) { // user reached the limit of messages
            // increase the number of messages sent
            let messagesSent = hp.updateMessageCounts(user,"add", m);

            // update the plan info
            //user['plan']['messages_sent'] = messagesSent;

            // send the information to the user
            event.reply("message-limit-reached", m['messagesSent']);

        } else if (m['type'] === 7) {
            // increase the number of messages sent
            let messagesSent = hp.updateMessageCounts(user,"add")

            // update the plan info
            user['plan']['messages_sent'] = messagesSent;

            // send information to the user
            event.reply("update-message-counts", messagesSent);

        }

        event.reply(`list-messages`, m);
    });

    // Send child process the array with arguments from started section
    child.send(arg);

})

ipcMain.on("update-user", (event, args) => {
    user['plan']['messages_sent'] = args['messages_sent'];
    event.reply()
})

ipcMain.on("number-generator", (event, arg) => {

    // first format the data
    var args = hp.ExtractorFormatData(arg);
    var numberGeneratorChildProcess;
    let currentFilePath;
    currentFilePath = path.join(__dirname + "/resources/engine/whatsappNumberExtractor.js");

    numberGeneratorChildProcess = cp.fork(currentFilePath.toString())

    ListerForReplies();

    numberGeneratorChildProcess.send(args);

    function ListerForReplies() {
        // ----------------------------------
        //    listen for replies from process
        numberGeneratorChildProcess.on("message", (m) => {
            // send the qr code back to frontend in string form
            //    message receives diferent types:
            //      1 - qrcode string
            //      2 - whtsapp connected
            //      3 - whatsapp connection failed
            //
            if (m['type'] === 1) {
                event.reply("extractor-qrcode", m["qrcode"])
            } else if (m["type"] === 2) {
                event.reply("extractor-connected", m['message'])
            } else if (m['type'] === 3) {
                event.reply("extractor-failed-to-connect", m['message'])
            } else if (m['type'] === 4) {
                event.reply("extractor-finished", m['message'])
            } else if (m['type'] === 5) {
                event.reply("extracting", m)
            }
        })
    }
})

ipcMain.on("group-generator", (event, arg) => {

    // first format the data
    var args = arg;
    var numberGeneratorChildProcess;
    let currentFilePath= '';

    // evaluate if it is to extract to one file
    if (args['oneFile']) {
        // set file path
        currentFilePath = path.join(__dirname + "/resources/engine/groupExtractorNewAPI.js");

        // call the process
        numberGeneratorChildProcess = cp.fork(currentFilePath.toString())
    } else {
        // set file path
        currentFilePath = path.join(__dirname + "/resources/engine/groupExtractorManyNewAPI.js");

        // call the process
        numberGeneratorChildProcess = cp.fork(currentFilePath.toString())
    }

    ListerForReplies();

    numberGeneratorChildProcess.send(args);

    // ----------------------------------
    //    listen for replies from process
    function ListerForReplies() {
        numberGeneratorChildProcess.on("message", (m) => {
            // send the qr code back to frontend in string form
            //    message receives diferent types:
            //      1 - qrcode string
            //      2 - whtsapp connected
            //      3 - whatsapp connection failed
            //
            if (m['type'] === 1) {
                event.reply("group-extractor-qrcode", m)
            } else if (m["type"] === 2) {
                event.reply("group-extractor-connected", m)
            } else if (m['type'] === 3) {
                event.reply("extractor-failed-to-connect", m['message'])
            } else if (m['type'] === 4) {
                event.reply("extractor-finished", m)
            } else if (m['type'] === 5) {
                event.reply("extracting", m)
            } else if (m['type'] === 6) {
                event.reply("extracting-error", m)
            } else if (m['type'] === 7) {
                event.reply("qr-code-read", m)
            } else if (m['type'] === 8) {
                event.reply("group-list", m)
            }
        })
    }
})

ipcMain.on("groups-to-extract", (event, arg) => {

    // first format the data
    var groupToExtractProcess;
    var currentFilePath = path.join(__dirname + "/resources/engine/groupsToExtract.js");

    groupToExtractProcess = cp.fork(currentFilePath.toString())

    ListerForReplies();

    groupToExtractProcess.send(arg);

    function ListerForReplies() {
        // ----------------------------------
        //    listen for replies from process
        groupToExtractProcess.on("message", (m) => {
            // send the qr code back to frontend in string form
            //    message receives diferent types:
            //      1 - qrcode string
            //      2 - whtsapp connected
            //      3 - whatsapp connection failed
            //
            if (m['type'] === 1) {
                event.reply("group-extraction-finished", m)
            }
        })
    }
})

ipcMain.on("remove-tokens-folder", (event, arg) => {
    var args = arg;
    var numberGeneratorChildProcess;
    var currentFilePath = path.join(__dirname + "/resources/engine/removeTokensFolder.js");

    numberGeneratorChildProcess = cp.fork(currentFilePath.toString())

    ListerForReplies();

    numberGeneratorChildProcess.send(args);

    function ListerForReplies() {
        // ----------------------------------
        //    listen for replies from process
        numberGeneratorChildProcess.on("message", (m) => {
            // send the qr code back to frontend in string form
            //    message receives diferent types:
            //      1 - qrcode string
            //      2 - whtsapp connected
            //      3 - whatsapp connection failed
            //
            if (m['type'] === 1) {
                event.reply("token-removed", m)
            } else if (m["type"] === 2) {
                event.reply("error-remove-token", m)
            }
        })
    }
});

ipcMain.on("save-user", async(event,arg) => {
    user['id'] = arg['user_id']
    user['email'] = arg['email']
    user['name'] = arg['name']
    user['is_active'] = arg['is_active']
    user['token'] = arg['token']
    user['is_staff'] = arg['is_staff']
    user['is_impactuss_active'] = arg['is_impactuss_active']
    user['is_support'] = arg['is_support']
    user['plan'] = arg['plan']

    var fs = require('fs');
    let groupsDir = path.join(__dirname, '/arquivos_gerados/Grupos');
    let numberDir = path.join(__dirname + '/arquivos_gerados/GeradorNumeros');
    let qrDir = path.join(__dirname + '/arquivos_gerados/QRcode');

    if (user['is_staff']) {
        await createDir(groupsDir).catch(err => console.log(err.message));
        await createDir(numberDir).catch(err => console.log(err.message));
        await createDir(qrDir).catch(err => console.log(err.message));
    } else {
        await createDir(groupsDir).catch(err => console.log(err.message));
        await createDir(qrDir).catch(err => console.log(err.message));
    }

    async function createDir(path) {
        if (!fs.existsSync(path)){
            await fs.mkdirSync(path,{recursive: true});
        }
    }

    event.reply("save-user-reply", 'Usuário Salvo com sucesso!')
})

ipcMain.on('grab-user', (event, arg) => {

    event.reply("got-user", user);
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    //const python = spawn('python', ['manage.py', 'runserver', '7500']);
    createWindow()
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        return app.quit()
    }
    app.quit();
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }

})
