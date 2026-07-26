const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    prize: {
        type: String,
        required: true
    },
    winnerCount: {
        type: Number,
        default: 1
    },
    maxParticipants: {
        type: Number
    },
    prizeValue: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    isPaused: {
        type: Boolean,
        default: false
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    }],
    winners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    }]
}, {
    timestamps: true,
    versionKey: false
});

const Giveaway = mongoose.model('Giveaway', giveawaySchema);

module.exports = Giveaway;