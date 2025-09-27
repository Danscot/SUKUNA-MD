const { sendReply } = require('../lib/helpers');

module.exports = {
    name: 'tag',
    description: 'Mention cachée',
    async execute({ sock, msg }) {
        const jid = msg.key.remoteJid;
        const metadata = await sock.groupMetadata(jid);
        const mentions = metadata.participants.map(p => p.id);
        await sendReply(sock, jid, '', { mentions, quoted: msg });
    }
};