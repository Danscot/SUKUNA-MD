
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    Browsers
} = require('baileys-x');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const config = require('./config.json');
const userConfigManager = require('./userConfigManager');
const { sendReply, formatError, formatSuccess, font } = require('./lib/helpers');
const { isAdmin, isOwner } = require('./lib/isAdmin');
const modeCommand = require('./commands/mode');
const { downloadContentFromMessage } = require('baileys-x');
const { writeFile } = require('fs/promises');

class WhatsAppManager {
    constructor() {
        this.sessions = new Map();
        this.sessionDatabases = new Map();
        this.messageStores = new Map(); 
        this.loadCommands();
        this.setupSessionsDirectory();
        this.setupTempDirectories();
    }


    setupSessionsDirectory() {
        const sessionsDir = './whatsapp_sessions';
        if (!fs.existsSync(sessionsDir)) {
            fs.mkdirSync(sessionsDir, { recursive: true });
            console.log('📁 Dossier sessions WhatsApp créé');
        }
    }

    setupTempDirectories() {
        const tempDir = './tmp';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            console.log('📁 Dossier tmp créé');
        }

       
        setInterval(() => {
            this.cleanTempFolder();
        }, 5 * 60 * 1000); 
    }

    cleanTempFolder() {
        try {
            const tempDir = './tmp';
            const files = fs.readdirSync(tempDir);
            
            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = fs.statSync(filePath);
                
               
                if (Date.now() - stats.mtime.getTime() > 10 * 60 * 1000) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (error) {
            console.error('❌ Erreur nettoyage tmp:', error.message);
        }
    }

    getMessageStore(phoneNumber) {
        if (!this.messageStores.has(phoneNumber)) {
            this.messageStores.set(phoneNumber, new Map());
        }
        return this.messageStores.get(phoneNumber);
    }


    async streamToBuffer(stream) {
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    }

    async storeMessage(msg, sock, phoneNumber) {
        try {
            const sessionDB = this.getSessionDB(phoneNumber);
            const antideleteEnabled = sessionDB.settings?.antidelete?.enabled;
            
            if (!antideleteEnabled || !msg.key?.id) return;

            const messageId = msg.key.id;
            const sender = msg.key.participant || msg.key.remoteJid;
            const messageStore = this.getMessageStore(phoneNumber);
            
            let content = '';
            let mediaType = '';
            let mediaPath = '';
            let isViewOnce = false;

            
            const viewOnceContainer = msg.message?.viewOnceMessageV2?.message || 
                                    msg.message?.viewOnceMessage?.message;

            if (viewOnceContainer) {
               
                if (viewOnceContainer.imageMessage) {
                    mediaType = 'image';
                    content = viewOnceContainer.imageMessage.caption || '';
                    try {
                        const stream = await downloadContentFromMessage(viewOnceContainer.imageMessage, 'image');
                        const buffer = await this.streamToBuffer(stream);
                        mediaPath = path.join('./tmp', `${messageId}_${phoneNumber}.jpg`);
                        await writeFile(mediaPath, buffer);
                        isViewOnce = true;
                    } catch (err) {
                        console.error(`❌ [${phoneNumber}] Erreur download image view-once:`, err.message);
                    }
                } else if (viewOnceContainer.videoMessage) {
                    mediaType = 'video';
                    content = viewOnceContainer.videoMessage.caption || '';
                    try {
                        const stream = await downloadContentFromMessage(viewOnceContainer.videoMessage, 'video');
                        const buffer = await this.streamToBuffer(stream);
                        mediaPath = path.join('./tmp', `${messageId}_${phoneNumber}.mp4`);
                        await writeFile(mediaPath, buffer);
                        isViewOnce = true;
                    } catch (err) {
                        console.error(`❌ [${phoneNumber}] Erreur download video view-once:`, err.message);
                    }
                }
            } 
            
            else if (msg.message?.conversation) {
                content = msg.message.conversation;
            } else if (msg.message?.extendedTextMessage?.text) {
                content = msg.message.extendedTextMessage.text;
            } else if (msg.message?.imageMessage) {
                mediaType = 'image';
                content = msg.message.imageMessage.caption || '';
                try {
                    const stream = await downloadContentFromMessage(msg.message.imageMessage, 'image');
                    const buffer = await this.streamToBuffer(stream);
                    mediaPath = path.join('./tmp', `${messageId}_${phoneNumber}.jpg`);
                    await writeFile(mediaPath, buffer);
                } catch (err) {
                    console.error(`❌ [${phoneNumber}] Erreur download image:`, err.message);
                }
            } else if (msg.message?.videoMessage) {
                mediaType = 'video';
                content = msg.message.videoMessage.caption || '';
                try {
                    const stream = await downloadContentFromMessage(msg.message.videoMessage, 'video');
                    const buffer = await this.streamToBuffer(stream);
                    mediaPath = path.join('./tmp', `${messageId}_${phoneNumber}.mp4`);
                    await writeFile(mediaPath, buffer);
                } catch (err) {
                    console.error(`❌ [${phoneNumber}] Erreur download video:`, err.message);
                }
            } else if (msg.message?.stickerMessage) {
                mediaType = 'sticker';
                try {
                    const stream = await downloadContentFromMessage(msg.message.stickerMessage, 'sticker');
                    const buffer = await this.streamToBuffer(stream);
                    mediaPath = path.join('./tmp', `${messageId}_${phoneNumber}.webp`);
                    await writeFile(mediaPath, buffer);
                } catch (err) {
                    console.error(`❌ [${phoneNumber}] Erreur download sticker:`, err.message);
                }
            } else if (msg.message?.audioMessage) {
                mediaType = 'audio';
                try {
                    const mime = msg.message.audioMessage.mimetype || '';
                    const ext = mime.includes('mpeg') ? 'mp3' : (mime.includes('ogg') ? 'ogg' : 'mp3');
                    const stream = await downloadContentFromMessage(msg.message.audioMessage, 'audio');
                    const buffer = await this.streamToBuffer(stream);
                    mediaPath = path.join('./tmp', `${messageId}_${phoneNumber}.${ext}`);
                    await writeFile(mediaPath, buffer);
                } catch (err) {
                    console.error(`❌ [${phoneNumber}] Erreur download audio:`, err.message);
                }
            }

            
            messageStore.set(messageId, {
                content,
                mediaType,
                mediaPath,
                sender,
                group: msg.key.remoteJid.endsWith('@g.us') ? msg.key.remoteJid : null,
                timestamp: new Date().toISOString(),
                isViewOnce
            });

           
            if (messageStore.size > 500) {
                const oldestKey = messageStore.keys().next().value;
                const oldMessage = messageStore.get(oldestKey);
                if (oldMessage.mediaPath && fs.existsSync(oldMessage.mediaPath)) {
                    try {
                        fs.unlinkSync(oldMessage.mediaPath);
                    } catch (err) {
                        console.error('❌ Erreur suppression ancien média:', err.message);
                    }
                }
                messageStore.delete(oldestKey);
            }

          
            if (isViewOnce && mediaType && fs.existsSync(mediaPath)) {
                try {
                    const botJid = sock.user.id;
                    const senderName = sender.split('@')[0];
                    const mediaOptions = {
                        caption: `🔍 *Anti-ViewOnce ${mediaType}*\nExpéditeur: @${senderName}\nSession: ${phoneNumber}`,
                        mentions: [sender]
                    };

                    if (mediaType === 'image') {
                        await sock.sendMessage(botJid, { image: { url: mediaPath }, ...mediaOptions });
                    } else if (mediaType === 'video') {
                        await sock.sendMessage(botJid, { video: { url: mediaPath }, ...mediaOptions });
                    }

                    console.log(`🔍 [${phoneNumber}] View-once ${mediaType} transféré au propriétaire`);
                } catch (err) {
                    console.error(`❌ [${phoneNumber}] Erreur transfert view-once:`, err.message);
                }
            }

           
        } catch (error) {
            console.error(`❌ [${phoneNumber}] Erreur stockage message:`, error.message);
        }
    }

    async handleMessageRevocation(revocationMsg, sock, phoneNumber) {
        try {
            const sessionDB = this.getSessionDB(phoneNumber);
            const antideleteEnabled = sessionDB.settings?.antidelete?.enabled;
            
            if (!antideleteEnabled) return;

            
            const messageId = revocationMsg.message?.protocolMessage?.key?.id;
            if (!messageId) return;

            const messageStore = this.getMessageStore(phoneNumber);
            const originalMessage = messageStore.get(messageId);
            
            if (!originalMessage) {
                console.log(`ℹ️ [${phoneNumber}] Message supprimé non trouvé dans le store: ${messageId}`);
                return;
            }

            const deletedBy = revocationMsg.key.participant || revocationMsg.key.remoteJid;
            const botJid = sock.user.id;
            
            
            if (deletedBy.includes(sock.user.id.split('@')[0])) return;

            const sender = originalMessage.sender;
            const senderName = sender.split('@')[0];
            const deletedByName = deletedBy.split('@')[0];
            
            let groupName = '';
            if (originalMessage.group) {
                try {
                    const metadata = await sock.groupMetadata(originalMessage.group);
                    groupName = metadata?.subject || 'Groupe inconnu';
                } catch (err) {
                    groupName = 'Groupe inconnu';
                }
            }

            const time = new Date().toLocaleString('fr-FR', {
                timeZone: 'Africa/Douala',
                hour12: false,
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            let notificationText = `🗑️ **MESSAGE SUPPRIMÉ DÉTECTÉ**\n\n` +
                `🚫 **Supprimé par:** @${deletedByName}\n` +
                `👤 **Expéditeur:** @${senderName}\n` +
                `📱 **Numéro:** ${sender}\n` +
                `🕒 **Heure:** ${time}\n` +
                `📱 **Session:** ${phoneNumber}\n`;

            if (groupName) {
                notificationText += `👥 **Groupe:** ${groupName}\n`;
            }

            if (originalMessage.content) {
                notificationText += `\n💬 **Message supprimé:**\n${originalMessage.content}`;
            }

         
            await sock.sendMessage(botJid, {
                text: notificationText,
                mentions: [deletedBy, sender]
            });

            
            if (originalMessage.mediaType && originalMessage.mediaPath && fs.existsSync(originalMessage.mediaPath)) {
                const mediaCaption = `📎 **${originalMessage.mediaType.toUpperCase()} SUPPRIMÉ RÉCUPÉRÉ**\nExpéditeur: @${senderName}\nSession: ${phoneNumber}`;
                const mediaOptions = {
                    caption: mediaCaption,
                    mentions: [sender]
                };

                try {
                    switch (originalMessage.mediaType) {
                        case 'image':
                            await sock.sendMessage(botJid, {
                                image: { url: originalMessage.mediaPath },
                                ...mediaOptions
                            });
                            break;
                        case 'video':
                            await sock.sendMessage(botJid, {
                                video: { url: originalMessage.mediaPath },
                                ...mediaOptions
                            });
                            break;
                        case 'sticker':
                            await sock.sendMessage(botJid, {
                                sticker: { url: originalMessage.mediaPath }
                            });
                            await sock.sendMessage(botJid, {
                                text: mediaCaption,
                                mentions: [sender]
                            });
                            break;
                        case 'audio':
                            await sock.sendMessage(botJid, {
                                audio: { url: originalMessage.mediaPath },
                                mimetype: 'audio/mpeg',
                                ptt: false,
                                ...mediaOptions
                            });
                            break;
                    }

                    console.log(`📎 [${phoneNumber}] Média ${originalMessage.mediaType} récupéré et envoyé`);
                } catch (err) {
                    await sock.sendMessage(botJid, {
                        text: `⚠️ Erreur envoi média: ${err.message}`
                    });
                }

                
                try {
                    fs.unlinkSync(originalMessage.mediaPath);
                } catch (err) {
                    console.error('❌ Erreur suppression média:', err.message);
                }
            }

           
            messageStore.delete(messageId);
            
            console.log(`✅ [${phoneNumber}] Message supprimé traité: ${messageId}`);

        } catch (error) {
            console.error(`❌ [${phoneNumber}] Erreur traitement révocation:`, error.message);
        }
    }

  
    getSessionDB(phoneNumber) {
        if (!this.sessionDatabases.has(phoneNumber)) {
            this.sessionDatabases.set(phoneNumber, this.loadSessionDB(phoneNumber));
        }
        return this.sessionDatabases.get(phoneNumber);
    }

    loadSessionDB(phoneNumber) {
        const dbPath = `./session_dbs/${phoneNumber}_db.json`;
        
        
        const dbDir = './session_dbs';
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        try {
            if (fs.existsSync(dbPath)) {
                const content = fs.readFileSync(dbPath, 'utf-8');
                return JSON.parse(content);
            } else {
                const defaultDB = {
                    groups: {},
                    users: {},
                    settings: {}
                };
                fs.writeFileSync(dbPath, JSON.stringify(defaultDB, null, 2));
                return defaultDB;
            }
        } catch (error) {
            console.error(`❌ Erreur chargement DB session ${phoneNumber}:`, error.message);
            return {
                groups: {},
                users: {},
                settings: {}
            };
        }
    }

    saveSessionDB(phoneNumber) {
        const dbPath = `./session_dbs/${phoneNumber}_db.json`;
        const sessionDB = this.getSessionDB(phoneNumber);
        
        try {
            fs.writeFileSync(dbPath, JSON.stringify(sessionDB, null, 2));
            console.log(`💾 DB session ${phoneNumber} sauvegardée`);
        } catch (error) {
            console.error(`❌ Erreur sauvegarde DB session ${phoneNumber}:`, error.message);
        }
    }

    getGroupConfig(phoneNumber, jid) {
        const sessionDB = this.getSessionDB(phoneNumber);
        if (!sessionDB.groups) sessionDB.groups = {};
        if (!sessionDB.groups[jid]) {
            sessionDB.groups[jid] = {
                antilink: { enabled: false, kickThreshold: 3 },
                antispam: { enabled: false, kickThreshold: 3 },
                antimention: { enabled: false },
                antitag: { enabled: false },
                welcome: { enabled: false, text: '' },
                goodbye: { enabled: false, text: '' },
                users: {}
            };
            this.saveSessionDB(phoneNumber);
        }
        return sessionDB.groups[jid];
    }

    getGroupUser(phoneNumber, jid, sender) {
        const group = this.getGroupConfig(phoneNumber, jid);
        if (!group.users) group.users = {};
        if (!group.users[sender]) {
            group.users[sender] = {
                antilink_warnings: 0,
                antispam_warnings: 0,
                messages: []
            };
            this.saveSessionDB(phoneNumber);
        }
        return group.users[sender];
    }

    loadCommands() {
        this.commands = new Map();
        const commandsPath = path.join(__dirname, 'commands');
        
        if (!fs.existsSync(commandsPath)) {
            console.log('📁 Dossier commands créé');
            fs.mkdirSync(commandsPath, { recursive: true });
            return;
        }
        
        fs.readdirSync(commandsPath)
            .filter(file => file.endsWith('.js'))
            .forEach(file => {
                try {
                    const commandPath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(commandPath)];
                    
                    const command = require(commandPath);
                    if (command.name) {
                        this.commands.set(command.name.toLowerCase(), command);
                        if (command.aliases && Array.isArray(command.aliases)) {
                            command.aliases.forEach(alias => 
                                this.commands.set(alias.toLowerCase(), command)
                            );
                        }
                        console.log(`✅ Commande chargée: ${command.name}`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur chargement commande ${file}:`, error.message);
                }
            });
        
        console.log(`📚 ${this.commands.size} commandes WhatsApp chargées au total.`);
    }

    async createSession(phoneNumber, callbacks) {
        try {
            console.log(`🔄 Création session pour ${phoneNumber}...`);
            
           
            this.getSessionDB(phoneNumber);
            
            const { version } = await fetchLatestBaileysVersion();
            const sessionPath = `./whatsapp_sessions/${phoneNumber}`;
            
            if (!fs.existsSync(sessionPath)) {
                fs.mkdirSync(sessionPath, { recursive: true });
                console.log(`📁 Dossier session créé: ${sessionPath}`);
            }

            const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

            const sock = makeWASocket({
                version,
                auth: state,
                printQRInTerminal: false,
                browser: ['Windows', 'Safari', '5.1.7'],
                logger: pino({ level: 'silent' }),
                syncFullHistory: false,
                markOnlineOnConnect: true,
                generateHighQualityLinkPreview: true,
                defaultQueryTimeoutMs: 60000,
                connectTimeoutMs: 60000,
                emitOwnEvents: false,
                fireInitQueries: false,
                maxMsgRetryCount: 5
            });

         
            sock.ev.on('creds.update', saveCreds);

          
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                console.log(`📡 Connexion update pour ${phoneNumber}:`, connection);
                
                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    
                    console.log(`❌ Connexion fermée pour ${phoneNumber}. Reconnection: ${shouldReconnect}`);
                    console.log('Raison:', lastDisconnect?.error?.message || 'Inconnue');
                    
                    if (shouldReconnect) {
                        console.log(`🔄 Tentative de reconnexion pour ${phoneNumber} dans 5 secondes...`);
                        setTimeout(() => {
                            this.createSession(phoneNumber, callbacks);
                        }, 5000);
                    } else {
                        console.log(`❌ Déconnexion définitive pour ${phoneNumber} (Logged out)`);
                        this.removeSession(phoneNumber);
                        callbacks.onDisconnected?.('Utilisateur déconnecté');
                    }
                } else if (connection === 'open') {
                    console.log(`✅ Session WhatsApp ouverte pour ${phoneNumber}`);
                    
                    
                    userConfigManager.getUserConfig(phoneNumber);
                    
                   
                    const userConfig = userConfigManager.getUserConfig(phoneNumber);
                    const welcomeMessage = `🎉 sukuna est maintenant en ligne!*

*Session:* ${phoneNumber}
*Préfixe:* \`${userConfig.prefix}\`

*Tapez* \`${userConfig.prefix}menu\` *pour commencer!*

made by stephdev`;

                    try {
                        const botJid = sock.user.id;
                        await sock.sendMessage(botJid, { image: { url: "https://i.postimg.cc/6Qq7gWb9/Sukuna.jpg" }, caption: font(welcomeMessage) }, { quoted: null });
                        console.log(`📨 Message de bienvenue envoyé à ${phoneNumber}`);
                    } catch (err) {
                        console.error(`❌ Erreur envoi message bienvenue ${phoneNumber}:`, err.message);
                    }
                    
                    callbacks.onConnected?.();
                } else if (connection === 'connecting') {
                    console.log(`🔄 Connexion en cours pour ${phoneNumber}...`);
                }
            });

           
            sock.ev.on('groups.update', async (updates) => {
                    for (const update of updates) {
                        if (update.id) {
                            try {
                                const metadata = await sock.groupMetadata(update.id);
                                console.log(`📊 Groupe mis à jour: ${metadata.subject} pour ${phoneNumber}`);
                            } catch (err) {
                                console.error(`❌ Erreur update groupe ${phoneNumber}:`, err.message);
                            }
                        }
                    }
                });

          
            sock.ev.on('group-participants.update', async (event) => {
                try {
                    const metadata = await sock.groupMetadata(event.id);
                    console.log(`👥 Participants mis à jour dans ${metadata.subject} pour ${phoneNumber}`);
                } catch (err) {
                    console.error(`❌ Erreur participants groupe ${phoneNumber}:`, err.message);
                }
            });

           
            setTimeout(async () => {
                if (!state.creds.registered) {
                    try {
                        console.log(`📱 Demande code de pairage pour ${phoneNumber}...`);
                        const code = await sock.requestPairingCode(phoneNumber);
                        console.log(`🔑 Code de pairage généré pour ${phoneNumber}: ${code}`);
                        callbacks.onPairingCode?.(code);
                        
                       
                        setTimeout(() => {
                            if (!state.creds.registered) {
                                console.log(`⏰ Code de pairage expiré pour ${phoneNumber}`);
                                this.removeSession(phoneNumber);
                                callbacks.onError?.(new Error('Code de pairage expiré - Reconnectez-vous'));
                            }
                        }, 60000); 
                        
                    } catch (error) {
                        console.error(`❌ Erreur code pairage ${phoneNumber}:`, error.message);
                        callbacks.onError?.(error);
                        this.removeSession(phoneNumber);
                    }
                }
            }, 3000); 


            if (sock) {
                sock.ev.on('messages.upsert', async ({ messages }) => {
                    for (const message of messages) {
                        try {
                            await this.handleMessage(message, sock, phoneNumber);
                        } catch (err) {
                            console.error(`❌ Erreur traitement message ${phoneNumber}:`, err.message);
                        }
                    }
                });

               

                
            }

            this.sessions.set(phoneNumber, {
                sock,
                phoneNumber,
                createdAt: new Date(),
                lastActivity: new Date()
            });

            console.log(`💾 Session stockée pour ${phoneNumber}`);
            return sock;

        } catch (error) {
            console.error(`❌ Erreur critique création session ${phoneNumber}:`, error);
            callbacks.onError?.(error);
            throw error;
        }
    }

   
async handleMessage(msg, sock, phoneNumber) {
     if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');

    if (msg.message.protocolMessage?.type === 0) {
            await this.handleMessageRevocation(msg, sock, phoneNumber);
            return;
        }

      
        await this.storeMessage(msg, sock, phoneNumber);

    
    const body = msg.message.conversation
        || msg.message.extendedTextMessage?.text
        || msg.message.buttonsResponseMessage?.selectedButtonId
        || msg.message.templateButtonReplyMessage?.selectedId
        || msg.message.listResponseMessage?.singleSelectReply?.selectedRowId
        || '';

    
    if (msg.key.fromMe && !body) {
        return;
    }

    // ==================== SYSTÈME ANTIDELETE ====================
     const sessionDB = this.getSessionDB(phoneNumber);
    const antideleteEnabled = sessionDB.settings?.antidelete?.enabled;
    
    if (antideleteEnabled) {
       
        if (!sessionDB.messageCache || !(sessionDB.messageCache instanceof Map)) {
            sessionDB.messageCache = new Map();
            console.log(`🔧 [${phoneNumber}] MessageCache initialisé comme Map`);
        }
        
        const messageData = {
            key: msg.key,
            message: msg.message,
            messageTimestamp: msg.messageTimestamp,
            pushName: msg.pushName,
            jid: jid,
            sender: sender,
            body: body,
            isGroup: isGroup,
            savedAt: Date.now()
        };
        
        sessionDB.messageCache.set(msg.key.id, messageData);
        
        
        if (sessionDB.messageCache.size > 1000) {
            const oldestKey = sessionDB.messageCache.keys().next().value;
            sessionDB.messageCache.delete(oldestKey);
        }
        
        console.log(`💾 [${phoneNumber}] Message mis en cache: ${msg.key.id} (Total: ${sessionDB.messageCache.size})`);
    }

    const senderPhoneNumber = sender.split('@')[0];
    const userConfig = userConfigManager.getUserConfig(phoneNumber);
    const prefix = userConfig.prefix || config.prefix;

 
    const groupConfig = isGroup ? this.getGroupConfig(phoneNumber, jid) : {};
    const senderIsAdmin = isGroup ? await isAdmin(sock, jid, sender) : false;
    const senderIsOwner = isOwner(msg, config);
    const senderSpecificConfig = isGroup ? this.getGroupUser(phoneNumber, jid, sender) : null;
    
    // ==================== PROTECTIONS DE GROUPE  ====================
    if (isGroup && !senderIsAdmin && !senderIsOwner) {
        
        // Protection ANTISPAM 
        if (groupConfig.antispam?.enabled && senderSpecificConfig) {
            const now = Date.now();
            const messages = senderSpecificConfig.messages || [];
            messages.push({ timestamp: now, messageId: msg.key.id });
            
            
            const recentMessages = messages.filter(msgData => (now - msgData.timestamp) < 2000);
            senderSpecificConfig.messages = recentMessages;
            this.saveSessionDB(phoneNumber);
            
            if (recentMessages.length > 3) {
                console.log(`🚨 [${phoneNumber}] SPAM détecté de ${senderPhoneNumber} - ${recentMessages.length} messages`);
                
               
                for (const msgData of recentMessages) {
                    try {
                        await sock.sendMessage(jid, { 
                            delete: { 
                                remoteJid: jid, 
                                id: msgData.messageId,
                                participant: sender 
                            } 
                        });
                        console.log(`🗑️ [${phoneNumber}] Message spam supprimé: ${msgData.messageId}`);
                    } catch (e) {
                        console.log(`⚠️ [${phoneNumber}] Impossible de supprimer: ${msgData.messageId}`);
                    }
                    
                    // Petit délai pour éviter la surcharge
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                senderSpecificConfig.antispam_warnings = (senderSpecificConfig.antispam_warnings || 0) + 1;
                this.saveSessionDB(phoneNumber);
                
                await sendReply(sock, jid, `🚨 SPAM DÉTECTÉ ! Tous les messages supprimés.\n@${senderPhoneNumber} - Avertissement ${senderSpecificConfig.antispam_warnings}/${groupConfig.antispam.kickThreshold}`, {
                    mentions: [sender]
                });
                
                if (senderSpecificConfig.antispam_warnings >= groupConfig.antispam.kickThreshold) {
                    try {
                        await sock.groupParticipantsUpdate(jid, [sender], "remove");
                        await sendReply(sock, jid, `🚫 @${senderPhoneNumber} expulsé pour spam répétitif.`, {
                            mentions: [sender]
                        });
                        console.log(`👋 [${phoneNumber}] ${senderPhoneNumber} expulsé pour spam`);
                    } catch (e) {
                        console.log(`⚠️ [${phoneNumber}] Impossible d'expulser ${senderPhoneNumber}`);
                    }
                }
                return;
            }
        }

        // Protection ANTITAG AMÉLIORÉE 
        if (groupConfig.antitag?.enabled) {
            const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const hasTagAll = body.includes('@all') || body.includes('@everyone');
            const hasMultipleTags = mentions.length >= 3; 
            
            if (hasTagAll || hasMultipleTags) {
                try { 
                    await sock.sendMessage(jid, { delete: msg.key }); 
                    console.log(`🚫 [${phoneNumber}] Tag multiple/all supprimé de ${senderPhoneNumber} (${mentions.length} tags)`);
                } catch (e) {
                    console.log(`⚠️ [${phoneNumber}] Impossible de supprimer le tag multiple`);
                }
                
                const reason = hasTagAll ? '@all/@everyone' : `${mentions.length} personnes taguées`;
                await sendReply(sock, jid, `🚫 Tag en masse détecté (${reason}) par @${senderPhoneNumber}. Message supprimé.`, {
                    quoted: msg,
                    mentions: [sender]
                });
                return;
            }
        }

        // Protection ANTIMENTION 
        if (groupConfig.antimention?.enabled) {
            const groupName = jid.split('@')[0];
            const hasGroupMention = body.includes(`@${groupName}`) || 
                                   body.toLowerCase().includes(groupName.toLowerCase()) ||
                                   (msg.message.extendedTextMessage?.contextInfo?.mentionedJid || []).includes(jid);
            
            if (hasGroupMention) {
                try { 
                    await sock.sendMessage(jid, { delete: msg.key }); 
                    console.log(`🚫 [${phoneNumber}] Mention de groupe supprimée de ${senderPhoneNumber}`);
                } catch (e) {
                    console.log(`⚠️ [${phoneNumber}] Impossible de supprimer la mention de groupe`);
                }
                
                await sendReply(sock, jid, `🚫 Mention du groupe interdite par @${senderPhoneNumber}.`, {
                    quoted: msg,
                    mentions: [sender]
                });
                return;
            }
        }

        // Protection ANTILINK 
        const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^\s]*)/gi;
        if (groupConfig.antilink?.enabled && linkRegex.test(body) && senderSpecificConfig) {
            try { 
                await sock.sendMessage(jid, { delete: msg.key }); 
                console.log(`🚫 [${phoneNumber}] Lien supprimé de ${senderPhoneNumber}`);
            } catch (e) {
                console.log(`⚠️ [${phoneNumber}] Impossible de supprimer le lien`);
            }
            
            senderSpecificConfig.antilink_warnings = (senderSpecificConfig.antilink_warnings || 0) + 1;
            this.saveSessionDB(phoneNumber);
            
            await sendReply(sock, jid, `🚫 Lien détecté de @${senderPhoneNumber}. Avertissement ${senderSpecificConfig.antilink_warnings}/${groupConfig.antilink.kickThreshold}.`, {
                quoted: msg,
                mentions: [sender]
            });
            
            if (senderSpecificConfig.antilink_warnings >= groupConfig.antilink.kickThreshold) {
                try {
                    await sock.groupParticipantsUpdate(jid, [sender], "remove");
                    await sendReply(sock, jid, `🚫 @${senderPhoneNumber} expulsé pour liens répétitifs.`, {
                        mentions: [sender]
                    });
                    console.log(`👋 [${phoneNumber}] ${senderPhoneNumber} expulsé pour liens`);
                } catch (e) {
                    console.log(`⚠️ [${phoneNumber}] Impossible d'expulser ${senderPhoneNumber}`);
                }
            }
            return;
        }
    }
    
    // ==================== GESTION DES COMMANDES ====================
    const session = this.sessions.get(phoneNumber);
    if (session) {
        session.lastActivity = new Date();
    }

    const isCommand = body.startsWith(prefix);
    if (!isCommand) return;
    
    const commandText = body.slice(prefix.length).trim();
    const [cmdName, ...args] = commandText.split(/\s+/);
    
    if (!cmdName) return;

    const userName = msg.pushName || sender.split('@')[0];
    const location = isGroup ? `Groupe` : 'Privé';
    console.log(`💬 [${phoneNumber}] ${userName} (${location}): ${prefix}${cmdName}`);

    const command = this.commands.get(cmdName.toLowerCase());
    
    if (!command) {
        return sock.sendMessage(jid, { 
            text: `❌ *Commande inconnue: \`${cmdName}\`*\n\nTapez *${prefix}menu* pour voir toutes les commandes disponibles!\n\n_${userConfig.botName} - Session ${phoneNumber}_`,
            quoted: msg
        });
    }

    
    if (command.name !== 'mode' && !modeCommand.canExecuteCommand(phoneNumber, sender)) {
        await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        return;
    }

    try {
        console.log(`⚡ Exécution commande '${command.name}' pour ${phoneNumber}`);

       
        const sessionGetGroupConfig = (groupJid) => this.getGroupConfig(phoneNumber, groupJid);
        const sessionGetGroupUser = (groupJid, userSender) => this.getGroupUser(phoneNumber, groupJid, userSender);
        const sessionSaveDB = () => this.saveSessionDB(phoneNumber);

        await command.execute({
            sock, 
            msg, 
            args, 
            command: cmdName, 
            commands: this.commands, 
            config: userConfig,
            globalConfig: config,
            phoneNumber,
            userConfigManager,
            jid,
            sender,
            isGroup,
            body: commandText,
            
            getGroupConfig: sessionGetGroupConfig,
            getGroupUser: sessionGetGroupUser,
            saveDB: sessionSaveDB,
            isAdmin,
            isOwner,
            
            db: this.getSessionDB(phoneNumber)
        });

        console.log(`✅ Commande '${command.name}' exécutée avec succès pour ${phoneNumber}`);

    } catch (error) {
        console.error(`⚠️ ERREUR dans commande '${cmdName}' pour ${phoneNumber}:`, error);
        
        const errorMessage = `⚠️ *Erreur lors de l'exécution de la commande*

*Commande:* \`${prefix}${cmdName}\`
*Erreur:* ${error.message}
`;

        try {
            await sock.sendMessage(jid, { 
                text: errorMessage 
            }, { quoted: msg });
        } catch (sendError) {
            console.error(`❌ Impossible d'envoyer message d'erreur ${phoneNumber}:`, sendError.message);
        }
    }
}


async handleMessageDelete(deletedMessages, sock, phoneNumber) {
    const sessionDB = this.getSessionDB(phoneNumber);
    const antideleteEnabled = sessionDB.settings?.antidelete?.enabled;
    
    if (!antideleteEnabled) {
        
        return;
    }

   
    if (!sessionDB.messageCache || !(sessionDB.messageCache instanceof Map)) {
        console.log(`⚠️ [${phoneNumber}] MessageCache non initialisé, impossible de récupérer les messages supprimés`);
        return;
    }

    console.log(`🗑️ [${phoneNumber}] Traitement de ${deletedMessages.length} message(s) supprimé(s)`);

    for (const deletedMsg of deletedMessages) {
        const messageId = deletedMsg.key.id;
        const cachedMessage = sessionDB.messageCache.get(messageId);
        
        if (cachedMessage) {
            console.log(`🗑️ [${phoneNumber}] Message supprimé détecté: ${messageId}`);
            
            try {
                const senderPhone = cachedMessage.sender.split('@')[0];
                const location = cachedMessage.isGroup ? `Groupe` : 'Discussion privée';
                let groupName = 'Discussion privée';
                
                if (cachedMessage.isGroup) {
                    try {
                        const metadata = await sock.groupMetadata(cachedMessage.jid);
                        groupName = metadata?.subject || 'Groupe inconnu';
                    } catch (err) {
                        groupName = 'Groupe inconnu';
                    }
                }

                const deleteNotification = `🗑️ **MESSAGE SUPPRIMÉ DÉTECTÉ**\n\n` +
                    `📱 Session: ${phoneNumber}\n` +
                    `👤 Expéditeur: @${senderPhone}\n` +
                    `📍 Lieu: ${location}\n` +
                    `📝 Groupe/Chat: ${groupName}\n` +
                    `🕐 Supprimé: ${new Date().toLocaleString()}\n` +
                    `💬 Contenu: ${cachedMessage.body || '[Média ou message spécial]'}\n\n` +
                    `_Message sauvegardé par Antidelete System_`;

                
                const botJid = sock.user.id;
                await sock.sendMessage(botJid, {
                    text: deleteNotification,
                    mentions: [cachedMessage.sender]
                });

             
                await this.handleDeletedMedia(cachedMessage, sock, botJid, senderPhone, groupName, phoneNumber);

                
                sessionDB.messageCache.delete(messageId);
                
                console.log(`✅ [${phoneNumber}] Notification antidelete envoyée pour ${senderPhone}`);

            } catch (notificationError) {
                console.error(`❌ [${phoneNumber}] Erreur envoi notification antidelete:`, notificationError.message);
            }
        } else {
            console.log(`ℹ️ [${phoneNumber}] Message supprimé non trouvé dans le cache: ${messageId}`);
        }
    }
}


async handleDeletedMedia(cachedMessage, sock, botJid, senderPhone, groupName, phoneNumber) {
    if (!cachedMessage.message.imageMessage && 
        !cachedMessage.message.videoMessage && 
        !cachedMessage.message.audioMessage && 
        !cachedMessage.message.documentMessage &&
        !cachedMessage.message.stickerMessage) {
        return; 
    }

    try {
    
        let mediaType = null;
        let mediaMessage = null;
        
        if (cachedMessage.message.imageMessage) {
            mediaType = 'image';
            mediaMessage = cachedMessage.message.imageMessage;
        } else if (cachedMessage.message.videoMessage) {
            mediaType = 'video';
            mediaMessage = cachedMessage.message.videoMessage;
        } else if (cachedMessage.message.audioMessage) {
            mediaType = 'audio';
            mediaMessage = cachedMessage.message.audioMessage;
        } else if (cachedMessage.message.documentMessage) {
            mediaType = 'document';
            mediaMessage = cachedMessage.message.documentMessage;
        } else if (cachedMessage.message.stickerMessage) {
            mediaType = 'sticker';
            mediaMessage = cachedMessage.message.stickerMessage;
        }
        
        if (mediaType && mediaMessage && mediaMessage.url) {
            const mediaCaption = `📎 **MÉDIA SUPPRIMÉ RÉCUPÉRÉ**\n\n` +
                `Type: ${mediaType.toUpperCase()}\n` +
                `Expéditeur: @${senderPhone}\n` +
                `Lieu: ${groupName}\n` +
                `Caption originale: ${mediaMessage.caption || 'Aucune'}\n\n` +
                `_Antidelete System - ${phoneNumber}_`;

            
            const mediaObject = {
                [mediaType]: { url: mediaMessage.url },
                caption: mediaCaption,
                mentions: [cachedMessage.sender]
            };

          
            if (mediaType === 'sticker') {
                delete mediaObject.caption;
                
                await sock.sendMessage(botJid, { sticker: { url: mediaMessage.url } });
                await sock.sendMessage(botJid, { 
                    text: mediaCaption,
                    mentions: [cachedMessage.sender]
                });
            } else {
                await sock.sendMessage(botJid, mediaObject);
            }

            console.log(`📎 [${phoneNumber}] Média ${mediaType} récupéré et renvoyé`);
        }
        
    } catch (mediaError) {
        console.error(`❌ [${phoneNumber}] Erreur récupération média:`, mediaError.message);
        
      
        await sock.sendMessage(botJid, {
            text: `⚠️ **ERREUR RÉCUPÉRATION MÉDIA**\n\n` +
                `Un média a été supprimé mais n'a pas pu être récupéré.\n` +
                `Expéditeur: @${senderPhone}\n` +
                `Lieu: ${groupName}\n` +
                `Erreur: ${mediaError.message}\n\n` +
                `_Antidelete System - ${phoneNumber}_`,
            mentions: [cachedMessage.sender]
        });
    }
}

    async removeSession(phoneNumber) {
        try {
            console.log(`🗑️ Suppression session ${phoneNumber}...`);
            
            const sessionData = this.sessions.get(phoneNumber);
            if (sessionData && sessionData.sock) {
                try {
                    await sessionData.sock.logout();
                    console.log(`📤 Logout effectué pour ${phoneNumber}`);
                } catch (logoutError) {
                    console.error(`❌ Erreur logout ${phoneNumber}:`, logoutError.message);
                }
                
                this.sessions.delete(phoneNumber);
            }

           
            this.sessionDatabases.delete(phoneNumber);
            
            const sessionPath = `./whatsapp_sessions/${phoneNumber}`;
            if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log(`📁 Fichiers de session supprimés: ${sessionPath}`);
            }

           
            const dbPath = `./session_dbs/${phoneNumber}_db.json`;
            if (fs.existsSync(dbPath)) {
                fs.unlinkSync(dbPath);
                console.log(`💾 Base de données de session supprimée: ${dbPath}`);
            }

            console.log(`✅ Session ${phoneNumber} complètement supprimée`);
            
        } catch (error) {
            console.error(`❌ Erreur suppression session ${phoneNumber}:`, error);
        }
    }

   
    getSession(phoneNumber) {
        const sessionData = this.sessions.get(phoneNumber);
        return sessionData ? sessionData.sock : null;
    }

    getAllSessions() {
        return Array.from(this.sessions.keys());
    }

    getSessionInfo(phoneNumber) {
        return this.sessions.get(phoneNumber) || null;
    }

    getAllSessionsInfo() {
        const sessionsInfo = {};
        this.sessions.forEach((sessionData, phoneNumber) => {
            sessionsInfo[phoneNumber] = {
                phoneNumber: sessionData.phoneNumber,
                createdAt: sessionData.createdAt,
                lastActivity: sessionData.lastActivity,
                connected: sessionData.sock ? true : false
            };
        });
        return sessionsInfo;
    }

    reloadCommands() {
        console.log('🔄 Rechargement des commandes...');
        this.loadCommands();
    }

    async broadcastMessage(message, excludeSessions = []) {
        const results = [];
        
        for (const [phoneNumber, sessionData] of this.sessions) {
            if (excludeSessions.includes(phoneNumber)) continue;
            
            try {
                const botJid = sessionData.sock.user?.id;
                if (botJid) {
                    await sessionData.sock.sendMessage(botJid, { text: message });
                    results.push({ phoneNumber, success: true });
                    console.log(`📤 Broadcast envoyé à ${phoneNumber}`);
                }
            } catch (error) {
                results.push({ phoneNumber, success: false, error: error.message });
                console.error(`❌ Erreur broadcast ${phoneNumber}:`, error.message);
            }
        }
        
        return results;
    }

    getStats() {
        const now = new Date();
        const activeSessions = this.sessions.size;
        const sessionsInfo = this.getAllSessionsInfo();
        
        return {
            totalSessions: activeSessions,
            totalCommands: this.commands.size,
            uptime: process.uptime(),
            sessionsInfo,
            memoryUsage: process.memoryUsage(),
            timestamp: now.toISOString()
        };
    }

    cleanupInactiveSessions(maxInactiveHours = 24) {
        const now = new Date();
        const maxInactiveMs = maxInactiveHours * 60 * 60 * 1000;
        
        for (const [phoneNumber, sessionData] of this.sessions) {
            const inactiveTime = now - sessionData.lastActivity;
            
            if (inactiveTime > maxInactiveMs) {
                console.log(`🧹 Nettoyage session inactive ${phoneNumber} (${Math.round(inactiveTime / (1000 * 60 * 60))}h d'inactivité)`);
                this.removeSession(phoneNumber);
            }
        }
    }
}

module.exports = WhatsAppManager;