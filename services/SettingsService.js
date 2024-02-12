import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import Settings from "../models/settings.js";

export default class SettingsService {
    static model = Settings;
    
    static async setCartSettings (settingName, settingsData) {
        const isSettingExists = await this.getOne({name: settingName})
        if (!isSettingExists) throw new NotFoundError(`Settings name (${settingName}) not found`)
        settingsData = settingsData.replace(/'/g, '"').replace(/\s/g, '')
        const updateSettings = await this.updateSettings(settingName, settingsData);
        if (!updateSettings) throw new BadRequestError("Error updating record");
        return {
            message: 'Settings updated successfully',
            data: updateSettings
        };
    }
    
    static async createSettings() {
        let message = 'No new settings data to create' 
        const settingsObject = [{
            name: 'cart',
            value: 'sample data'
        }]
        let i = 0;
        for (const setting of settingsObject) {
            const isSettingExists = await this.getOne({name: setting.name})
            if (!isSettingExists) {
                let settingsData = new Settings(setting)
                await settingsData.save();
                i++;
            }
        }
        if (i > 0) {
            message = `${i} Settings data created successfully` 
        }
        return {
            message: message
        }
    }    

    static async updateSettings(fieldName, settingsData) {
        const updateSettings = await this.model.findOneAndUpdate({name: fieldName}, {value: settingsData}, {new: true});
        return updateSettings || false;
    }

    static async getOne(filterQuery) {
        const cart = await this.model.findOne(filterQuery)
        return cart || false;
    }
}