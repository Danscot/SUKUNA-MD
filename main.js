const TelegramBot = require('node-telegram-bot-api');
const WhatsAppManager = require('./whatsappManager');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const {font} = require('./lib/helpers');


const telegramBot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });
const whatsappManager = new WhatsAppManager();


const SESSIONS_FILE = './sessions.json';
let activeSessions = {};


function loadSessions() {
    if (fs.existsSync(SESSIONS_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(SESSIONS_FILE));
            activeSessions = data.sessions || {};
        } catch (err) {
            console.error("Erreur lecture sessions:", err);
            activeSessions = {};
        }
    }
}


function saveSessions() {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify({ 
        sessions: Object.keys(activeSessions) 
    }, null, 2));
}


async function checkUserMemberships(userId) {
    const requiredItems = [
        ...(config.REQUIRED_CHANNELS || []),
        ...(config.REQUIRED_GROUPS || [])
    ];
    const missingMemberships = [];

    for (const item of requiredItems) {
        try {
            const member = await telegramBot.getChatMember(item.id, userId);
            const status = member.status;
            
            if (status !== 'member' && status !== 'creator' && status !== 'administrator') {
                missingMemberships.push(item);
            }
        } catch (error) {
           
            console.error(`❌ Erreur vérification adhésion pour ${item.name} (${item.id}) :`, error.response ? error.response.body : error.message);

            
            if (error.response && error.response.statusCode === 400) {
                 missingMemberships.push(item);
            } else {
                 missingMemberships.push(item);
            }
        }
    }

    return missingMemberships;
}


async function sendMembershipRequestMessage(chatId, missingItems, messageId = null) {
    let joinMessage = `⚠️ **Accès refusé** ⚠️\n\nPour utiliser cette commande, vous devez d'abord rejoindre les éléments suivants :\n\n`;
    const keyboard = {
        reply_markup: {
            inline_keyboard: []
        }
    };

    missingItems.forEach(item => {
        joinMessage += `➡️ **${item.name}**\n`;
        keyboard.reply_markup.inline_keyboard.push(
            [{ text: font(`${item.name}`), url: item.invite_link }]
        );
    });

    
    keyboard.reply_markup.inline_keyboard.push(
        [{ text: font('✅rejoint'), callback_data: 'check_membership' }]
    );
    
    if (messageId) {
       
        telegramBot.editMessageText(joinMessage, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: keyboard.reply_markup,
            parse_mode: 'Markdown'
        });
    } else {
         
        telegramBot.sendMessage(chatId, joinMessage, {
            reply_markup: keyboard.reply_markup,
            parse_mode: 'Markdown'
        });
    }
}



const imageURL = 'https://postimg.cc/0bDP7SXp';

telegramBot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const captionText = `
╭━━━━━━━━━━━━━━━✦
┃   ❏ 𝙎𝙐𝙆𝙐𝙉𝘼 - 𝘾𝙤𝙣𝙣𝙚𝙘𝙩 ❏
┃    *ᴍᴀᴋᴇ ʙʏ ꜱᴛᴇᴘʜᴅᴇᴠ*
╰━━━━━━━━━━━━━━━✦

╭━━━━━━━━━━━━━━━✦
┃▢ \`/ʟɪɴᴋ ɴᴜᴍÉʀᴏ\` 
┃    ex : /link 237698711205
┃▢\`/ᴅᴇʟʟɪɴᴋ ɴᴜᴍÉʀo\` 
┃▢\`/ꜱᴛᴀᴛᴜꜱ\` - ᴠᴏɪʀ ᴠᴏꜱ ꜱᴇꜱꜱɪᴏɴꜱ ᴀᴄᴛɪᴠᴇꜱ
╰━━━━━━━━━━━━━━━✦

ᴄᴏɴɴᴇᴄᴛᴇᴢ ᴠᴏᴜꜱ ᴀ ꜱᴜᴋᴜɴᴀ - xᴍᴅ`;

    try {
        await telegramBot.sendPhoto(
            chatId, 
            imageURL, 
            {
                caption: captionText, 
                parse_mode: 'Markdown' 
            }
        );
        console.log(`✅ Photo envoyée à la conversation ${chatId}.`);

    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de la photo:", error.message);
        telegramBot.sendMessage(chatId, 
            `❌ Erreur lors de l'envoi de l'image. Veuillez vérifier si le fichier existe ou si l'URL est valide.`
        );
    }
});


