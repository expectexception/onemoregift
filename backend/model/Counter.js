'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterSchema = new Schema({
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
}, { versionKey: false });

counterSchema.statics.nextSeq = async function (key) {
    const doc = await this.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return doc.seq;
};

const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;
