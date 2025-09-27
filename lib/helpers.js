
const fs = require('fs');
const path = require('path');
const config = require('../config');

const DB_PATH = path.resolve(__dirname, 'db.json');
const DB_BACKUP_PATH = path.resolve(__dirname, 'db.json.bak');

let db = {};

function loadDB() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const content = fs.readFileSync(DB_PATH, 'utf-8');
            db = JSON.parse(content);
            console.log('✅ Base de données chargée avec succès.');
        } else {
            console.log('⚠️ Base de données introuvable, création d\'un fichier vide.');
            db = {};
            saveDB(); 
        }
    } catch (err) {
        console.error('❌ Erreur critique de lecture de la base de données:', err.message);
        console.error('🔄 Le fichier db.json est corrompu. Restauration depuis la sauvegarde...');
        
   
        try {
            if (fs.existsSync(DB_BACKUP_PATH)) {
                fs.copyFileSync(DB_BACKUP_PATH, DB_PATH);
                console.log('✅ Restauration de la base de données réussie.');
                const content = fs.readFileSync(DB_PATH, 'utf-8');
                db = JSON.parse(content);
            } else {
                console.warn('⚠️ Aucune sauvegarde de base de données trouvée. Démarrage avec une base de données vide.');
                db = {};
            }
        } catch (restoreErr) {
            console.error('❌ Échec de la restauration de la base de données:', restoreErr.message);
            console.warn('Démarrage avec une base de données vide pour éviter le plantage.');
            db = {};
        }
    }
}

function saveDB() {
    try {
        
        if (fs.existsSync(DB_PATH)) {
            fs.copyFileSync(DB_PATH, DB_BACKUP_PATH);
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        console.log('✅ Base de données sauvegardée avec succès.');
    } catch (error) {
        console.error('❌ Erreur de sauvegarde de la base de données:', error.message);
      
    }
}


loadDB();

/**
 
 * @param {string} groupId - L'ID du groupe.
 * @returns {object} - L'objet de configuration du groupe.
 */
/**
 
 */
function getGroupConfig(jid) {
    if (!db.groups) db.groups = {};
    if (!db.groups[jid]) {
        db.groups[jid] = {
            antilink: { enabled: false, kickThreshold: 3 },
            antispam: { enabled: false, kickThreshold: 3 },
            antimention: { enabled: false },
            antitag: { enabled: false },
            welcome: { enabled: false, text: '' },
            goodbye: { enabled: false, text: '' },
            users: {},
        };
        saveDB();
    }
    return db.groups[jid];
}

function getGroupUser(jid, sender) {
    const group = getGroupConfig(jid);
    if (!group.users) group.users = {};
    if (!group.users[sender]) {
        group.users[sender] = {
            antilink_warnings: 0,
            antispam_warnings: 0,
            messages: [],
        };
        saveDB();
    }
    return group.users[sender];
}


function font(text) {
    const normalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const fancyChars = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ';
    
    return text.split('').map(char => {
        const index = normalChars.indexOf(char);
        return index !== -1 ? fancyChars[index] : char;
    }).join('');
}

function stylise(text) {
    return [
        '╭━━━━━━━━━━━✦',
        '',
        font(text),
        '',
        '╰━━━━━━━━━━━✦'
    ].join('\n');
}


function buildContext(options = {}) {
    return {
        mentionedJid: options.mentions || [],
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
            title: "SUKUNA - XMD",
            body: "BY STEPHDEV",
            thumbnailUrl: 'https://i.postimg.cc/gkBjFqvB/sukuna.jpg',
            sourceUrl: null,
            mediaType: 1,
            renderLargerThumbnail: false,
            showAdAttribution: true
        }
    };
}


/**
 
 * @param {object} sock - Instance de connexion WhatsApp
 * @param {string} to - ID du destinataire
 * @param {string} text - Texte du message
 * @param {object} options - Options additionnelles (quoted, mentions)
 */
async function sendReply(sock, to, text, options = {}) {
    const messageOptions = {
        text: stylise(text),
        contextInfo: buildContext(options)
    };

    await sock.sendMessage(to, messageOptions, {
        quoted: options.quoted || null
    });
}

/**
 
 * @param {object} sock - Instance de connexion WhatsApp
 * @param {string} to - ID du destinataire
 * @param {string} text - Texte du message
 * @param {string} imageUrl - URL de l'image
 * @param {object} options - Options additionnelles (quoted, mentions)
 */
async function sendImageReply(sock, to, text, imageUrl, options = {}) {
    await sock.sendMessage(to, {
        image: { url: imageUrl },
        caption: stylise(text),
        contextInfo: buildContext(options)
    }, {
        quoted: options.quoted || null
    });
}

/**
 
 * @param {string} text - Texte d'erreur
 * @returns {string} - Message d'erreur formaté
 */
function formatError(text) {
    return `❌ *ᴇʀʀᴇᴜʀ*\n\n${font(text)}`;
}

/**
 
 * @param {string} text - Texte de succès
 * @returns {string} - Message de succès formaté
 */
function formatSuccess(text) {
    return `✅ *ꜱᴜᴄᴄᴇꜱ*\n\n${font(text)}`;
}

/**
 
 * @param {string} text - Texte d'aide
 * @returns {string} - Message d'aide formaté
 */
function formatHelp(text) {
    return `💡 *ᴀɪᴅᴇ*\n\n${font(text)}`;
}


module.exports = {
    db,
    saveDB,
    font,
    stylise,
    buildContext,
    sendReply,
    sendImageReply,
    formatError,
    formatSuccess,
    formatHelp,
    getGroupConfig,
    getGroupUser
};