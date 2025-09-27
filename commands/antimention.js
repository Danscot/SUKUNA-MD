
const { sendReply, formatSuccess, formatError } = require('../lib/helpers');
const { isAdmin } = require('../lib/isAdmin');

module.exports = {
    name: 'antimention',
    description: 'Activer/désactiver la protection contre les mentions du groupe',
    usage: 'antimention <on/off>',

    async execute({ sock, msg, args, getGroupConfig, saveDB, phoneNumber }) {
        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return await sendReply(sock, jid, formatError('Cette commande ne peut être utilisée qu\'en groupe.'), { quoted: msg });
        }

        const isUserAdmin = await isAdmin(sock, jid, sender);
        if (!isUserAdmin) {
            return await sendReply(sock, jid, formatError('Vous devez être admin pour utiliser cette commande.'), { quoted: msg });
        }

        const action = args[0]?.toLowerCase();
        if (!['on', 'off'].includes(action)) {
            return await sendReply(sock, jid, formatError('Utilisation : antimention <on/off>'), { quoted: msg });
        }

        const groupConfig = getGroupConfig(jid);
        groupConfig.antimention.enabled = (action === 'on');
        saveDB();

        const status = action === 'on' ? 'activée' : 'désactivée';
        
        console.log(`🔧 [${phoneNumber}] Antimention ${status} pour le groupe ${jid}`);
        
        await sendReply(
            sock, 
            jid, 
            formatSuccess(`La protection anti-mention est maintenant ${status} !\n\n• Session: ${phoneNumber}\n• Bloque toute mention du groupe (messages + status)\n• Les messages avec mention seront supprimés`),
            { quoted: msg }
        );
    }
};