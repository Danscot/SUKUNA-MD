
const mumaker = require('mumaker');
const axios = require('axios');
const { font } = require('../lib/helpers');

module.exports = {
  name: 'textmaker',
  aliases: [
    'metallic', 'ice', 'snow', 'impressive', 'matrix', 'light',
    'neon', 'devil', 'purple', 'thunder', 'leaves', '1917',
    'arena', 'hacker', 'sand', 'glitch', 'fire',
    'dragonball', 'foggyglass', 'pornhub', 'foggyglassv2', 'naruto', 'typo',
    'marvel', 'frost', 'pixelglitch', 'neonglitch', 'america', 'erase',
    'captainamerica', 'blackpink', 'starwars', 'bearlogo', 'graffiti',
    'graffitiv2', 'futuristic', 'clouds'
  ],
  description: 'Génère des images stylisées à partir de texte.',
  
  
  async execute({ sock, msg, args, command, config }) { 
    const jid = msg.key.remoteJid;
    const text = args.join(' ');

    if (!text) {
      return await sock.sendMessage(jid, { 
        text: font(`❌ Veuillez fournir un texte.\n\n📝 Ex: .${command} sukuna`)
      });
    }

    try {
      await sock.sendMessage(jid, { react: { text: '🖌️', key: msg.key } });

      let result;
      const [text1, text2] = text.split('|').map(t => t.trim());

      
      switch (command) {
        case 'metallic': result = await mumaker.ephoto("https://en.ephoto360.com/impressive-decorative-3d-metal-text-effect-798.html", text); break;
        case 'ice': result = await mumaker.ephoto("https://en.ephoto360.com/ice-text-effect-online-101.html", text); break;
        case 'snow': result = await mumaker.ephoto("https://en.ephoto360.com/create-a-snow-3d-text-effect-free-online-621.html", text); break;
        case 'impressive': result = await mumaker.ephoto("https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html", text); break;
        case 'matrix': result = await mumaker.ephoto("https://en.ephoto360.com/matrix-text-effect-154.html", text); break;
        case 'light': result = await mumaker.ephoto("https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html", text); break;
        case 'neon': result = await mumaker.ephoto("https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html", text); break;
        case 'devil': result = await mumaker.ephoto("https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html", text); break;
        case 'purple': result = await mumaker.ephoto("https://en.ephoto360.com/purple-text-effect-online-100.html", text); break;
        case 'thunder': result = await mumaker.ephoto("https://en.ephoto360.com/thunder-text-effect-online-97.html", text); break;
        case 'leaves': result = await mumaker.ephoto("https://en.ephoto360.com/green-brush-text-effect-typography-maker-online-153.html", text); break;
        case '1917': result = await mumaker.ephoto("https://en.ephoto360.com/1917-style-text-effect-523.html", text); break;
        case 'arena': result = await mumaker.ephoto("https://en.ephoto360.com/create-cover-arena-of-valor-by-mastering-360.html", text); break;
        case 'hacker': result = await mumaker.ephoto("https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html", text); break;
        case 'sand': result = await mumaker.ephoto("https://en.ephoto360.com/write-names-and-messages-on-the-sand-online-582.html", text); break;
        case 'glitch': result = await mumaker.ephoto("https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html", text); break;
        case 'fire': result = await mumaker.ephoto("https://en.ephoto360.com/flame-lettering-effect-372.html", text); break;
        case 'dragonball': result = await mumaker.ephoto("https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html", text); break;
        case 'foggyglass': result = await mumaker.ephoto("https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html", text); break;
        case 'pornhub': result = await mumaker.ephoto("https://en.ephoto360.com/create-pornhub-style-logos-online-free-549.html", [text1, text2]); break;
        case 'foggyglassv2': result = await mumaker.ephoto("https://en.ephoto360.com/write-text-on-wet-glass-online-589.html", text); break;
        case 'naruto': result = await mumaker.ephoto("https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html", text); break;
        case 'typo': result = await mumaker.ephoto("https://en.ephoto360.com/create-online-typography-art-effects-with-multiple-layers-811.html", text); break;
        case 'frost': result = await mumaker.ephoto("https://en.ephoto360.com/create-a-frozen-christmas-text-effect-online-792.html", text); break;
        case 'pixelglitch': result = await mumaker.ephoto("https://en.ephoto360.com/create-pixel-glitch-text-effect-online-769.html", text); break;
        case 'neonglitch': result = await mumaker.ephoto("https://en.ephoto360.com/create-impressive-neon-glitch-text-effects-online-768.html", text); break;
        case 'america': result = await mumaker.ephoto("https://en.ephoto360.com/free-online-american-flag-3d-text-effect-generator-725.html", text); break;
        case 'erase': result = await mumaker.ephoto("https://en.ephoto360.com/create-eraser-deleting-text-effect-online-717.html", text); break;
        case 'blackpink': result = await mumaker.ephoto("https://en.ephoto360.com/create-a-blackpink-neon-logo-text-effect-online-710.html", text); break;
        case 'starwars': result = await mumaker.ephoto("https://en.ephoto360.com/create-a-blackpink-neon-logo-text-effect-online-710.html", text); break;
        case 'bearlogo': result = await mumaker.ephoto("https://en.ephoto360.com/free-bear-logo-maker-online-673.html", text); break;
        case 'graffiti': result = await mumaker.ephoto("https://en.ephoto360.com/create-a-cartoon-style-graffiti-text-effect-online-668.html", text); break;
        case 'graffitiv2': result = await mumaker.ephoto("https://en.ephoto360.com/cute-girl-painting-graffiti-text-effect-667.html", text); break;
        case 'futuristic': result = await mumaker.ephoto("https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html", text); break;
        case 'clouds': result = await mumaker.ephoto("https://en.ephoto360.com/write-text-effect-clouds-in-the-sky-online-619.html", text); break;

        case 'marvel':
        case 'captainamerica':
          if (!text1 || !text2) return await sock.sendMessage(jid, { text: font(`❌ Pour cette commande, veuillez fournir deux textes séparés par un "|" (Ex: .${command} Petit Texte | Grand Texte)`, 'bold') });
          const url = command === 'marvel' ? "https://en.ephoto360.com/create-thor-logo-style-text-effects-online-for-free-796.html" : "https://en.ephoto360.com/create-a-cinematic-captain-america-text-effect-online-715.html";
          result = await mumaker.ephoto(url, [text1, text2]);
          break;
        
        default:
          throw new Error('Type de textmaker non reconnu.');
      }

      if (!result || !result.image) {
        throw new Error('L\'API n\'a pas retourné d\'URL d\'image.');
      }

      const response = await axios.get(result.image, { responseType: 'arraybuffer' });
      
      const captionText = 
                          `${font('EFFET')} ${font(command.toUpperCase())}\n` +
                          
                          `${font('ᴍᴀᴋᴇ ʙʏ ꜱᴛᴇᴘʜᴅᴇᴠ')}`;

      await sock.sendMessage(jid, { 
        image: response.data,
        caption: captionText
      });

    } catch (error) {
      console.error(`Erreur dans la commande '${command}':`, error);
      const errorText = '╭─❖ ' + font('ERREUR TEXTMAKER') + '\n' +
                        '╰─❖ ' + font('Impossible de générer une image', 'smallcaps');
      await sock.sendMessage(jid, { text: errorText });
    }
  }
};