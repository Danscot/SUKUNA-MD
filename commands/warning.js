
const { sendReply, formatSuccess, formatError } = require('../lib/helpers');
const { isAdmin } = require('../lib/isAdmin');

module.exports = {
    name: 'warnings',
    aliases: ['warns', 'avertissements'],
    description: 'Voir les avertissements d\'un utilisateur ou de tous',
    usage: 'warnings [@utilisateur] [reset]',

    async execute({ sock, msg, args, getGroupConfig, getGroupUser, saveDB, phoneNumber }) {
        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return await sendReply(sock, jid, formatError('Cette commande ne peut être utilisée qu\'en groupe.'), { quoted: msg });
        }

        const isUserAdmin = await isAdmin(sock, jid, sender);
        if (!isUserAdmin) {
            return await sendReply(sock, jid, formatError('Vous devez être admin pour utiliser cette commande.'), { quoted: msg });
        }

        const groupConfig = getGroupConfig(jid);
        
        
        if (args.includes('reset')) {
            if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                
                const targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
                const userConfig = getGroupUser(jid, targetUser);
                userConfig.antilink_warnings = 0;
                userConfig.antispam_warnings = 0;
                userConfig.messages = [];
                saveDB();
                
                return await sendReply(
                    sock, 
                    jid, 
                    formatSuccess(`Avertissements réinitialisés pour l'utilisateur mentionné.\n\nSession: ${phoneNumber}`),
                    { quoted: msg }
                );
            } else {
                
                Object.keys(groupConfig.users || {}).forEach(userId => {
                    groupConfig.users[userId].antilink_warnings = 0;
                    groupConfig.users[userId].antispam_warnings = 0;
                    groupConfig.users[userId].messages = [];
                });
                saveDB();
                
                return await sendReply(
                    sock, 
                    jid, 
                    formatSuccess(`Tous les avertissements ont été réinitialisés.\n\nSession: ${phoneNumber}`),
                    { quoted: msg }
                );
            }
        }

       
        if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
           
            const targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            const userConfig = getGroupUser(jid, targetUser);
            const phone = targetUser.split('@')[0];
            
            const warningText = `⚠️ **Avertissements de @${phone}**\n\n` +
                `🔗 Antilink: ${userConfig.antilink_warnings || 0}\n` +
                `🚫 Antispam: ${userConfig.antispam_warnings || 0}\n\n` +
                `🔧 Session: ${phoneNumber}`;

            await sendReply(sock, jid, warningText, { quoted: msg });
        } else {
         
            const users = groupConfig.users || {};
            const usersWithWarnings = Object.entries(users)
                .filter(([userId, userData]) => 
                    (userData.antilink_warnings || 0) > 0 || (userData.antispam_warnings || 0) > 0
                )
                .slice(0, 10); 

            if (usersWithWarnings.length === 0) {
                return await sendReply(
                    sock, 
                    jid, 
                    formatSuccess(`Aucun avertissement dans ce groupe.\n\nSession: ${phoneNumber}`),
                    { quoted: msg }
                );
            }

            let warningText = `⚠️ **Avertissements du groupe**\n\n`;
            
            usersWithWarnings.forEach(([userId, userData]) => {
                const phone = userId.split('@')[0];
                const antilink = userData.antilink_warnings || 0;
                const antispam = userData.antispam_warnings || 0;
                
                if (antilink > 0 || antispam > 0) {
                    warningText += `👤 @${phone}\n`;
                    if (antilink > 0) warningText += `  🔗 Antilink: ${antilink}\n`;
                    if (antispam > 0) warningText += `  🚫 Antispam: ${antispam}\n`;
                    warningText += '\n';
                }
            });
            
            warningText += `🔧 Session: ${phoneNumber}`;

            await sendReply(sock, jid, warningText, { quoted: msg });
        }
    }
};