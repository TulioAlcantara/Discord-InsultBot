// INIT
const config = require("./config.json");
const discord = require('discord.js');
const bot = new discord.Client();
const firebase = require("firebase");
bot.login(config.botToken);

// FIREBASE
firebase.initializeApp(config.firebaseConfig);
const db = firebase.firestore();

// UTILS STRINGS
const helpTxt = "Oi eu sou o OfensaBot =)" +
    "\nSe quiser adicionar um insulto digite !novoinsulto seu_insulto" +
    "\nSe quiser uma lista de todos os insultos do canal digite !listainsultos" +
    "\nSe quiser ouvir um insulto basta me mencionar"
let insult =
    [
        "Pau no seu cu",
        "Comi sua mãe",
        "Comi seu pai",
        "Seu pai é broxa",
        "Seu pai é careca",
        "Sua mãe nasceu pelada",
        "Você é feio",
        "Ripei no poe"
    ];


// BOT START    
bot.once('ready', () => {
    console.log(`Bot ready`);

    //message.guild.id
    //message.author.id
});

// BOT MESSAGE LISTENER
bot.on('message', message => {
    if (message.isMentioned(bot.user)) {
        // firebaseService.checkIfChannelAlreadyExists(message);
        firebaseService.getRandomInsult(message)
    }

    if (message.content.startsWith("!ajuda")) {
        message.channel.send(helpTxt);
    }

    if (message.content.startsWith("!listainsultos")) {
        // let insultosDoCanal = insult.join("\n")
        // message.channel.send(insultosDoCanal);
        firebaseService.listChannelInsults(message)
    }

    if (message.content.startsWith("!novoinsulto")) {
        firebaseService.addInsult(message);
    }
});

const firebaseService = {
    getReferenceToObect: function (message) {
        return db.collection("channels").doc(message.guild.id);
    },

    // checkIfChannelAlreadyExists: function (message) {
    //     let ref = firebaseService.getReferenceToObect(message);
    //     ref.get()
    //         .then((snap) => {
    //             if (!snap.exists) {
    //                 ref.set({
    //                     insults: {},
    //                     name: message.guild.name
    //                 })
    //             }
    //         })
    //         .catch((error) => {
    //             console.error("Error creating document: ", error);
    //         });
    // },

    addInsult: function (message) {
        let ref = firebaseService.getReferenceToObect(message);
        let newInsultValue = message.content.split("!novoinsulto")[1].trim();

        if (newInsultValue) {
            if(newInsultValue.length > 200){
                message.reply("Insulto não pode exceder 200 caracteres!");
                return;
            }
            let newInsultKey = `insults.${newInsultValue}`;
            ref.update({
                [newInsultKey]: 0
            })
                .then(() => {
                    console.log(`Added insult: '${newInsultValue}'`);
                    message.channel.send("Insult successfully added!");
                })
                .catch((error) => {
                    console.error("Error adding insult: ", error);
                });
        }
        else {
            message.reply("Seu idiota, digite algum insulto\n!novoinsulto seu_insulto")
        }
    },

    getRandomInsult: function (message) {
        let ref = firebaseService.getReferenceToObect(message);
        ref.get()
            .then(doc => {
                if (doc.exists) {
                    let docData = doc.data();
                    let docArray = Object.keys(docData.insults);
                    let random = Math.floor(Math.random() * docArray.length);
                    message.reply(`${docArray[random]}`);
                    console.log('Document data:', docData);

                    //UPDATE INSULT COUNT
                    //let insultCurrentCount = docData.insults.docArray[random];
                    console.log(docData.insults + " " + docArray[random])
                    // let insultKey = `insults.${docArray[random]}`;
                    // ref.update({
                    //     [insultKey] : insultCurrentCount+1
                    // });
                } else {
                    message.reply(`Ainda não existem insultos cadastrados nesse canal!`);
                    console.log('No such document!');
                }
            })
            .catch(error => {
                console.log('Error getting document', error);
            });
    },

    listChannelInsults: function(message){
        let ref = firebaseService.getReferenceToObect(message);
        ref.get()
            .then(doc => {
                if (doc.exists) {
                    let docData = doc.data();
                    let insultList = Object.keys(docData.insults).join("\n");
                    message.channel.send(insultList);
                    console.log('Document data:', docData);
                } else {
                    message.reply(`Ainda não existem insultos cadastrados nesse canal!`);
                    console.log('No such document!');
                }
            })
            .catch(error => {
                console.log('Error getting document', error);
            });
    }
}

