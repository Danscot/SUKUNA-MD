
const { sendReply, formatError } = require('../lib/helpers');
const { downloadContentFromMessage } = require('baileys-x');

module.exports = {
    name: 'vv',
    aliases: ['viewonce', 'revealonce'],
    description: 'Dévoiler les messages à vue unique',
    usage: 'vv (en réponse à un message à vue unique)',
    category: 'tools',
    cooldown: 3,

    async execute({ sock, msg, phoneNumber }) {
        const jid = msg.key.remoteJid;
        
       
        if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            return await sendReply(sock, jid, formatError('Vous devez répondre à un message à vue unique.'), { quoted: msg });
        }

        const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
        
        const quotedImage = quotedMessage.imageMessage;
        const quotedVideo = quotedMessage.videoMessage;

        try {
            
            if (quotedImage && quotedImage.viewOnce) {
                console.log(`🔍 [${phoneNumber}] Dévoilement vue unique: IMAGE`);
                
                
                const stream = await downloadContentFromMessage(quotedImage, 'image');
                let buffer = Buffer.from([]);
                
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                if (buffer.length === 0) {
                    throw new Error('Buffer vide - impossible de télécharger l\'image');
                }

                
                const revealCaption = `*Image à vue unique dévoilée*\n\n` +
                                     
                                     (quotedImage.caption ? `Légende: ${quotedImage.caption}\n` : '')
                                     ;

               
                await sock.sendMessage(jid, {
                    image: buffer,
                    fileName: 'view_once_revealed.jpg',
                    caption: revealCaption
                }, { quoted: msg });

                console.log(`✅ [${phoneNumber}] Image vue unique dévoilée avec succès`);
                return;
            }

            
            if (quotedVideo && quotedVideo.viewOnce) {
                console.log(`🔍 [${phoneNumber}] Dévoilement vue unique: VIDÉO`);
                
                
                const stream = await downloadContentFromMessage(quotedVideo, 'video');
                let buffer = Buffer.from([]);
                
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                if (buffer.length === 0) {
                    throw new Error('Buffer vide - impossible de télécharger la vidéo');
                }

               
                const revealCaption = `*Vidéo à vue unique dévoilée*\n\n` +
                                    
                                     (quotedVideo.caption ? `💬 Légende: ${quotedVideo.caption}\n` : '') 
                                     ;

               
                await sock.sendMessage(jid, {
                    video: buffer,
                    fileName: 'view_once_revealed.mp4',
                    caption: revealCaption
                }, { quoted: msg });

                console.log(`✅ [${phoneNumber}] Vidéo vue unique dévoilée avec succès`);
                return;
            }

            
            await sendReply(sock, jid, formatError('Le message quoté n\'est pas un message à vue unique valide.'), { quoted: msg });

        } catch (error) {
            console.error(`❌ [${phoneNumber}] Erreur dévoilement vue unique:`, error);
            
           
            let errorMessage = 'Une erreur est survenue lors du dévoilement.';
            
            if (error.message.includes('Buffer vide')) {
                errorMessage = 'Impossible de télécharger le média - fichier corrompu ou expiré.';
            } else if (error.message.includes('not found')) {
                errorMessage = 'Le média n\'est plus disponible sur les serveurs WhatsApp.';
            } else if (error.message.includes('download')) {
                errorMessage = 'Échec du téléchargement - le fichier est peut-être trop ancien.';
            } else {
                errorMessage = `Erreur technique: ${error.message}`;
            }
            
            await sendReply(sock, jid, formatError(errorMessage), { quoted: msg });
        }
    }
};