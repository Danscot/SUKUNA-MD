const { sendReply } = require('../lib/helpers');

module.exports = {
    name: 'ping',
    description: 'Répond pong et latence',
    
    async execute({ sock, msg }) {
        const jid = msg.key.remoteJid;
        const t0 = Date.now();
         await sock.sendMessage(jid, { react: { text: '🀄', key: msg.key } });
        const t1 = Date.now() - t0;
        await sendReply(sock, jid, `sukuna speed : ${t1} ᴍꜱ`, { quoted: msg });
    }
};