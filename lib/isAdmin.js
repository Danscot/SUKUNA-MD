


const groupMetadataCache = new Map();
const CACHE_DURATION = 60000; 



const getGroupMetadataWithCache = async (sock, chatId) => {
    const now = Date.now();
    const cached = groupMetadataCache.get(chatId);
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.metadata;
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        groupMetadataCache.set(chatId, {
            metadata,
            timestamp: now
        });
        return metadata;
    } catch (error) {
        if (cached) {
            console.log("Erreur lors de la mise à jour du cache, utilisation des données en cache");
            return cached.metadata;
        }
        throw error;
    }
};


const getParticipantInfo = async (sock, chatId, userIdentifier) => {
    const groupMetadata = await getGroupMetadataWithCache(sock, chatId);
    const participants = groupMetadata.participants;
    const participant = participants.find(p =>
        [p.jid, p.lid, p.id].some(id => id === userIdentifier ||
        (typeof userIdentifier === 'string' && id && id.includes(userIdentifier.split('@')[0])))
    );
    return participant || {};
};

/**
 * Vérifie si un utilisateur est un administrateur du groupe.
 * @param {object} sock - L'instance du socket Baileys.
 * @param {string} jid - L'ID du groupe.
 * @param {string} user - L'ID de l'expéditeur (peut être un JID).
 * @returns {Promise<boolean>} - True si l'expéditeur est admin, false sinon.
 */
async function isAdmin(sock, jid, user) {
    try {
        const participantInfo = await getParticipantInfo(sock, jid, user);
        if (participantInfo && (participantInfo.jid || participantInfo.id)) {
            return !!participantInfo.admin;
        }

        const metadata = await getGroupMetadataWithCache(sock, jid);
        const participants = metadata.participants.map(p => ({
            id: p.id,
            lid: p.lid || null,
            admin: p.admin || null,
        }));

        const participant = participants.find(p =>
            p.id === user ||
            p.lid === user ||
            (p.id && p.id.includes(user.split('@')[0])) ||
            (p.lid && p.lid.includes(user.split('@')[0]))
        );

        if (participant) {
            return !!participant.admin;
        }
        return false;
    } catch (error) {
        console.error("Erreur critique dans la fonction isAdmin:", error);
        return false;
    }
}

/**
 * Vérifie si l'expéditeur du message est le propriétaire du bot.
 * @param {object} msg - L'objet message.
 * @param {object} config - L'objet de configuration.
 * @returns {boolean} - True si l'expéditeur est le propriétaire, false sinon.
 */
function isOwner(msg, config) {
    if (msg.key.fromMe) return true;

    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.split('@')[0].split(':')[0];

    if (config && config.owner) {
        const ownerNumber = config.owner.replace(/[^0-9]/g, '');
        return senderNumber === ownerNumber;
    }
    return false;
}

module.exports = {
  isAdmin,
  isOwner
};