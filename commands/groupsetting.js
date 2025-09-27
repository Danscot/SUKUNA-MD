
const { sendReply, formatSuccess, formatError } = require('../lib/helpers');
const { isAdmin } = require('../lib/isAdmin');

module.exports = {
    name: 'groupsettings',
    aliases: ['gsettings', 'config'],
    description: 'Voir et gérer tous les paramètres du groupe',
    usage: 'groupsettings [reset]',

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

        const groupConfig = getGroupConfig(jid);
        
        if (args[0] === 'reset') {
          
            groupConfig.antilink = { enabled: false, kickThreshold: 3 };
            groupConfig.antispam = { enabled: false, kickThreshold: 3 };
            groupConfig.antimention = { enabled: false };
            groupConfig.antitag = { enabled: false };
            groupConfig.welcome = { enabled: false, text: '' };
            groupConfig.goodbye = { enabled: false, text: '' };
            saveDB();
            
            console.log(`🔧 [${phoneNumber}] Configuration reset pour le groupe ${jid}`);
            
            return await sendReply(
                sock, 
                jid, 
                formatSuccess(`Configuration du groupe réinitialisée !\n\n• Session: ${phoneNumber}\n• Toutes les protections sont désactivées`),
                { quoted: msg }
            );
        }

        const status = (enabled) => enabled ? '✅ Activé' : '❌ Désactivé';
        
        const configText = `📊 **Configuration du groupe**\n\n` +
            `🔗 **Antilink:** ${status(groupConfig.antilink?.enabled)}\n` +
            `   └ Seuil: ${groupConfig.antilink?.kickThreshold || 3} avertissements\n\n` +
            `🚫 **Antispam:** ${status(groupConfig.antispam?.enabled)}\n` +
            `   └ Seuil: ${groupConfig.antispam?.kickThreshold || 3} avertissements\n\n` +
            `@️⃣ **Antimention:** ${status(groupConfig.antimention?.enabled)}\n\n` +
            `🏷️ **Antitag:** ${status(groupConfig.antitag?.enabled)}\n\n` +
            `👋 **Bienvenue:** ${status(groupConfig.welcome?.enabled)}\n\n` +
            `🚪 **Au revoir:** ${status(groupConfig.goodbye?.enabled)}\n\n` +
            `🔧 **Session:** ${phoneNumber}\n\n` +
            `💡 Utilisez \`groupsettings reset\` pour tout réinitialiser`;

        await sendReply(sock, jid, configText, { quoted: msg });
    }
};
