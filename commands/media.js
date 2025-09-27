
const fs = require('fs').promises;
const { createReadStream } = require('fs');
const path = require('path');
const { sendReply, formatError, formatSuccess, font } = require('../lib/helpers');
const { downloadContentFromMessage } = require('baileys-x');


const MEDIA_BASE_DIR = './user_media';


async function ensureUserMediaDir(userId) {
    const userDir = path.join(MEDIA_BASE_DIR, userId, 'media');
    await fs.mkdir(userDir, { recursive: true });
    return userDir;
}

module.exports = {
    name: 'media',
    aliases: ['store', 'vd', 'ad', 'list', 'del'],
    description: 'Gère votre collection de médias personnels',
    
    async execute({ sock, msg, args, command, isOwner }) {
        const jid = msg.key.remoteJid;
        const userId = msg.key.participant || msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        try {
            
            const userDir = await ensureUserMediaDir(userId);

            switch(command) {
                case 'store': {
                    if (!isOwner) {
                        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key }});
                        return;
                    }

                    if (!quoted || (!quoted.audioMessage && !quoted.videoMessage)) {
                        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key }});
                        return;
                    }

                    const name = args[0];
                    if (!name) {
                        await sendReply(sock, jid, formatError("Veuillez donner un nom pour le stockage"));
                        return;
                    }

                    const mediaType = quoted.videoMessage ? 'video' : 'audio';
                    const extension = mediaType === 'video' ? '.mp4' : '.mp3';
                    const fileName = name.toLowerCase() + extension;
                    const mediaPath = path.join(userDir, fileName);

                   
                    try {
                        await fs.access(mediaPath);
                        await sock.sendMessage(jid, { react: { text: '⚠️', key: msg.key }});
                        return;
                    } catch {
                        
                    }

                 
                    await sock.sendMessage(jid, { react: { text: '📥', key: msg.key }});
                    const mediaMessage = quoted.videoMessage || quoted.audioMessage;
                    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    await fs.writeFile(mediaPath, buffer);
                    await sock.sendMessage(jid, { react: { text: '✅', key: msg.key }});
                    break;
                }

                case 'vd': {
                    const isCircular = args.includes('-c');
                    const name = args.filter(arg => arg !== '-c')[0];

                    if (!name) {
                        await sendReply(sock, jid, formatError("📝 Veuillez spécifier le nom de la vidéo"));
                        return;
                    }

                    const mediaPath = path.join(userDir, name.toLowerCase() + '.mp4');
                    try {
                        await fs.access(mediaPath);
                    } catch {
                        await sendReply(sock, jid, formatError(`🚫 Aucune vidéo nommée '${name}' trouvée`));
                        return;
                    }

                    await sock.sendMessage(jid, { react: { text: '🎬', key: msg.key }});
                    const videoBuffer = await fs.readFile(mediaPath);
                    await sock.sendMessage(jid, {
                        video: videoBuffer,
                        caption: font(`*sᴜᴋᴜɴᴀ ᴠɪᴅᴇᴏ ᴘʟᴀʏᴇʀ*\n\n📌 *Nom:* ${name}`),
                        ptv: isCircular
                        
                    }, { quoted: msg });
                    break;
                }

                case 'ad': {
                    const name = args[0];
                    if (!name) {
                        await sendReply(sock, jid, formatError("📝 Veuillez spécifier le nom de l'audio"));
                        return;
                    }

                    const mediaPath = path.join(userDir, name.toLowerCase() + '.mp3');
                    try {
                        await fs.access(mediaPath);
                    } catch {
                        await sendReply(sock, jid, formatError(`🚫 Aucun audio nommé '${name}' trouvé`));
                        return;
                    }

                    await sock.sendMessage(jid, { react: { text: '🎵', key: msg.key }});
                    const audioBuffer = await fs.readFile(mediaPath);
                    await sock.sendMessage(jid, {
                        audio: audioBuffer,
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        
                    }, { quoted: msg });
                    break;
                }

                case 'list': {
                    let files = [];
                    try {
                        files = await fs.readdir(userDir);
                    } catch {
                        
                    }

                    const audios = files.filter(f => f.endsWith('.mp3')).map(f => `• ${f.replace('.mp3', '')}`);
                    const videos = files.filter(f => f.endsWith('.mp4')).map(f => `• ${f.replace('.mp4', '')}`);

                    let listText = font(`*sᴜᴋᴜɴᴀ ᴍᴇᴅɪᴀ ᴄᴏʟʟᴇᴄᴛɪᴏɴ*\n\n`);
                    
                    if (videos.length > 0) {
                        listText += `*🎬 ᴠɪᴅᴇᴏs (${videos.length})*\n${videos.join('\n')}\n\n`;
                    }
                    
                    if (audios.length > 0) {
                        listText += `*🎵 ᴀᴜᴅɪᴏs (${audios.length})*\n${audios.join('\n')}\n\n`;
                    }
                    
                    if (audios.length === 0 && videos.length === 0) {
                        listText += `*📭 ᴄᴏʟʟᴇᴄᴛɪᴏɴ ᴠɪᴅᴇ*\n\n`;
                    }

                    listText += `*ᴄᴏᴍᴍᴀɴᴅᴇs:*\n`;
                    listText += `• .ᴠᴅ <ɴᴏᴍ> [-ᴄ ᴘᴏᴜʀ ᴄɪʀᴄᴜʟᴀɪʀᴇ]\n`;
                    listText += `• .ᴀᴅ <ɴᴏᴍ>\n`;
                    listText += `• .ᴅᴇʟ <ᴛʏᴘᴇ> <ɴᴏᴍ>`;

                    await sock.sendMessage(jid, {
                        text: listText,
                        
                    }, { quoted: msg });
                    break;
                }

                case 'del': {
                    if (!isOwner) {
                        await sendReply(sock, jid, formatError("🔒 Seul le propriétaire peut supprimer des médias"));
                        return;
                    }

                    const type = args[0]?.toLowerCase();
                    const name = args[1];

                    if (!type || !name || !['audio', 'video'].includes(type)) {
                        await sendReply(sock, jid, formatError("📝 Usage: .del <audio|video> <nom>"));
                        return;
                    }

                    const extension = type === 'video' ? '.mp4' : '.mp3';
                    const mediaPath = path.join(userDir, name.toLowerCase() + extension);

                    try {
                        await fs.access(mediaPath);
                        await fs.unlink(mediaPath);
                        await sendReply(sock, jid, formatSuccess(`✅ Media '${name}' supprimé avec succès`));
                    } catch {
                        await sendReply(sock, jid, formatError(`🚫 Media '${name}' non trouvé`));
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Erreur media:', error);
            await sendReply(sock, jid, formatError("Une erreur est survenue"));
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key }});
        }
    }
};