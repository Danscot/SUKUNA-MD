const { sendReply, formatSuccess, formatError, font } = require('../lib/helpers');
const fs = require('fs');
const path = require('path');

const MODES_CONFIG_PATH = path.join(__dirname, '..', 'session_dbs', 'modes.json');


function loadModesConfig() {
    try {
       
        const dir = path.dirname(MODES_CONFIG_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        
        if (!fs.existsSync(MODES_CONFIG_PATH)) {
            const defaultConfig = { users: {} };
            fs.writeFileSync(MODES_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }
        
        return JSON.parse(fs.readFileSync(MODES_CONFIG_PATH, 'utf8'));
    } catch (error) {
        console.error('Erreur lors du chargement des modes:', error);
        return { users: {} };
    }
}


function saveModesConfig(config) {
    try {
        fs.writeFileSync(MODES_CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des modes:', error);
    }
}


function canExecuteCommand(phoneNumber, senderId) {
    const config = loadModesConfig();
    const userConfig = config.users[phoneNumber] || { mode: 'public' };
    
    if (userConfig.mode === 'public') {
        return true;
    }
    
   
    const senderNumber = senderId.split('@')[0].split(':')[0];
    return senderNumber === phoneNumber;
}

module.exports = {
    name: 'mode',
    description: 'Change le mode d\'accès du bot (public/private)',
    async execute({ sock, msg, args, phoneNumber }) {
        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNumber = sender.split('@')[0].split(':')[0];

        if (senderNumber !== phoneNumber) {
            return sendReply(sock, jid, formatError('Seul le propriétaire du bot peut changer le mode.'));
        }

        if (!args[0] || !['public', 'private'].includes(args[0].toLowerCase())) {
            return sendReply(sock, jid, formatError('Mode invalide. Utilisez: !mode public ou !mode private'));
        }

        const newMode = args[0].toLowerCase();
        const config = loadModesConfig();
        
        if (!config.users[phoneNumber]) {
            config.users[phoneNumber] = {};
        }
        
        config.users[phoneNumber].mode = newMode;
        saveModesConfig(config);

        const modeText = newMode === 'public' ? 'public (tout le monde peut utiliser les commandes)' : 
                                               'privé (seul vous pouvez utiliser les commandes)';
        
        return sendReply(sock, jid, formatSuccess(`Mode changé en: ${modeText}`));
    },
    canExecuteCommand 
};