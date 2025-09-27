const fs = require('fs');
const path = require('path');

class UserConfigManager {
    constructor() {
        this.configFile = './userConfigs.json';
        this.configs = this.loadConfigs();
    }

    loadConfigs() {
        if (fs.existsSync(this.configFile)) {
            try {
                return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
            } catch (error) {
                console.error('Erreur lecture config utilisateurs:', error);
                return {};
            }
        }
        return {};
    }

    saveConfigs() {
        try {
            fs.writeFileSync(this.configFile, JSON.stringify(this.configs, null, 2));
        } catch (error) {
            console.error('Erreur sauvegarde config utilisateurs:', error);
        }
    }

    getUserConfig(phoneNumber) {
        if (!this.configs[phoneNumber]) {
            this.configs[phoneNumber] = {
                prefix: '!',
                botName: 'Multi-Bot',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.saveConfigs();
        }
        return this.configs[phoneNumber];
    }

    updateUserConfig(phoneNumber, updates) {
        const config = this.getUserConfig(phoneNumber);
        Object.assign(config, updates, {
            updatedAt: new Date().toISOString()
        });
        this.saveConfigs();
        return config;
    }

    setPrefix(phoneNumber, newPrefix) {
        
        if (!newPrefix || newPrefix.length > 3) {
            throw new Error('Le préfixe doit faire entre 1 et 3 caractères');
        }
        
        
        const forbidden = /[\s\n\r\t]/;
        if (forbidden.test(newPrefix)) {
            throw new Error('Le préfixe ne peut pas contenir d\'espaces');
        }

        return this.updateUserConfig(phoneNumber, { prefix: newPrefix });
    }

    setBotName(phoneNumber, newName) {
        
        if (!newName || newName.length < 2 || newName.length > 30) {
            throw new Error('Le nom doit faire entre 2 et 30 caractères');
        }

        
        const cleanName = newName.replace(/[^\w\s\-_.]/g, '').trim();
        if (cleanName.length < 2) {
            throw new Error('Le nom contient trop de caractères spéciaux');
        }

        return this.updateUserConfig(phoneNumber, { botName: cleanName });
    }

    getAllUserConfigs() {
        return this.configs;
    }

    deleteUserConfig(phoneNumber) {
        if (this.configs[phoneNumber]) {
            delete this.configs[phoneNumber];
            this.saveConfigs();
            return true;
        }
        return false;
    }
}

module.exports = new UserConfigManager();