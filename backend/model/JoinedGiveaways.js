const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    giveaway: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Giveaway'
    },
    won: {
        type: Boolean,
        default: false
    },
},
    {
        timestamps: true,
        versionKey: false
    });

giveawaySchema.index({ user: 1, giveaway: 1 }, { unique: true });

const JoinedGiveaway = mongoose.model('JoinedGiveaway', giveawaySchema);

module.exports = JoinedGiveaway;
