// INIT
const config = require("./config.json");
const discord = require('discord.js');
const firebase = require("firebase");
const bot = new discord.Client();
bot.login(config.botToken);
firebase.initializeApp(config.firebaseConfig);
const db = firebase.firestore();

// UTILS STRINGS
const helpTxt = "Oi eu sou o OfensaBot =)" +
    "\nCaso seja a minha primeira vez no canal digite !init" +
    "\nSe quiser adicionar um insulto digite !novoinsulto seu_insulto" +
    "\nSe quiser uma lista de todos os insultos do canal digite !listainsultos" +
    "\nSe quiser uma lista dos insultos mais populares digite !topinsultos" +
    "\nSe quiser ouvir um insulto basta me mencionar"

// BOT START    
bot.once('ready', () => {
    console.log(`Bot ready`);
});

// BOT MESSAGE LISTENER
bot.on('message', message => {
    if (message.isMentioned(bot.user)) {
        firebaseService.getRandomInsult(message)
    }

    if (message.content.startsWith("!init")) {
        firebaseService.initChannel(message);
    }

    if (message.content.startsWith("!ajuda")) {
        message.channel.send(helpTxt);
    }

    if (message.content.startsWith("!listainsultos")) {
        firebaseService.listChannelInsults(message)
    }

    if (message.content.startsWith("!novoinsulto")) {
        firebaseService.addInsult(message);
    }

    if (message.content.startsWith("!topinsultos")) {
        firebaseService.listTopInsults(message);
    }
});

const firebaseService = {
    getReferenceToObect: function (message) {
        return db.collection("channels").doc(message.guild.id);
    },

    initChannel: function (message) {
        let ref = firebaseService.getReferenceToObect(message);
        ref.get()
            .then((snap) => {
                if (!snap.exists) {
                    ref.set({
                        insults: {
                            "Seu feio": 0
                        },
                        name: message.guild.name
                    })
                    message.channel.send("InsultoBot inicializado com sucesso neste canal!");
                }
                else {
                    message.channel.send("Imbecil! Alguém já usou !init");
                }
            })
            .catch((error) => {
                console.error("Error creating document: ", error);
            });
    },

    addInsult: function (message) {
        let ref = firebaseService.getReferenceToObect(message);
        let newInsultName  = message.content.split("!novoinsulto")[1].trim();

        if (newInsultName) {
            if (newInsultName.length > 200) {
                message.reply("Insulto não pode exceder 200 caracteres!");
                return;
            }

            ref.get()
                .then((doc) => {
                    if (!doc.exists) {
                        message.reply("Digite !init antes de adicionar algum insulto");
                        return;
                    }

                    // CHECK IF INSULT ALREADY EXISTS
                    let insultArray = Object.entries(doc.data().insults);
                    for (i = 0; i < insultArray.length; i++) {
                        console.log(insultArray[i][0] + "//" + newInsultName);
                        if (insultArray[i][0] == newInsultName) {
                            message.reply("Esse insulto já foi cadastrado");
                            return;
                        }
                    }

                    let newInsultKey = `insults.${newInsultName}`;
                    ref.update({
                        [newInsultKey]: 0
                    })
                        .then(() => {
                            console.log(`Added insult: '${newInsultName}'`);
                            message.channel.send("Insulto cadastrado com sucesso!");
                        })
                        .catch((error) => {
                            console.error("Error adding insult: ", error);
                        });

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
                    let insultsArray = Object.keys(docData.insults);
                    let random = Math.floor(Math.random() * insultsArray.length);
                    message.reply(`${ insultsArray[random] } `);
                    console.log(`Insult: '${insultsArray[random]}'`);

                    //UPDATE INSULT COUNT
                    let insultCurrentCount = docData.insults[insultsArray[random]];
                    let insultKey = `insults.${ insultsArray[random] } `;
                    ref.update({
                        [insultKey]: insultCurrentCount + 1
                    });

                } else {
                    message.reply(`Digite!init para incializar o bot`);
                    console.log('No such document!');
                }
            })
            .catch(error => {
                console.log('Error getting document', error);
            });
    },

    listChannelInsults: function (message) {
        let ref = firebaseService.getReferenceToObect(message);
        ref.get()
            .then(doc => {
                if (doc.exists) {
                    let docData = doc.data();
                    let insultList = Object.keys(docData.insults).join("\n");
                    message.channel.send(insultList);
                } else {
                    message.reply(`Digite!init para incializar o bot`);
                    console.log('No such document!');
                }
            })
            .catch(error => {
                console.log('Error getting document', error);
            });
    },

    listTopInsults: function (message) {
        let ref = firebaseService.getReferenceToObect(message);
        ref.get()
            .then(doc => {
                if (doc.exists) {
                    let docData = doc.data();

                    //RETURNS AN ARRAY OF ARRAYS WHERE THE INNER ARRAYS CONSISTS OF [INSULT_NAME, INSULT_COUNT] 
                    let insultArrayDesc = Object.entries(docData.insults).sort(function (a, b) {
                        return a[1] < b[1] ? 1 : -1;
                    });

                    let insultListTop3 = "TOP 3 INSULTOS:\n";
                    for (i = 0; i < 3; i++) {
                        if (insultArrayDesc[i]) {
                            insultListTop3 += `${insultArrayDesc[i][0]}: ${insultArrayDesc[i][1]} vezes\n`;
                        }
                    }
                    message.channel.send(insultListTop3);

                } else {
                    message.reply(`Digite !init para incializar o bot`);
                    console.log('No such document!');
                }    
            })                                            
            .catch(error => {
                console.log('Error getting document', error);
            });
    }
}


