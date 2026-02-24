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
const JoinedGiveaway = mongoose.model('JoinedGiveaway', giveawaySchema);

module.exports = JoinedGiveaway;