const { sendReply, font } = require('../lib/helpers');

module.exports = {
    name: 'alive',
    description: 'Statut du bot',
    async execute({ sock, msg }) {
        const jid = msg.key.remoteJid;
        const uptime = process.uptime();
        const hrs = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        const statusText = `sukuna en ʟɪɢɴᴇ ᴅᴇᴘᴜɪꜱ ${hrs}ʜ${mins}ᴍ`;
        await sendReply(sock, jid, statusText, { quoted: msg });
    }
};