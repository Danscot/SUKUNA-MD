const userConfigManager = require('../userConfigManager');
const { sendReply, formatError, formatSuccess, formatHelp } = require('../lib/helpers');

module.exports = {
    name: 'setname',
    aliases: ['name', 'botname', 'changename'],
    description: 'Définir le nom de votre bot personnel',
    usage: 'setname <nouveau_nom>',
    
    async execute({ sock, msg, args, phoneNumber }) {
        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        
        if (isGroup) {
            return sendReply(sock, jid, formatError('ᴄᴇᴛᴛᴇ ᴄᴏᴍᴍᴀɴᴅᴇ ɴᴇ ᴘᴇᴜᴛ ᴇᴛʀᴇ ᴜᴛɪʟɪꜱᴇᴇ ǫᴜᴇ ᴇɴ ᴘʀɪᴠᴇ ᴘᴀʀ ʟᴇ ᴘʀᴏᴘʀɪᴇᴛᴀɪʀᴇ ᴅᴜ ʙᴏᴛ.'), { quoted: msg });
        }

        if (!args.length) {
            const currentConfig = userConfigManager.getUserConfig(phoneNumber);
            const helpText = `🤖 ᴄᴏɴꜰɪɢᴜʀᴀᴛɪᴏɴ ᴅᴜ ɴᴏᴍ ᴅᴜ ʙᴏᴛ

ɴᴏᴍ ᴀᴄᴛᴜᴇʟ: ${currentConfig.botName}

ᴜꜱᴀɢᴇ: ${currentConfig.prefix}ꜱᴇᴛɴᴀᴍᴇ <ɴᴏᴜᴠᴇᴀᴜ_ɴᴏᴍ>

ᴇxᴇᴍᴘʟᴇꜱ:
• ${currentConfig.prefix}ꜱᴇᴛɴᴀᴍᴇ ᴍᴏɴ ᴀꜱꜱɪꜱᴛᴀɴᴛ
• ${currentConfig.prefix}ꜱᴇᴛɴᴀᴍᴇ ʙᴏᴛᴘʀᴏ
• ${currentConfig.prefix}ꜱᴇᴛɴᴀᴍᴇ ʜᴇʟᴘᴇʀ_2024

ʀᴇɢʟᴇꜱ:
• 2-30 ᴄᴀʀᴀᴄᴛᴇʀᴇꜱ
• ʟᴇᴛᴛʀᴇꜱ, ᴄʜɪꜰꜰʀᴇꜱ, ᴇꜱᴘᴀᴄᴇꜱ, - _ . ᴀᴜᴛᴏʀɪꜱᴇꜱ
• ᴘᴀꜱ ᴅᴇ ᴄᴀʀᴀᴄᴛᴇʀᴇꜱ ꜱᴘᴇᴄɪᴀᴜx ᴇxᴄᴇꜱꜱɪꜰꜱ`;

            return sendReply(sock, jid, formatHelp(helpText), { quoted: msg });
        }

        const newName = args.join(' ');

        try {
            const updatedConfig = userConfigManager.setBotName(phoneNumber, newName);
            
            const successText = `ɴᴏᴍ ᴅᴜ ʙᴏᴛ ᴍɪꜱ ᴀ ᴊᴏᴜʀ ᴀᴠᴇᴄ ꜱᴜᴄᴄᴇꜱ!

ᴀɴᴄɪᴇɴ ɴᴏᴍ: ${newName === 'Multi-Bot' ? 'Assistant' : 'Multi-Bot'}
ɴᴏᴜᴠᴇᴀᴜ ɴᴏᴍ: ${updatedConfig.botName}

ᴀᴘᴇʀᴄᴜ:
🤖 ${updatedConfig.botName} ᴠᴏᴜꜱ ꜱᴏᴜʜᴀɪᴛᴇ ʟᴀ ʙɪᴇɴᴠᴇɴᴜᴇ!

ᴠᴏᴛʀᴇ ʙᴏᴛ ᴀ ᴍᴀɪɴᴛᴇɴᴀɴᴛ ᴜɴᴇ ɪᴅᴇɴᴛɪᴛᴇ ᴘᴇʀꜱᴏɴɴᴀʟɪꜱᴇᴇ! 🎉`;
            
            await sendReply(sock, jid, formatSuccess(successText), { quoted: msg });

        } catch (error) {
            const errorText = `ᴇʀʀᴇᴜʀ ʟᴏʀꜱ ᴅᴇ ʟᴀ ᴄᴏɴꜰɪɢᴜʀᴀᴛɪᴏɴ ᴅᴜ ɴᴏᴍ

${error.message}

ɴᴏᴍ ᴀᴄᴛᴜᴇʟ ᴄᴏɴꜱᴇʀᴠᴇ: ${userConfigManager.getUserConfig(phoneNumber).botName}`;
            
            await sendReply(sock, jid, formatError(errorText), { quoted: msg });
        }
    }
};