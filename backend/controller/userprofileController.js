const Giveaway = require("../model/Giveaway");
const User = require("../model/Users");
const bcrypt = require('bcryptjs')
const { hmacHash } = require("../utils/crypto");

const formatAddress = (addressObj = {}) => {
    return [
        addressObj.line1,
        addressObj.line2,
        addressObj.city,
        addressObj.state,
        addressObj.country,
        addressObj.postalCode,
    ].map((item) => (item || "").trim()).filter(Boolean).join(", ");
};

const normalizePhone = (value) => {
    let digits = String(value || "").replace(/\D/g, "");
    // Strip country code / trunk prefix so "+91 98765 43210" doesn't get truncated to a wrong number
    if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
    if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
    return digits.slice(0, 10);
};
const isValidIndianPhone = (value) => /^[6-9]\d{9}$/.test(value);

const normalizeAddresses = (addresses = []) => {
    if (!Array.isArray(addresses)) return { addresses: [] };
    const cleaned = addresses
        .map((item) => ({
            label: (item.label || "Address").trim(),
            fullName: (item.fullName || "").trim(),
            line1: (item.line1 || "").trim(),
            line2: (item.line2 || "").trim(),
            city: (item.city || "").trim(),
            state: (item.state || "").trim(),
            // Country column removed from the UI — everything is India for now
            country: (item.country || "").trim() || "India",
            postalCode: (item.postalCode || "").trim(),
            phone: normalizePhone(item.phone),
            isDefault: Boolean(item.isDefault),
        }))
        .filter((item) => item.line1 || item.city || item.state || item.postalCode || item.phone);

    if (!cleaned.length) return { addresses: [] };

    for (const [index, item] of cleaned.entries()) {
        if (!item.fullName) {
            return { error: `Receiver name is required for address ${index + 1}` };
        }
        if (!item.line1 || !item.city || !item.state || !item.postalCode) {
            return { error: `Complete address line, city, state, and pincode for address ${index + 1}` };
        }
        if (!item.phone) {
            return { error: `Receiver phone number is required for address ${index + 1}` };
        }
        if (!isValidIndianPhone(item.phone)) {
            return { error: `Receiver phone must be a valid 10-digit Indian number for address ${index + 1}` };
        }
    }

    if (!cleaned.some((a) => a.isDefault)) {
        cleaned[0].isDefault = true;
    } else {
        let foundDefault = false;
        cleaned.forEach((item) => {
            if (item.isDefault && !foundDefault) {
                foundDefault = true;
                return;
            }
            item.isDefault = false;
        });
    }

    return { addresses: cleaned };
};

const myProfile = async (req, res) => {
    let userId = req.user.data._id;

    try {
        const myProfile = await User.findById(userId).select("-password -resetToken -loginOtp");
        if (myProfile) {
            if (!Array.isArray(myProfile.addresses) || myProfile.addresses.length === 0) {
                if (myProfile.address) {
                    myProfile.addresses = [{
                        label: "Home",
                        fullName: myProfile.name || "",
                        line1: myProfile.address,
                        line2: "",
                        city: "",
                        state: "",
                        country: "",
                        postalCode: "",
                        phone: myProfile.phone || "",
                        isDefault: true,
                    }];
                } else {
                    myProfile.addresses = [];
                }
            }
        }
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
    let { name, fullName, email, phone, address, avatar, addresses } = req.body;
    try {
        const existingUser = await User.findById(userId).select("name fullName email phone");
        if (!existingUser) {
            return res.status(404).json({ error: true, msg: "User not found" });
        }

        // Support partial updates (join flow sends only address on step 2).
        const resolvedName = typeof name === "string" ? name.trim() : existingUser.name;
        const resolvedEmail = typeof email === "string" ? email.trim().toLowerCase() : existingUser.email;

        // Addresses are validated up-front because the account phone can be adopted
        // from the default address below.
        let normalizedAddresses = null;
        if (addresses !== undefined) {
            const normalizedResult = normalizeAddresses(addresses);
            if (normalizedResult.error) {
                return res.status(400).json({ error: true, msg: normalizedResult.error });
            }
            normalizedAddresses = normalizedResult.addresses;
        }

        // An account created before the phone field existed has none saved. Rather
        // than refusing to save the address book over a field the user was never
        // asked for, inherit the receiver phone from their default address.
        const defaultAddressPhone = normalizedAddresses
            ? (normalizedAddresses.find((item) => item.isDefault) || normalizedAddresses[0] || {}).phone
            : "";
        let resolvedPhone = phone === undefined
            ? existingUser.phone
            : normalizePhone(phone);
        if (!resolvedPhone && defaultAddressPhone) {
            resolvedPhone = defaultAddressPhone;
        }

        if (!resolvedName) {
            return res.status(400).json({ error: true, msg: "Name is required" });
        }
        if (!resolvedEmail || !/^\S+@\S+\.\S+$/.test(resolvedEmail)) {
            return res.status(400).json({ error: true, msg: "A valid email is required" });
        }
        if (phone !== undefined && !resolvedPhone) {
            return res.status(400).json({ error: true, msg: "Please add your contact phone number" });
        }
        if (resolvedPhone && !isValidIndianPhone(resolvedPhone)) {
            return res.status(400).json({ error: true, msg: "Phone number must be a valid 10-digit number starting with 6-9" });
        }

        // Email/phone are encrypted at rest with random IVs, so plaintext queries never
        // match — duplicate checks must go through the deterministic hashes.
        const emailHashVal = hmacHash(resolvedEmail);
        const duplicate = await User.findOne({
            _id: { $ne: userId },
            $or: [
                { emailHash: emailHashVal },
                ...(resolvedPhone ? [{ phoneHash: hmacHash(resolvedPhone) }] : []),
            ],
        });
        if (duplicate) {
            const msg = duplicate.emailHash === emailHashVal
                ? "A user with that email already exists"
                : "This phone number is already linked to another account";
            return res.status(409).json({ error: true, msg });
        }

        const updates = {
            name: resolvedName,
            fullName: typeof fullName === "string" ? fullName.trim() : (existingUser.fullName || ""),
            email: resolvedEmail,
            phone: resolvedPhone,
        };
        if (address !== undefined) updates.address = address;
        if (avatar !== undefined) updates.avatar = avatar;
        if (normalizedAddresses) {
            updates.addresses = normalizedAddresses;
            const defaultAddress = normalizedAddresses.find((item) => item.isDefault) || normalizedAddresses[0];
            updates.address = defaultAddress ? formatAddress(defaultAddress) : "";
        }

        const updatedProfile = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        ).select("-password -resetToken -loginOtp");
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
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: true, msg: "New password must be at least 6 characters" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: true, msg: "User not found" });
        }
        const canSetFirstPassword = user.isGoogleAuth && user.localPasswordSet !== true;
        if (!canSetFirstPassword) {
            if (!oldPassword) {
                return res.status(400).json({ error: true, msg: "Old password is required" });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: true, msg: "Old password is incorrect" });
            }
        }
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.localPasswordSet = true;
        await user.save();
        return res.status(200).json({ error: false, msg: canSetFirstPassword ? "Password set successfully" : "Password changed successfully" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: true, msg: "A user with these details already exists" });
        }
        return res.status(500).json({ error: true, msg: error.message });
    }
}
module.exports = { myProfile, updateProfile, changePassword }
