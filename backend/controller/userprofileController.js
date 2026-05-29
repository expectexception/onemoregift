const Giveaway = require("../model/Giveaway");
const User = require("../model/Users");
const bcrypt = require('bcryptjs')
const myProfile = async (req, res) => {
    let userId = req.user.data._id;

    try {
        const myProfile = await User.findById(userId).select("-password -resetToken");
        const giveaways = await Giveaway.find({
            $or: [
                { participants: userId },
                { winners: userId }
            ]
        }).select('-participants');
        return res.status(200).json({ error: false, myProfile, giveaways });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};
const updateProfile = async (req, res) => {
    let userId = req.user.data._id;
    let { name, email, phone, address, avatar } = req.body;
    const normalizedPhone = (phone && phone.trim() !== "") ? phone.trim() : null;
    try {
        const updatedProfile = await User.findByIdAndUpdate(userId, { name, email, phone: normalizedPhone, address, avatar }, { new: true }).select("-password -resetToken");
        if (updatedProfile) {
            return res.status(200).json({ error: false, updatedProfile });
        }
        else {
            return res.status(200).json({ error: true, msg: "Profile not updated" });
        }
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }

}

const changePassword = async (req, res) => {
    let userId = req.user.data._id;
    let { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: true, msg: "User not found" });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: true, msg: "Old password is incorrect" });
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        return res.status(200).json({ error: false, msg: "Password changed successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
}
module.exports = { myProfile, updateProfile, changePassword }
