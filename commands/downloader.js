
const axios = require('axios');
const yts = require('yt-search');
const { sendReply, formatError, formatSuccess, font } = require('../lib/helpers');


const axiosInstance = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    },
    timeout: 30000, 
    validateStatus: false 
});

async function makeRequest(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await axiosInstance(url, options);
            if (response.status === 200) return response.data;
            throw new Error(`Status ${response.status}`);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); 
        }
    }
}

module.exports = {
    name: 'downloader',
    aliases: [
        'play', 'song',
        'tiktok',
        'facebook', 'fb',
        'instagram', 'igdl',
        'twitter', 'x',
        'capcut',
        'gdrive',
        'github', 'gitclone',
        'mediafire',
        'pinterest', 'pin',
        'soundcloud', 'scdl',
        'spotify',
        'ytmp4',
        'savefrom',
        'applemusic',
        'web2zip'
    ],
    description: 'Télécharge du contenu depuis diverses plateformes.',
    
    async execute({ sock, msg, args, command }) {
    const jid = msg.key.remoteJid;
    const query = args.join(' ').trim();

    if (!query) {
        return await sendReply(sock, jid, formatError("Veuillez fournir un lien ou un titre de recherche."));
    }
    
 
    if (command === 'play' || command === 'song') {
        try {
            await sock.sendMessage(jid, { react: { text: '🎵', key: msg.key } });
            await sendReply(sock, jid, font(`🔍 Recherche en cours pour:\n${query}`));

            const { videos } = await yts(query);
            if (!videos?.length) throw new Error('Aucun résultat trouvé');

            const video = videos[0];
            await sendReply(sock, jid, font(`📥 Téléchargement en cours:\n${video.title}`));

            const response = await makeRequest(`https://apis-keith.vercel.app/download/dlmp3?url=${video.url}`);
            if (!response?.result?.data?.downloadUrl) {
                throw new Error('Erreur lors de l\'extraction audio');
            }

            await sock.sendMessage(jid, {
                audio: { url: response.result.data.downloadUrl },
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: video.title,
                        body: `${video.author.name} • ${video.duration.timestamp}`,
                        thumbnailUrl: video.thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        showAdAttribution: true,
                        sourceUrl: video.url
                    }
                }
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (error) {
            console.error('Erreur play:', error);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sendReply(sock, jid, formatError(error.message));
        }
        return;
    }

    
    try {
        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        switch (command) {
            case 'tiktok': {
                const response = await makeRequest(`https://apis.davidcyriltech.my.id/download/tiktokv3?url=${encodeURIComponent(query)}`);
                if (!response.success || !response.video) throw new Error('Vidéo non trouvée');
                const caption = font(`*sᴜᴋᴜɴᴀ ᴛɪᴋᴛᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n*ᴅᴇsᴄʀɪᴘᴛɪᴏɴ:* ${response.description || ''}`);
                const videoBuffer = await makeRequest(response.video, { responseType: 'arraybuffer' });
                await sock.sendMessage(jid, {
                    video: videoBuffer,
                    caption: caption,
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: response.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }
            case 'facebook': case 'fb': {
                const response = await makeRequest(`https://apis.davidcyriltech.my.id/facebook?url=${encodeURIComponent(query)}`);
                const data = response.result;
                const videoUrl = data.downloads.hd?.url || data.downloads.sd?.url;
                if (!videoUrl) throw new Error('Lien de téléchargement non trouvé');
                const caption = font(`*sᴜᴋᴜɴᴀ ғᴀᴄᴇʙᴏᴏᴋ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n*ᴛɪᴛʀᴇ:* ${data.title || ''}`);
                const videoBuffer = await makeRequest(videoUrl, { responseType: 'arraybuffer' });
                await sock.sendMessage(jid, {
                    video: videoBuffer,
                    caption: caption,
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: data.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }
            case 'instagram': case 'igdl': {
                const response = await makeRequest(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(query)}`);
                if (!response.status || response.data.length === 0) throw new Error('Média non trouvé');
                for (const media of response.data) {
                    const mediaBuffer = await makeRequest(media.url, { responseType: 'arraybuffer' });
                    const isVideo = media.url.includes('.mp4');
                    await sock.sendMessage(jid, {
                        [isVideo ? 'video' : 'image']: mediaBuffer,
                        caption: font(`*sᴜᴋᴜɴᴀ ɪɴsᴛᴀɢʀᴀᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`),
                        contextInfo: {
                            externalAdReply: {
                                title: "SUKUNA - XMD",
                                body: "BY STEPHDEV",
                                thumbnailUrl: media.thumbnail || media.url,
                                mediaType: 1,
                                showAdAttribution: true
                            }
                        }
                    }, { quoted: msg });
                    await new Promise(resolve => setTimeout(resolve, 1000)); 
                }
                break;
            }
            case 'twitter': case 'x': {
                const response = await makeRequest(`https://apis.davidcyriltech.my.id/twitterV2?url=${encodeURIComponent(query)}`);
                const videoUrl = response.result[0]?.url;
                if (!videoUrl) throw new Error('Vidéo non trouvée');
                const caption = font(`*sᴜᴋᴜɴᴀ ᴛᴡɪᴛᴛᴇʀ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`);
                const videoBuffer = await makeRequest(videoUrl, { responseType: 'arraybuffer' });
                await sock.sendMessage(jid, {
                    video: videoBuffer,
                    caption: caption,
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: response.result[0]?.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }
            
            case 'ytmp4': {
                const response = await makeRequest(`https://apis.davidcyriltech.my.id/youtube/mp4?url=${encodeURIComponent(query)}`);
                if (!response.result?.url) throw new Error('Vidéo non trouvée');
                const caption = font(`*sᴜᴋᴜɴᴀ ʏᴏᴜᴛᴜʙᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n*ᴛɪᴛʀᴇ:* ${response.result.title || ''}`);
                const videoBuffer = await makeRequest(response.result.url, { responseType: 'arraybuffer' });
                await sock.sendMessage(jid, {
                    video: videoBuffer,
                    caption: caption,
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: response.result.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }

            case 'spotify': case 'soundcloud': case 'scdl': case 'applemusic': {
                let apiUrl, serviceName;
                
                if (command === 'spotify') {
                    apiUrl = `https://api.siputzx.my.id/api/download/spotify?url=${encodeURIComponent(query)}`;
                    serviceName = 'sᴘᴏᴛɪғʏ';
                } else if (command.startsWith('sound')) {
                    apiUrl = `https://api.siputzx.my.id/api/d/soundcloud?url=${encodeURIComponent(query)}`;
                    serviceName = 'sᴏᴜɴᴅᴄʟᴏᴜᴅ';
                } else {
                    apiUrl = `https://api.siputzx.my.id/api/d/musicapple?url=${encodeURIComponent(query)}`;
                    serviceName = 'ᴀᴘᴘʟᴇ ᴍᴜsɪᴄ';
                }

                const response = await makeRequest(apiUrl);
                const data = response.data || response;
                const audioUrl = data.mp3DownloadLink || data.url || data.download;
                if (!audioUrl) throw new Error('Audio non trouvé');

                const coverUrl = data.coverImage || data.artworkUrl || data.thumbnail;
                const coverBuffer = coverUrl ? await makeRequest(coverUrl, { responseType: 'arraybuffer' }) : null;
                const audioBuffer = await makeRequest(audioUrl, { responseType: 'arraybuffer' });
                
               
                if (coverBuffer) {
                    await sock.sendMessage(jid, {
                        image: coverBuffer,
                        caption: font(`*sᴜᴋᴜɴᴀ ${serviceName} ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Titre:* ${data.songTitle || data.title}\n👤 *Artiste:* ${data.artist || 'Inconnu'}`),
                        contextInfo: {
                            externalAdReply: {
                                title: "SUKUNA - XMD",
                                body: "BY STEPHDEV",
                                thumbnailUrl: coverUrl,
                                mediaType: 1,
                                showAdAttribution: true
                            }
                        }
                    }, { quoted: msg });
                }

                await sock.sendMessage(jid, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    fileName: `${data.songTitle || data.title}.mp3`
                }, { quoted: msg });
                break;
            }

            case 'capcut': {
                const data = await makeRequest(`https://api.siputzx.my.id/api/download/capcut?url=${encodeURIComponent(query)}`);
                if (!data?.status || !data?.result?.video) throw new Error('Template non trouvé');

                await sock.sendMessage(jid, {
                    video: { url: data.result.video },
                    caption: font(`*sᴜᴋᴜɴᴀ ᴄᴀᴘᴄᴜᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Titre:* ${data.result.title || 'N/A'}\n👁️ *Vues:* ${data.result.views || 'N/A'}`),
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: data.result.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }
            
            case 'gdrive': {
                const data = await makeRequest(`https://api.siputzx.my.id/api/download/gdrive?url=${encodeURIComponent(query)}`);
                if (!data?.status || !data?.data?.downloadUrl) throw new Error('Fichier non trouvé');

                const fileInfo = data.data;
                await sock.sendMessage(jid, {
                    document: { url: fileInfo.downloadUrl },
                    fileName: fileInfo.fileName || 'file',
                    mimetype: fileInfo.mimetype || 'application/octet-stream',
                    caption: font(`*sᴜᴋᴜɴᴀ ɢᴅʀɪᴠᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Nom:* ${fileInfo.fileName}\n📦 *Taille:* ${fileInfo.fileSize || 'N/A'}`),
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: "https://drive.google.com/favicon.ico",
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }

            case 'github': case 'gitclone': {
                const data = await makeRequest(`https://api.siputzx.my.id/api/download/gitclone?url=${encodeURIComponent(query)}`);
                if (!data?.status || !data?.result?.repo) throw new Error('Dépôt non trouvé');

                const repoInfo = data.result;
                await sock.sendMessage(jid, {
                    document: { url: repoInfo.zip_url },
                    fileName: `${repoInfo.repo}.zip`,
                    mimetype: 'application/zip',
                    caption: font(`*sᴜᴋᴜɴᴀ ɢɪᴛʜᴜʙ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Repo:* ${repoInfo.repo}\n👤 *Owner:* ${repoInfo.owner}\n⭐ *Stars:* ${repoInfo.stars}\n🔀 *Forks:* ${repoInfo.forks}`),
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: "https://github.com/favicon.ico",
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }

            case 'mediafire': {
                const data = await makeRequest(`https://api.siputzx.my.id/api/download/mediafire?url=${encodeURIComponent(query)}`);
                if (!data?.status || !data?.result?.link) throw new Error('Fichier non trouvé');

                const fileInfo = data.result;
                await sock.sendMessage(jid, {
                    document: { url: fileInfo.link },
                    fileName: fileInfo.title || 'file',
                    mimetype: fileInfo.filetype || 'application/octet-stream',
                    caption: font(`*sᴜᴋᴜɴᴀ ᴍᴇᴅɪᴀғɪʀᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Nom:* ${fileInfo.title}\n📦 *Taille:* ${fileInfo.size}\n📅 *Upload:* ${fileInfo.uploaded}`),
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: "https://www.mediafire.com/favicon.ico",
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }

            case 'pinterest': case 'pin': {
                const data = await makeRequest(`https://api.siputzx.my.id/api/download/pinterest?url=${encodeURIComponent(query)}`);
                if (!data?.status || !data?.result) throw new Error('Image non trouvée');

                const isVideo = data.result.includes('.mp4');
                await sock.sendMessage(jid, {
                    [isVideo ? 'video' : 'image']: { url: data.result },
                    caption: font(`*sᴜᴋᴜɴᴀ ᴘɪɴᴛᴇʀᴇsᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`),
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: data.result,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }

            case 'savefrom': {
                const data = await makeRequest(`https://api.siputzx.my.id/api/download/savefrom?url=${encodeURIComponent(query)}`);
                if (!data?.status || !data?.result?.[0]?.url) throw new Error('Contenu non trouvé');

                const mediaInfo = data.result[0];
                const isVideo = mediaInfo.ext === 'mp4';
                
                await sock.sendMessage(jid, {
                    [isVideo ? 'video' : 'audio']: { url: mediaInfo.url },
                    mimetype: isVideo ? 'video/mp4' : 'audio/mpeg',
                    caption: font(`*sᴜᴋᴜɴᴀ sᴀᴠᴇғʀᴏᴍ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Qualité:* ${mediaInfo.quality || 'N/A'}\n📦 *Type:* ${mediaInfo.ext || 'N/A'}`),
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: mediaInfo.thumb || "https://en.savefrom.net/favicon.ico",
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }

            case 'web2zip': {
                const data = await makeRequest(`https://api.siputzx.my.id/api/download/web2zip?url=${encodeURIComponent(query)}`);
                if (!data?.status || !data?.result?.url) throw new Error('Impossible de télécharger le site');

                await sock.sendMessage(jid, {
                    document: { url: data.result.url },
                    fileName: `${new URL(query).hostname}.zip`,
                    mimetype: 'application/zip',
                    caption: font(`*sᴜᴋᴜɴᴀ ᴡᴇʙ2ᴢɪᴘ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Site:* ${query}`),
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: "https://www.google.com/s2/favicons?domain=" + query,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }
            
            case 'ytmp4': {
                const data = await makeRequest(`https://apis.davidcyriltech.my.id/youtube/mp4?url=${encodeURIComponent(query)}`);
                if (!data?.result?.url) throw new Error('Vidéo non trouvée');

                await sock.sendMessage(jid, {
                    video: { url: data.result.url },
                    caption: font(`*sᴜᴋᴜɴᴀ ʏᴏᴜᴛᴜʙᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n${data.result.title || ''}`),
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: data.result.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }
            case 'spotify': case 'soundcloud': case 'scdl': case 'applemusic': {
                let apiUrl;
                let serviceName;
                
                if (command === 'spotify') {
                    apiUrl = `https://api.siputzx.my.id/api/download/spotify?url=${encodeURIComponent(query)}`;
                    serviceName = 'sᴘᴏᴛɪғʏ';
                } else if (command.startsWith('sound')) {
                    apiUrl = `https://api.siputzx.my.id/api/d/soundcloud?url=${encodeURIComponent(query)}`;
                    serviceName = 'sᴏᴜɴᴅᴄʟᴏᴜᴅ';
                } else {
                    apiUrl = `https://api.siputzx.my.id/api/d/musicapple?url=${encodeURIComponent(query)}`;
                    serviceName = 'ᴀᴘᴘʟᴇ ᴍᴜsɪᴄ';
                }

                const data = await makeRequest(apiUrl);
                const finalData = data.data || data;
                const audioUrl = finalData.mp3DownloadLink || finalData.url || finalData.download;
                if (!audioUrl) throw new Error('Audio non trouvé');

                
                await sock.sendMessage(jid, {
                    image: { url: finalData.coverImage || finalData.artworkUrl || finalData.thumbnail },
                    caption: font(`*sᴜᴋᴜɴᴀ ${serviceName} ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📌 *Titre:* ${finalData.songTitle || finalData.title}\n👤 *Artiste:* ${finalData.artist || 'Inconnu'}`),
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: finalData.coverImage || finalData.artworkUrl || finalData.thumbnail,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });

                
                await sock.sendMessage(jid, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${finalData.songTitle || finalData.title}.mp3`
                }, { quoted: msg });
                break;
            }
            case 'pinterest': case 'pin': {
                const response = await makeRequest(`https://api.siputzx.my.id/api/d/pinterest?url=${encodeURIComponent(query)}`);
                const media = response.data?.media_urls?.[0];
                if (!media?.url) throw new Error('Média Pinterest non trouvé');

                const mediaBuffer = await makeRequest(media.url, { responseType: 'arraybuffer' });
                const isVideo = media.type === 'video';
                const caption = font(`*sᴜᴋᴜɴᴀ ᴘɪɴᴛᴇʀᴇsᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*`);

                await sock.sendMessage(jid, {
                    [isVideo ? 'video' : 'image']: mediaBuffer,
                    caption: caption,
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: media.url,
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }
            
            case 'mediafire': case 'gdrive': {
                const apiPath = command === 'mediafire' ? 'd/mediafire' : 'gdrive';
                const response = await makeRequest(`https://apis.davidcyriltech.my.id/${apiPath}?url=${encodeURIComponent(query)}`);
                const data = response.result || response;
                const caption = font(`*sᴜᴋᴜɴᴀ ${command === 'mediafire' ? 'ᴍᴇᴅɪᴀғɪʀᴇ' : 'ɢᴅʀɪᴠᴇ'} ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n📝 *Nom:* ${data.name || data.fileName}\n📦 *Taille:* ${data.size || data.fileSize}\n🔗 *Lien:* ${data.download_link || data.downloadLink}`);

                await sock.sendMessage(jid, {
                    text: caption,
                    contextInfo: {
                        externalAdReply: {
                            title: "SUKUNA - XMD",
                            body: "BY STEPHDEV",
                            thumbnailUrl: command === 'mediafire' ? "https://www.mediafire.com/favicon.ico" : "https://drive.google.com/favicon.ico",
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                }, { quoted: msg });
                break;
            }
            case 'github': case 'gitclone': {
                 response = await axiosInstance.get(`https://api.siputzx.my.id/api/d/github?url=${encodeURIComponent(query)}`);
                 const data = response.data;
                 let resultText = `${header}\n*Dépôt GitHub*\n\n*Propriétaire:* ${data.owner}\n*Description:* ${data.description}\n`;
                 data.files.forEach(file => {
                     resultText += `\n- *Fichier:* ${file.name}\n  *Lien:* ${file.raw_url}\n`;
                 });
                 await sock.sendMessage(jid, { text: font(resultText) + footer });
                 break;
            }
            case 'capcut': {
                 response = await axiosInstance.get(`https://api.siputzx.my.id/api/d/capcutv2?url=${encodeURIComponent(query)}`);
                 const data = response.data.data;
                 if (!response.data.status || !data.medias) throw new Error('Vidéo non trouvée.');
                 const videoUrl = data.medias.find(v => v.quality.includes('No Watermark'))?.url || data.medias[0].url;
                 caption += `*Titre:* ${data.title}`;
                 const videoBuffer = await axiosInstance.get(videoUrl, { responseType: 'arraybuffer' });
                 await sock.sendMessage(jid, { video: videoBuffer.data, caption: caption + footer }, { quoted: m });
                 break;
            }
            case 'web2zip': {
                response = await axiosInstance.get(`https://apis.davidcyriltech.my.id/tools/downloadweb?url=${encodeURIComponent(query)}`);
                const data = response.data.response;
                if (!data.success || !data.downloadUrl) throw new Error('Impossible de zipper le site web.');
                const resultText = `${header}\n*Site web zippé!*\n\n*Lien de téléchargement:* ${data.downloadUrl}${footer}`;
                await sock.sendMessage(jid, { text: font(resultText) });
                break;
            }
            case 'savefrom': {
                response = await axiosInstance.get(`https://api.siputzx.my.id/api/d/savefrom?url=${encodeURIComponent(query)}&type=video`);
                const data = response.data.data;
                if (!response.data.status || data.length === 0) throw new Error('Média non trouvé.');
                const mediaUrl = data[0].url;
                caption += `*Titre:* ${data[0].title}`;
                const mediaBuffer = await axiosInstance.get(mediaUrl, { responseType: 'arraybuffer' });
                await sock.sendMessage(jid, { video: mediaBuffer.data, caption: caption + footer }, { quoted: m });
                break;
            }
            case 'ytpost': {
                response = await axiosInstance.get(`https://api.siputzx.my.id/api/d/ytpost?url=${encodeURIComponent(query)}`);
                const data = response.data?.data;
                if (!data || !data.images || data.images.length === 0) throw new Error('Aucune image trouvée.');
                const imageBuffer = await axiosInstance.get(data.images[0], { responseType: 'arraybuffer' });
                await sock.sendMessage(jid, { image: imageBuffer.data, caption: `${caption}\n\n${data.content}` + footer }, { quoted: msg });
                break;
            }
        }

        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });

    } catch (error) {
        console.error(`Erreur dans la commande '${command}':`, error);
        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
        await sendReply(sock, jid, formatError(error.message));
    }
  }
};
