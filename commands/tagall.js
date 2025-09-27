const { sendReply } = require('../lib/helpers');

module.exports = {
    name: 'tagall',
    description: 'Mentionne tous les membres',
    async execute({ sock, msg }) {
        const jid = msg.key.remoteJid;
        const metadata = await sock.groupMetadata(jid);
        const mentions = metadata.participants.map(p => p.id);
        await sendReply(sock, jid, 'ᴀᴛᴛᴇɴᴛɪᴏɴ ᴀ ᴛᴏᴜꜱ!', { mentions, quoted: msg });
    }
};