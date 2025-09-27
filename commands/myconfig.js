const userConfigManager = require('../userConfigManager');
const { sendReply, formatHelp } = require('../lib/helpers');

module.exports = {
    name: 'myconfig',
    aliases: ['config', 'settings', 'mesparamètres'],
    description: 'Afficher vos paramètres personnels',
    
    async execute({ sock, msg, phoneNumber }) {
        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        
        if (isGroup) {
            return sendReply(sock, jid, '❌ ᴄᴇᴛᴛᴇ ᴄᴏᴍᴍᴀɴᴅᴇ ɴᴇ ᴘᴇᴜᴛ ᴇᴛʀᴇ ᴜᴛɪʟɪꜱᴇᴇ ǫᴜᴇ ᴇɴ ᴘʀɪᴠᴇ.', { quoted: msg });
        }

        const config = userConfigManager.getUserConfig(phoneNumber);
        
        const configText = `⚙️ ᴠᴏꜱ ᴘᴀʀᴀᴍᴇᴛʀᴇꜱ ᴘᴇʀꜱᴏɴɴᴇʟꜱ

📱 ɴᴜᴍᴇʀᴏ: ${phoneNumber}
🤖 ɴᴏᴍ ᴅᴜ ʙᴏᴛ: ${config.botName}
📝 ᴘʀᴇꜰɪxᴇ: ${config.prefix}

📅 ᴄʀᴇᴇ ʟᴇ: ${new Date(config.createdAt).toLocaleDateString('fr-FR')}
🔄 ᴍɪꜱ ᴀ ᴊᴏᴜʀ: ${new Date(config.updatedAt).toLocaleDateString('fr-FR')}

🛠️ ᴄᴏᴍᴍᴀɴᴅᴇꜱ ᴅᴇ ᴄᴏɴꜰɪɢᴜʀᴀᴛɪᴏɴ:
• ${config.prefix}ꜱᴇᴛɴᴀᴍᴇ <ɴᴏᴍ> - ᴄʜᴀɴɢᴇʀ ʟᴇ ɴᴏᴍ ᴅᴜ ʙᴏᴛ
• ${config.prefix}ꜱᴇᴛᴘʀᴇꜰɪx <ᴘʀᴇꜰɪxᴇ> - ᴄʜᴀɴɢᴇʀ ʟᴇ ᴘʀᴇꜰɪxᴇ
• ${config.prefix}ᴍʏᴄᴏɴꜰɪɢ - ᴠᴏɪʀ ᴄᴇꜱ ᴘᴀʀᴀᴍᴇᴛʀᴇꜱ

💡 ᴇxᴇᴍᴘʟᴇ ᴅ'ᴜᴛɪʟɪꜱᴀᴛɪᴏɴ:
${config.prefix}ᴍᴇɴᴜ - ᴍᴇɴᴜ ᴘʀɪɴᴄɪᴘᴀʟ
${config.prefix}ᴘɪɴɢ - ᴛᴇꜱᴛ ᴅᴇ ᴄᴏɴɴᴇxɪᴏɴ

ᴄᴏɴꜰɪɢᴜʀᴀᴛɪᴏɴ ᴘᴇʀꜱᴏɴɴᴀʟɪꜱᴇᴇ ᴀᴄᴛɪᴠᴇ! ✨`;

        await sendReply(sock, jid, formatHelp(configText), { quoted: msg });
    }
};
