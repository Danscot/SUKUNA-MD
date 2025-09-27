
const { sendReply, formatSuccess, formatError } = require('../lib/helpers');
const { isAdmin } = require('../lib/isAdmin');

module.exports = {
    name: 'antispam',
    description: 'Activer/désactiver la protection contre le spam',
    usage: 'antispam <on/off> [seuil]',

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
            return await sendReply(sock, jid, formatError('Utilisation : antispam <on/off> [seuil]'), { quoted: msg });
        }

        const groupConfig = getGroupConfig(jid);
        const threshold = parseInt(args[1]) || 3;

        if (threshold < 2 || threshold > 10) {
            return await sendReply(sock, jid, formatError('Le seuil doit être entre 2 et 10.'), { quoted: msg });
        }

        groupConfig.antispam.enabled = (action === 'on');
        groupConfig.antispam.kickThreshold = threshold;
        saveDB();

        const status = action === 'on' ? 'activée' : 'désactivée';
        
        console.log(`🔧 [${phoneNumber}] Antispam ${status} (seuil: ${threshold}) pour le groupe ${jid}`);
        
        await sendReply(
            sock, 
            jid, 
            formatSuccess(`La protection anti-spam est maintenant ${status} !\n\n• Session: ${phoneNumber}\n• Seuil: ${threshold} messages en 2 secondes\n• TOUS les messages après détection seront supprimés\n• Expulsion après ${threshold} avertissements`),
            { quoted: msg }
        );
    }
};