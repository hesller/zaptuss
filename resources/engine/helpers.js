const nodeFetch = require("node-fetch");
const Swal = require("sweetalert2");

let devMode = false;

module.exports.getDevMode = function () {
    let debugMode = devMode;
    return debugMode;
}

module.exports.updateMessageCounts = (user, oper, value = null) => {
    if (oper === 'add') {
        let messagesSent = parseInt(user['plan']['messages_sent']) + 1;
        return messagesSent;
    }
}

module.exports.RandomDelay = function getRandomValue(min, max) {
    const random = Math.random()
    const random_min_max = random * (max - min)
    const random_min = random_min_max + min
    return random_min;
}

module.exports.FormatData = function formatData(data) {
    return new Promise((resolve, reject) => {
        let contacts = Object.values(data[0])
        let messages = Object.values(data[1])
        let delayMin = parseInt(data[2])
        let delayMax = parseInt(data[3])
        let imgPath = data[4] === null ? null : data[4].replace(/\\/g,'/')
        let imgCaption = data[5]
        let typingMode = data[6]
        let sectionName = data[7][0]
        let nineCheckbox = data[7][1]
        let clientData = data[8]

        resolve([contacts, messages,delayMin, delayMax,imgPath,imgCaption,sectionName,typingMode,clientData])
    }).then(res => {
        console.log(res)
        return res;
    })
        .catch(error => {
        console.log("error when formatting the data")
    })
}

module.exports.ExtractorFormatData = function extractorFormatData(data) {
    const initialNumber = parseInt(data[0]);
    const totalNumbers = parseInt(data[1]);
    const isTurbo = data[2];
    return [initialNumber, totalNumbers, isTurbo]
}

module.exports.messagesSent = async function(userData, url) {
    console.log("inside messages sent")
    let token = userData['token'];
    var data = [];

    nodeFetch(url, {
        method: "get",
        headers: {
            "X-CSRFToken": token,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`

        },
    }).then(function(response) {

        return response.json();
    }).then(function(data) {
        data = data;
        console.log(data)
        console.log("Data is ok");
    }).catch(function(ex) {
        console.log("parsing failed", ex);
    });

    return data;
}

module.exports.displayLoading = (title, message) => {
    Swal.fire({
        title: title,
        text: message,
        onBeforeOpen: () => {
            Swal.showLoading()
        },
    })
}

module.exports.displaySuccess = (title, message, timing = null) => {
    Swal.fire({
        title: title,
        text: message,
        icon: "success",
        timer: timing ? timing : null
    })
}

module.exports.displayError = (title, message, timing = null) => {
    Swal.fire({
        title: title,
        text: message,
        icon: "error",
        timer: timing ? timing : null
    })
}

module.exports.saveAuthInfo = async (client) => {
   const fs = require("fs");
    // save credentials whenever updated
    try {
        const authInfo = await client.base64EncodedAuthInfo() // get all the auth info we need to restore this session
        fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo, null, '\t')) // save this info to a file
        console.log (`credentials updated!`)
        return true
    } catch (err) {
        return false
    }
}

// ================================================================
//  URL
//  here you define the standard urls
// ================================================================
module.exports.urlType = (urlsTypes) = {
    MESSAGECREATE: 'messageCreate',
    LOGIN: 'login',
}

module.exports.getUrl = (urlType) => {
    let prefix= '';
    if (devMode) {
        prefix = 'http://127.0.0.1:8000/'

    } else {
        prefix = "https://zaptuss.com/"
    }

    switch(urlType) {
        case urlsTypes.MESSAGECREATE:
            return prefix + "api/messages/create/";

        case urlsTypes.LOGIN:
            return prefix + "api/users/login/"
    }


}

// ================================================================
//  CHAR JS HELPERS
// ================================================================
module.exports.formatDatasetForTotalMessagesChart = function (dataset) {

    var datavalues = [];

    for (var i = 1; i < 32; i++) {
        if (i in Object.keys(dataset)) {
            datavalues.push(dataset[i.toString()]);
            console.log(dataset[i.toString()])
        } else {
            datavalues.push(0);
        }
    }

    return datavalues;
}

module.exports.getMonth = function (month = null) {
    var datetime = new Date();
    var selectedMonth;

    if (month === null) {
        selectedMonth = datetime.getMonth();
        return selectedMonth;
    } else {
        selectedMonth = month -1;
        return selectedMonth;
    }
}

module.exports.reduceToMaximumCounts = function (data) {

    let countedMessages = data.reduce(function (allMessages, singleMessage) {
        if (singleMessage['day_of_month'] in allMessages) {
            allMessages[singleMessage['day_of_month'].toString()]++
        }
        else {
            allMessages[singleMessage['day_of_month'].toString()] = 0
        }
        return allMessages
    }, {})

    return countedMessages;
}

