
const { sendReply, formatSuccess, formatError } = require('../lib/helpers');
const { isAdmin } = require('../lib/isAdmin');

module.exports = {
    name: 'antilink',
    description: 'Activer/désactiver la protection contre les liens',
    usage: 'antilink <on/off>',

    async execute({ sock, msg, args, getGroupConfig, saveDB, phoneNumber }) {
        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        
        if (!jid.endsWith('@g.us')) {
            return await sendReply(sock, jid, formatError('ᴄᴇᴛᴛᴇ ᴄᴏᴍᴍᴀɴᴅᴇ ɴᴇ ᴘᴇᴜᴛ êᴛʀᴇ ᴜᴛɪʟɪsᴇᴇ ǫᴜ\'ᴇɴ ɢʀᴏᴜᴘᴇ.'), { quoted: msg });
        }

      
        const isUserAdmin = await isAdmin(sock, jid, sender);
        if (!isUserAdmin) {
            return await sendReply(sock, jid, formatError('ᴠᴏᴜs ᴅᴇᴠᴇᴢ êᴛʀᴇ ᴀᴅᴍɪɴ ᴘᴏᴜʀ ᴜᴛɪʟɪsᴇʀ ᴄᴇᴛᴛᴇ ᴄᴏᴍᴍᴀɴᴅᴇ.'), { quoted: msg });
        }

        const action = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(action)) {
            return await sendReply(sock, jid, formatError('ᴜᴛɪʟɪsᴀᴛɪᴏɴ : .ᴀɴᴛɪʟɪɴᴋ <ᴏɴ/ᴏғғ>'), { quoted: msg });
        }

       
        const groupConfig = getGroupConfig(jid);
        
        
        groupConfig.antilink.enabled = (action === 'on');
        
        
        saveDB();

        
        const status = action === 'on' ? 'ᴀᴄᴛɪᴠᴇᴇ' : 'ᴅᴇsᴀᴄᴛɪᴠᴇᴇ';
        
        console.log(`🔧 [${phoneNumber}] Antilink ${status} pour le groupe ${jid}`);
        
        await sendReply(
            sock, 
            jid, 
            formatSuccess(`ʟᴀ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ ᴀɴᴛɪ-ʟɪᴇɴ ᴇsᴛ ᴍᴀɪɴᴛᴇɴᴀɴᴛ ${status} !\n\n• ʟᴇs ᴜᴛɪʟɪsᴀᴛᴇᴜʀs sᴇʀᴏɴᴛ ᴇxᴘᴜʟsᴇs ᴀᴘʀᴇs ${groupConfig.antilink.kickThreshold} ᴀᴠᴇʀᴛɪssᴇᴍᴇɴᴛs`),
            { quoted: msg }
        );
    }
};