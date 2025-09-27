const { font } = require('../lib/helpers');

module.exports = {
    name: 'ephotomenu',
    aliases: ['textmenu', 'effectmenu'],
    description: 'Affiche le menu des effets de texte',
    
    async execute({ sock, msg, config }) {
        const jid = msg.key.remoteJid;
        
        const menuText = `

╭━━━━━━━━━━━━━━━✦
┃   ❏ 𝙎𝙐𝙆𝙐𝙉𝘼 - 𝙓𝙈𝘿 ❏
┃    *ᴍᴀᴋᴇ ʙʏ ꜱᴛᴇᴘʜᴅᴇᴠ*
╰━━━━━━━━━━━━━━━✦

╭◇ *ᴛᴇxᴛᴍᴀᴋᴇʀ ᴍᴇɴᴜ* ◇
┃❍ ᴘʀᴇғɪx : ${config.prefix}
┃❍ ᴇx: ${config.prefix}neon sukuna
╰❍

╭━━━❏ *ᴇғғᴇᴛꜱ 3ᴅ* ❏
┃▢ᴍᴇᴛᴀʟʟɪᴄ
┃▢ɪᴄᴇ
┃▢ꜱɴᴏᴡ
┃▢ɪᴍᴘʀᴇꜱꜱɪᴠᴇ
┃▢ᴍᴀᴛʀɪx
╰━━━━━━━━━━━━━━━╯

╭━━━❏ *ᴇғғᴇᴛꜱ ɴᴇᴏɴ* ❏
┃▢ʟɪɢʜᴛ
┃▢ɴᴇᴏɴ
┃▢ᴅᴇᴠɪʟ
┃▢ᴘᴜʀᴘʟᴇ
┃▢ᴛʜᴜɴᴅᴇʀ
╰━━━━━━━━━━━━━━━╯

╭━━━❏ *ᴇғғᴇᴛꜱ ɴᴀᴛᴜʀᴇ* ❏
┃▢ʟᴇᴀᴠᴇꜱ
┃▢1917
┃▢ꜱᴀɴᴅ
┃▢ᴄʟᴏᴜᴅꜱ
┃▢ғɪʀᴇ
╰━━━━━━━━━━━━━━━╯

╭━━━❏ *ᴇғғᴇᴛꜱ ɢʟɪᴛᴄʜ* ❏
┃▢ɢʟɪᴛᴄʜ
┃▢ᴘɪxᴇʟɢʟɪᴛᴄʜ
┃▢ɴᴇᴏɴɢʟɪᴛᴄʜ
┃▢ғᴏɢɢʏɢʟᴀꜱꜱ
┃▢ғᴏɢɢʏɢʟᴀꜱꜱᴠ2
╰━━━━━━━━━━━━━━━╯

╭━━━❏ *ᴇғғᴇᴛꜱ ᴀɴɪᴍᴇ* ❏
┃▢ᴅʀᴀɢᴏɴʙᴀʟʟ
┃▢ɴᴀʀᴜᴛᴏ
┃▢ᴛʏᴘᴏ
╰━━━━━━━━━━━━━━━╯

╭━━━❏ *ᴇғғᴇᴛꜱ ᴍᴀʀǫᴜᴇꜱ* ❏
┃▢ᴘᴏʀɴʜᴜʙ
┃▢ᴍᴀʀᴠᴇʟ
┃▢ᴄᴀᴘᴛᴀɪɴᴀᴍᴇʀɪᴄᴀ
┃▢ʙʟᴀᴄᴋᴘɪɴᴋ
┃▢ꜱᴛᴀʀᴡᴀʀꜱ
╰━━━━━━━━━━━━━━━╯

╭━━━❏ *ᴇғғᴇᴛꜱ ᴅɪᴠᴇʀꜱ* ❏
┃▢ᴀʀᴇɴᴀ
┃▢ʜᴀᴄᴋᴇʀ
┃▢ʙᴇᴀʀʟᴏɢᴏ
┃▢ɢʀᴀғғɪᴛɪ
┃▢ɢʀᴀғғɪᴛɪᴠ2
┃▢ғᴜᴛᴜʀɪꜱᴛɪᴄ
┃▢ᴀᴍᴇʀɪᴄᴀ
┃▢ᴇʀᴀꜱᴇ
┃▢ғʀᴏꜱᴛ
╰━━━━━━━━━━━━━━━╯

⚠️ *ɴᴏᴛᴇ* : ᴄᴇʀᴛᴀɪɴꜱ ᴇғғᴇᴛꜱ ɴéᴄᴇꜱꜱɪᴛᴇɴᴛ
ᴅᴇᴜx ᴛᴇxᴛᴇꜱ ꜱéᴘᴀʀéꜱ ᴘᴀʀ |
ᴇx: ${config.prefix}marvel texte1 | texte2
`;

        await sock.sendMessage(jid, { react: { text: '🎨', key: msg.key } });
        await sock.sendMessage(jid, { 
            image: { url: "https://i.postimg.cc/gjZbjhfx/b19c205e79afb89db484c2fcfe29e978.jpg" }, 
            caption: font(menuText) 
        });
    }
};