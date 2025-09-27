module.exports = {
    name: 'antidelete',
    aliases: ['ad', 'antisupp'],
    description: 'Active/désactive le système antidelete pour récupérer les messages supprimés',
    usage: '<on|off|status>',
    category: 'admin',
    cooldown: 3,
    
    async execute({ sock, msg, args, phoneNumber, db, saveDB, isOwner, config }) {
        const jid = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        
        
        if (!isOwner(msg, config.globalConfig || {})) {
            return sock.sendMessage(jid, { 
                text: `❌ *Accès refusé*\n\nSeul le propriétaire peut gérer l'antidelete.`,
                quoted: msg 
            });
        }

        const action = args[0]?.toLowerCase();
        
        if (!action || !['on', 'off', 'status', 'enable', 'disable'].includes(action)) {
            return sock.sendMessage(jid, { 
                text: `❓ *Utilisation incorrecte*\n\n*Usage:* \`${config.prefix}antidelete <on|off|status>\`\n\n*Exemples:*\n• \`${config.prefix}antidelete on\` - Activer\n• \`${config.prefix}antidelete off\` - Désactiver\n• \`${config.prefix}antidelete status\` - Voir le statut`,
                quoted: msg 
            });
        }

  
        if (!db.settings) db.settings = {};
        if (!db.settings.antidelete) db.settings.antidelete = { enabled: false };

        const currentStatus = db.settings.antidelete.enabled;

        if (action === 'status') {
            const statusIcon = currentStatus ? '✅' : '❌';
            const statusText = currentStatus ? 'ACTIVÉ' : 'DÉSACTIVÉ';
            
            return sock.sendMessage(jid, { 
                text: `📊 *STATUT ANTIDELETE*\n\n${statusIcon} *Statut:* ${statusText}\n📱 *Session:* ${phoneNumber}\n\n${currentStatus ? '🛡️ Les messages supprimés sont surveillés et sauvegardés.' : '⚠️ Les messages supprimés ne sont pas surveillés.'}`,
                quoted: msg 
            });
        }

        const shouldEnable = ['on', 'enable'].includes(action);
        
        if (currentStatus === shouldEnable) {
            const alreadyText = shouldEnable ? 'déjà activé' : 'déjà désactivé';
            return sock.sendMessage(jid, { 
                text: `ℹ️ *Antidelete ${alreadyText}*\n\nLe système antidelete est ${alreadyText} pour cette session.`,
                quoted: msg 
            });
        }

        
        db.settings.antidelete.enabled = shouldEnable;
        saveDB();

        const actionText = shouldEnable ? 'activé' : 'désactivé';
        const actionIcon = shouldEnable ? '✅' : '❌';
        const descriptionText = shouldEnable ? 
            '🛡️ Les messages supprimés seront désormais surveillés et sauvegardés.\n\n📝 *Fonctionnalités:*\n• Capture automatique des messages\n• Récupération des médias supprimés\n• Anti-ViewOnce intégré\n• Stockage local temporaire' :
            '⚠️ Les messages supprimés ne seront plus surveillés.';

        await sock.sendMessage(jid, { 
            text: `${actionIcon} *Antidelete ${actionText}*\n\n${descriptionText}\n\n📱 *Session:* ${phoneNumber}`,
            quoted: msg 
        });

        console.log(`🔧 [${phoneNumber}] Antidelete ${actionText} par ${sender.split('@')[0]}`);
    }
};