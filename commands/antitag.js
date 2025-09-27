
const { sendReply, formatSuccess, formatError } = require('../lib/helpers');
const { isAdmin } = require('../lib/isAdmin');

module.exports = {
    name: 'antitag',
    description: 'Activer/désactiver la protection contre les tags en masse',
    usage: 'antitag <on/off>',

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
            return await sendReply(sock, jid, formatError('Utilisation : antitag <on/off>'), { quoted: msg });
        }

        const groupConfig = getGroupConfig(jid);
        groupConfig.antitag.enabled = (action === 'on');
        saveDB();

        const status = action === 'on' ? 'activée' : 'désactivée';
        
        console.log(`🔧 [${phoneNumber}] Antitag ${status} pour le groupe ${jid}`);
        
        await sendReply(
            sock, 
            jid, 
            formatSuccess(`La protection anti-tag est maintenant ${status} !\n\n• Session: ${phoneNumber}\n• Bloque @all, @everyone et tagall des bots\n• Détecte les tags multiples (3+ personnes)\n• Messages supprimés automatiquement`),
            { quoted: msg }
        );
    }
};
