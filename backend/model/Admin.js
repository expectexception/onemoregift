const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AdminSchema = new Schema({
    username: {
        type: String
    },
    email: {
        type: String,
        //    required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
const Admin = mongoose.model('admins', AdminSchema);
module.exports = Admin;