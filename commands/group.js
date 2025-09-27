// commands/group.js

const { font } = require('../lib/helpers');
const { isAdmin, isOwner } = require('../lib/isAdmin');

module.exports = {
  name: 'group',
  aliases: [
    'gname', 'gdesc', 'kick', 'add', 'promote', 'demote', 'purge',
    'lock', 'unlock', 'grouplink', 'welcome', 'goodbye',
  ],
  description: 'Commandes de gestion de groupe (Admins seulement).',

  async execute({ sock, msg, args, command, config, db, saveDB }) {
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    
    
    const senderIsAdmin = isGroup ? await isAdmin(sock, jid, sender) : false;
    const senderIsOwner = isOwner(msg, config);

 
    if (!isGroup) return await sock.sendMessage(jid, { text: font("❌ ᴄᴏᴍᴍᴀɴᴅᴇ ᴅᴇ ᴛᴇʀʀɪᴛᴏɪʀᴇ (ɢʀᴏᴜᴘᴇ).") }, { quoted: msg });
    if (!senderIsAdmin && !senderIsOwner) return await sock.sendMessage(jid, { text: font("❌ sᴇᴜʟs ʟᴇs ᴀᴅᴍɪɴs ᴘᴇᴜᴠᴇɴᴛ ғᴀɪʀᴇ çᴀ.") }, { quoted: msg });

   
    const sendAdminError = () => sock.sendMessage(jid, { text: font("❌ ᴊᴇ ɴ'ᴀɪ ᴘᴀs ʟᴇs ᴅʀᴏɪᴛs ᴘᴏᴜʀ ғᴀɪʀᴇ çᴀ. ᴊᴇ ᴅᴏɪs êᴛʀᴇ ᴀᴅᴍɪɴ.") }, { quoted: msg });




    try {
      switch (command) {
        case "gname": {
          const newName = args.join(" ");
          if (!newName) return await sock.sendMessage(jid, { text: font("ᴜsᴀɢᴇ: .ɢɴᴀᴍᴇ [ɴᴏᴜᴠᴇᴀᴜ ɴᴏᴍ]") }, { quoted: msg });

          await sock.groupUpdateSubject(jid, newName);
          break;
        }

        case "gdesc": {
          const newDesc = args.join(" ");
          if (!newDesc) return await sock.sendMessage(jid, { text: font("ᴜsᴀɢᴇ: .ɢᴅᴇsᴄ [ɴᴏᴜᴠᴇʟʟᴇ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ]") }, { quoted: msg });

          await sock.groupUpdateDescription(jid, newDesc);
          break;
        }

        case 'lock': {
          await sock.groupSettingUpdate(jid, 'announcement');
          break;
        }

        case 'unlock': {
          await sock.groupSettingUpdate(jid, 'not_announcement');
          break;
        }

        case 'grouplink': {
          const code = await sock.groupInviteCode(jid);
          const linkText = `🔗 ᴠᴏɪᴄɪ ʟ'ɪɴᴠɪᴛᴀᴛɪᴏɴ ᴘᴏᴜʀ ʀᴇᴊᴏɪɴᴅʀᴇ ɴᴏᴛʀᴇ ᴛᴇʀʀɪᴛᴏɪʀᴇ :\n\nhttps://chat.whatsapp.com/${code}`;
          await sock.sendMessage(jid, { text: font(linkText) }, { quoted: msg });
          return;
        }

        case 'purge': {
          await sock.sendMessage(jid, {
            react: {
              text: '💀',
              key: msg.key
            }
          });

          const groupMetadata = await sock.groupMetadata(jid);
          const membersToKick = groupMetadata.participants
            .filter(p => !p.admin)
            .map(p => p.id);

          if (membersToKick.length > 0) {
            await sock.groupParticipantsUpdate(jid, membersToKick, "remove");
          } else {
            await sock.sendMessage(jid, { text: font("ℹ️ ᴀᴜᴄᴜɴ ᴍᴇᴍʙʀᴇ à ᴇxᴘᴜʟsᴇʀ. ᴛᴏᴜᴛ ʟᴇ ᴍᴏɴᴅᴇ ᴇsᴛ ғɪᴅèʟᴇ.") }, { quoted: msg });
          }
          break;
        }
        
        case 'add': {
          const userToAdd = args[0]?.replace(/[^0-9]/g, '');
          if (!userToAdd) {
            return await sock.sendMessage(jid, { text: font("❌ ᴠᴇᴜɪʟʟᴇᴢ ғᴏᴜʀɴɪʀ ᴜɴ ɴᴜᴍéʀᴏ à ajouter.") }, { quoted: msg });
          }

          await sock.groupParticipantsUpdate(jid, [`${userToAdd}@s.whatsapp.net`], "add");
          break;
        }

        case "kick":
        case "promote":
        case "demote": {
          const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
          const target = mentionedJid[0];
          if (!target) return await sock.sendMessage(jid, { text: font(`ᴜsᴀɢᴇ: .${command} @ᴍᴇᴍʙʀᴇ`) }, { quoted: msg });
          
          const action = command === 'kick' ? 'remove' : command;
          await sock.groupParticipantsUpdate(jid, [target], action);
          break;
        }
        
      

        case 'welcome':
        case 'goodbye': {
          const action = args[0]?.toLowerCase();
          db[jid] = db[jid] || {};

          if (action === 'on') {
            db[jid][command] = true;
            saveDB();
            await sock.sendMessage(jid, { text: font(`✅ ʟᴇs ᴍᴇssᴀɢᴇs ᴅᴇ *${command}* sᴏɴᴛ ᴍᴀɪɴᴛᴇɴᴀɴᴛ ᴀᴄᴛɪᴠés.`) }, { quoted: msg });
          } else if (action === 'off') {
            db[jid][command] = false;
            saveDB();
            await sock.sendMessage(jid, { text: font(`❌ ʟᴇs ᴍᴇssᴀɢᴇs ᴅᴇ *${command}* sᴏɴᴛ ᴍᴀɪɴᴛᴇɴᴀɴᴛ ᴅésᴀᴄᴛɪᴠés.`) }, { quoted: msg });
          } else {
            const status = db[jid][command] ? 'ᴀᴄᴛɪᴠé' : 'ᴅésᴀᴄᴛɪᴠé';
            const usage = `*sᴛᴀᴛᴜᴛ ᴅᴇ ${command} :* ${status}\n\n*ᴜsᴀɢᴇ :*\n${config.prefix}${command} on\n${config.prefix}${command} off`;
            await sock.sendMessage(jid, { text: font(usage) }, { quoted: msg });
          }
          return;
        }

        case 'mute': {
          db[jid] = db[jid] || {};
          db[jid].muted = true;
          saveDB();
          break;
        }
        
        case 'unmute': {
          db[jid] = db[jid] || {};
          db[jid].muted = false;
          saveDB();
          break;
        }

       
      }

      
      await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });

    } catch (error) {
      console.error(`Erreur dans la commande de groupe '${command}':`, error);
      
      if (error.data === 403) {
        await sendAdminError();
      } else {
        await sock.sendMessage(jid, { text: font('❌ ᴜɴᴇ ᴇʀʀᴇᴜʀ s\'ᴇsᴛ ᴘʀᴏᴅᴜɪᴛᴇ.') }, { quoted: msg });
      }
    }
  }
};