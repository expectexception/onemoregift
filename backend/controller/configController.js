'use strict';

const SystemConfig = require('../model/SystemConfig');

const getConfigHelper = async () => {
    const configs = await SystemConfig.find({});
    const showUpcoming = configs.find(c => c.key === 'showUpcoming')?.value ?? true;
    const showEnded = configs.find(c => c.key === 'showEnded')?.value ?? false;
    return { showUpcoming, showEnded };
};

const getPublicConfig = async (req, res) => {
    try {
        const config = await getConfigHelper();
        return res.status(200).json({ error: false, config });
    } catch (error) {
        console.error('Failed to get public config:', error);
        return res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const getAdminConfig = async (req, res) => {
    try {
        const config = await getConfigHelper();
        return res.status(200).json({ error: false, config });
    } catch (error) {
        console.error('Failed to get admin config:', error);
        return res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

const updateConfig = async (req, res) => {
    try {
        const { showUpcoming, showEnded } = req.body;

        if (showUpcoming !== undefined) {
            await SystemConfig.findOneAndUpdate(
                { key: 'showUpcoming' },
                { value: !!showUpcoming },
                { upsert: true, new: true }
            );
        }

        if (showEnded !== undefined) {
            await SystemConfig.findOneAndUpdate(
                { key: 'showEnded' },
                { value: !!showEnded },
                { upsert: true, new: true }
            );
        }

        const config = await getConfigHelper();
        return res.status(200).json({ error: false, config, msg: 'Config updated successfully' });
    } catch (error) {
        console.error('Failed to update config:', error);
        return res.status(500).json({ error: true, msg: 'Internal server error' });
    }
};

module.exports = {
    getConfigHelper,
    getPublicConfig,
    getAdminConfig,
    updateConfig
};
