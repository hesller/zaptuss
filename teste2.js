const https = require('http')
const path = require("path")
const vb = require("venom-bot")
const dt = new Date()
const fetch = require("node-fetch")
const url = "http://localhost:8000/api/messages/"
const {WAClient, MessageType, MessageOptions, GroupSettingChange, Mimetype} = require('@adiwajshing/baileys');
let client = new WAClient()

// var part = arr.length / 3
// dividindo por 3 tem que fazer var i =0; i < part - 1; i++
// the last promise must go from part * num_of_cores + 1 to  arr.length

// function starts conectio nto whatsapp
// let client = new WAClient();
// var currUser = connectToWhatsApp()
//     .catch(err => console.log("unexpected error: " + err)) // catch any errors


let newpath = "C:\\Users\\Hesller Huller\\Downloads\\Extracao_7_11_2020_as_20_21_26.xls";

let newContacts = getContacts(newpath)

async function getContacts(path) {
    let file = path;
    const csv = require('csv-parser');
    const fs = require('fs');
    const csvWriteStream = require("csv-write-stream");
    let writer = csvWriteStream();
    let contacts = []

    await new Promise((resolve, reject) => {
        return fs.createReadStream(file)
            .pipe(csv())
            .on("data", function (data) {
                contacts.push(data['whatsapp']);
            })
            .on('end', (res) => {
                resolve("end")
            })
            .on("error", (err => {
                console.log(err.message)
            }));
    });

    // clear the data first and remove the
    let contactsCache = []
    await new Promise((resolve, reject) => {
        for (var i = 0; i < contacts.length; i++) {
            let contact = contacts[i].toString();
            if (contactsCache.includes(contact) === false) {
                if (contact.startsWith('55')) {
                    contactsCache.push(contact);
                }
            }
            if (i === contacts.length - 1) {
                return resolve('done')

            }
        }
    })

    // define object chunk
    Object.defineProperty(Array.prototype, 'chunk_inefficient', {
        value: function(chunkSize) {
            var array = this;
            return [].concat.apply([],
                array.map(function(elem, i) {
                    return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
                })
            );
        }
    });

    // divide the array into chunks of 200
    let groupChunks = contactsCache.chunk_inefficient(200);

    // create the groups
    let groupCache = {}
    let groupCounter = 0;
    let groupNameStandard = 'ANUNCIE AQUI! ZAPTUSS -';

    await new Promise((resolve, reject) => {
        for (var i = 0 ; i < groupChunks.length; i++) {
            groupCounter ++;
            let groupName = groupNameStandard + ' ' + pad(groupCounter, 3)
            groupCache[groupName] = groupChunks[i];
            if (i === groupChunks.length - 1) {
                resolve("done")
            }
        }
    });

    connectToWhatsApp(groupCache)
        .catch(err => console.log("unexpected error: " + err)) // catch any errors
}


async function connectToWhatsApp(groupCache) {

    // const user = await client.connect()
    //     .then(value => {
    //         console.log("client connected")
    //     }).catch(res => {
    //         process.send({
    //             "error": "Erro ao autenticar no whatsapp, seu numero pode ter sido banido", 'type': 3,
    //             'section': sectionName
    //         })
    //     });

    // create the groups
    let names = Object.keys(groupCache);
    let numbers = Object.values(groupCache);

    for (var i=0; i < numbers.length; i++) {
        for (var j =0; j < numbers[i].length; j++) {
            numbers[i][j] = numbers[i][j] + '@c.us'
        }
    }

    await new Promise(async (resolve, reject) => {

        let user = await client.connect()
            .then(res => console.log("connected !"))
            .catch(err => {console.log("erro ao se conectar", err.message)});

        var groupCreated = {};
        for (var i = 4; i < numbers.length ; i++) { /// change here to add more groups
            // ==========================================
            //  create the group
            let group = await new Promise((resolve, reject) => {
                return setTimeout(async () => {

                    // get the group name
                    let groupName = names[i].toString();

                    // create the group
                    await client.groupCreate(groupName,
                        ['5521973769728@c.us'])
                        .then(res => {
                            groupCreated = res;
                            console.log("group created: ", res);
                            console.log("groupName ", groupName)
                            resolve('done')
                        })
                        .catch(err => console.log("erro ao criar grupo", err.message));

                    return groupCreated;
                }, 10000);
            })
                .catch(err => console.log(err.message));

            await new Promise(async resolve => {
                let groupGID = (groupCreated.gid).toString();
                await client.groupSettingChange (groupGID, GroupSettingChange.messageSend, true);
                await client.groupSettingChange (groupGID, GroupSettingChange.settingsChange, true);
                resolve("done");
            })
                .catch(err => console.log(err.message));

            // // ==========================================
            // //  add participants to group
            // await new Promise(async resolve1 => {
            //
            //     for (var k =0; k < numbers[i].length; k++) { //numbers[i].length
            //         await new Promise((resolve2, reject) => {
            //             // select random intervals
            //             let delayArray = [1000, 1500, 2000, 2500];
            //             const random = Math.floor(Math.random() * delayArray.length);
            //             let delaySelected = delayArray[random];
            //
            //             // random sleep before add each contact to the group
            //             setTimeout(async () => {
            //                 // get group id
            //                 let groupId = (groupCreated.gid).toString();
            //
            //                 // add the participant to the group
            //                 await client.groupAdd(groupId, [numbers[i][k]])
            //                     .then(res => {console.log("member added :", res)})
            //                     .catch(err => console.log("erro ao diacionar membro ao grupo ", err.message));
            //
            //                 // resolve the promise
            //                 resolve2('done');
            //
            //             }, delaySelected)
            //         })
            //             .catch(err => console.log("", err.message));
            //
            //         if (k === numbers[i].length - 1) {
            //             resolve1('done')
            //         }
            //     }
            //
            // })
            //     .catch(err => console.log(err.message));

            // ==========================================
            //  add participants to group
            await new Promise(async resolve1 => {

                // select random intervals
                let delayArray = [3000, 3500, 4000, 4500];
                const random = Math.floor(Math.random() * delayArray.length);
                let delaySelected = delayArray[random];

                // random sleep before add each contact to the group
                setTimeout(async () => {
                    // get group id
                    let groupId = (groupCreated.gid).toString();

                    // add the participant to the group
                    await client.groupAdd(groupId, numbers[i])
                        .then(res => {console.log("member added :", res)})
                        .catch(err => console.log("erro ao diacionar membro ao grupo ", err.message));

                    // resolve the promise
                    resolve1('done');

                }, delaySelected);

            })
                .catch(err => console.log(err.message));

            // =========================================
            // make admin
            await new Promise(async(resolve, reject) => {
                setTimeout(async () => {
                    let groupId = groupCreated.gid;
                    await client.groupMakeAdmin(groupId,['5521973769728@c.us'])
                        .then(res => console.log('make admin: ', res))
                        .catch(err => console.log(err.message));
                    resolve('done')
                }, 1500);
            })

            if(i === names.length - 1) {
                resolve("done")
            }
        }
    })
        .then(res => console.log("main loop done"))
        .catch(err => console.log(err.message));


}

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}