'use strict';

const SystemConfig = require('../model/SystemConfig');

const getConfigHelper = async () => {
    const configs = await SystemConfig.find({});
    const showUpcoming = configs.find(c => c.key === 'showUpcoming')?.value ?? true;
    const showEnded = configs.find(c => c.key === 'showEnded')?.value ?? false;
    const requireSurpriseProof = configs.find(c => c.key === 'requireSurpriseProof')?.value ?? true;
    const requireMomentProof = configs.find(c => c.key === 'requireMomentProof')?.value ?? true;

    // Homepage section visibility (DB-backed, default visible)
    const homeShowSteps = configs.find(c => c.key === 'homeShowSteps')?.value ?? true;
    const homeShowStats = configs.find(c => c.key === 'homeShowStats')?.value ?? true;
    const homeShowMoments = configs.find(c => c.key === 'homeShowMoments')?.value ?? true;
    const homeShowShop = configs.find(c => c.key === 'homeShowShop')?.value ?? true;

    // Env-driven flags (require a server restart to change, unlike the DB-backed ones above)
    const shopEnabled = (process.env.ENABLE_SHOP || 'true').toLowerCase() !== 'false';
    const realPaymentsEnabled = (process.env.ENABLE_REAL_PAYMENTS || 'false').toLowerCase() === 'true';
    const paymentsProvider = (process.env.PAYMENTS_PROVIDER || 'sandbox').toLowerCase();

    return {
        showUpcoming, showEnded, requireSurpriseProof, requireMomentProof,
        homeShowSteps, homeShowStats, homeShowMoments, homeShowShop,
        shopEnabled, realPaymentsEnabled, paymentsProvider,
    };
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
        const {
            showUpcoming, showEnded, requireSurpriseProof, requireMomentProof,
            homeShowSteps, homeShowStats, homeShowMoments, homeShowShop,
        } = req.body;

        // Persist any homepage section toggle that was provided
        const homeToggles = { homeShowSteps, homeShowStats, homeShowMoments, homeShowShop };
        for (const [key, value] of Object.entries(homeToggles)) {
            if (value !== undefined) {
                await SystemConfig.findOneAndUpdate(
                    { key },
                    { value: !!value },
                    { upsert: true, new: true }
                );
            }
        }

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

        if (requireSurpriseProof !== undefined) {
            await SystemConfig.findOneAndUpdate(
                { key: 'requireSurpriseProof' },
                { value: !!requireSurpriseProof },
                { upsert: true, new: true }
            );
        }

        if (requireMomentProof !== undefined) {
            await SystemConfig.findOneAndUpdate(
                { key: 'requireMomentProof' },
                { value: !!requireMomentProof },
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