telegramBot.onText(/\/link\s+(\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const phoneNumber = match[1];

   
    const missingMemberships = await checkUserMemberships(userId);
    
    if (missingMemberships.length > 0) {
        return sendMembershipRequestMessage(chatId, missingMemberships);
    }
    
    if (!phoneNumber || phoneNumber.length < 8) {
        return telegramBot.sendMessage(chatId, "❌ Numéro invalide. Format: /link 237698711207");
    }

    
    if (activeSessions[phoneNumber]) {
        return telegramBot.sendMessage(chatId, font (`ℹ️ Le numéro ${phoneNumber} est déjà connecté.`));
    }

    
    const userSessions = Object.keys(activeSessions).filter(num => 
        activeSessions[num].userId === userId
    );
    
    if (userSessions.length >= config.MAX_SESSIONS_PER_USER) {
        return telegramBot.sendMessage(chatId, 
            font(`❌ Limite atteinte (${config.MAX_SESSIONS_PER_USER} sessions max par utilisateur).`)
        );
    }

    try {
        telegramBot.sendMessage(chatId, font(`⏳ Initialisation de la session pour ${phoneNumber}...`));

       
        const result = await whatsappManager.createSession(phoneNumber, {
            onPairingCode: (code) => {
                const pairingMessage = `
┃▢ɴᴜᴍÉʀᴏ : ${phoneNumber} 
┃▢ᴄᴏᴅᴇ ᴅᴇ ᴘᴀɪʀᴀɢᴇ : \`${code}\`


ᴠᴏᴛʀᴇ ᴄᴏᴅᴇ ᴇꜱ ᴠᴀʟɪᴅᴇ ᴘᴏᴜʀ 60 ꜱᴇᴄᴏɴᴅᴇ`;

                telegramBot.sendMessage(chatId, pairingMessage, { parse_mode: 'Markdown' });
            },
            onConnected: () => {
                activeSessions[phoneNumber] = {
                    userId: userId,
                    chatId: chatId,
                    connectedAt: new Date().toISOString(),
                    status: 'active'
                };
                saveSessions();

                const successMessage = `

cᴏɴɴᴇᴄᴛɪᴏɴ ʀÉᴜꜱꜱɪ 

┃▢**ɴᴜᴍÉʀᴏ:** ${phoneNumber}
┃▢**ꜱᴛᴀᴛᴜᴛ:** ᴀᴄᴛɪꜰ
┃▢**ᴄᴏɴɴᴇᴄᴛÉ:** ${new Date().toLocaleString()}

ꜱᴜᴋᴀɴᴀ ᴇꜱᴛ ᴄᴏɴɴᴇᴄᴛᴇʀ!`;

                telegramBot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
            },
            onDisconnected: (reason) => {
                delete activeSessions[phoneNumber];
                saveSessions();
                
                telegramBot.sendMessage(chatId, 
                    font(`📵 Session ${phoneNumber} déconnectée. Raison: ${reason}`)
                );
            },
            onError: (error) => {
                delete activeSessions[phoneNumber];
                saveSessions();
                
                telegramBot.sendMessage(chatId, 
                    `❌ Erreur avec la session ${phoneNumber}: ${error.message}`
                );
            }
        });

    } catch (error) {
        telegramBot.sendMessage(chatId, 
            `❌ Erreur lors de la création de la session: ${error.message}`
        );
    }
});

telegramBot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const messageId = callbackQuery.message.message_id;

    if (callbackQuery.data === 'check_membership') {
        await telegramBot.answerCallbackQuery(callbackQuery.id, { text: font('🔍 Vérification en cours...') });

        const missingMemberships = await checkUserMemberships(userId);
        
        if (missingMemberships.length > 0) {
            await sendMembershipRequestMessage(chatId, missingMemberships, messageId);
        } else {
            try {
                await telegramBot.deleteMessage(chatId, messageId);
            } catch (err) {
                console.error("Erreur suppression message:", err.message);
            }

            const successMessage = font(`🎉 **BIEN !**\n\nVous avez rejoint toutes les chaînes et groupes requis. Vous pouvez maintenant utiliser la commande \`/link\` pour vous connecter a sukuna.`);
            telegramBot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
        }
    }
});


telegramBot.onText(/\/dellink\s+(\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const phoneNumber = match[1];

    if (!activeSessions[phoneNumber]) {
        return telegramBot.sendMessage(chatId, font(`❌ Aucune session active pour ${phoneNumber}.`));
    }

    
    if (activeSessions[phoneNumber].userId !== userId) {
        return telegramBot.sendMessage(chatId, font("❌ Vous ne pouvez déconnecter que vos propres sessions."));
    }

    try {
        await whatsappManager.removeSession(phoneNumber);
        delete activeSessions[phoneNumber];
        saveSessions();

        telegramBot.sendMessage(chatId, 
            font(`✅ Session ${phoneNumber} déconnectée avec succès.`)
        );
    } catch (error) {
        telegramBot.sendMessage(chatId, 
            font(`❌ Erreur lors de la déconnexion: ${error.message}`)
        );
    }
});


telegramBot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const userSessions = Object.keys(activeSessions).filter(num => 
        activeSessions[num].userId === userId
    );

    if (userSessions.length === 0) {
        return telegramBot.sendMessage(chatId, "Aucun bot actif.");
    }

    let statusMessage = font(`**┃▢Vos bots actifs:**\n\n`);
    
    userSessions.forEach(number => {
        const session = activeSessions[number];
        statusMessage += `**${number}**\n`;
        statusMessage += `  └ Statut: ${session.status}\n`;
        statusMessage += `  └ Connecté: ${new Date(session.connectedAt).toLocaleString()}\n\n`;
    });

    telegramBot.sendMessage(chatId, font(statusMessage), { parse_mode: 'Markdown' });
});


loadSessions();
console.log('🤖 Bot Telegram démarré!');
