const Admin = require('../model/Admin')
const Users = require('../model/Users')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Giveaway = require('../model/Giveaway')
const JoinedGiveaway = require('../model/JoinedGiveaways')
require('dotenv').config()
const JWT_SECRET = process.env.JWT_SECRET
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
const ADMIN_COOKIE_NAME = 'admin_token';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const ROOT_ADMIN_EMAILS = (process.env.ROOT_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());

const adminCookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SECURE ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
};

const setAdminCookie = (res, token) => {
    res.cookie(ADMIN_COOKIE_NAME, token, adminCookieOptions);
};

const clearAdminCookie = (res) => {
    res.clearCookie(ADMIN_COOKIE_NAME, {
        ...adminCookieOptions,
        maxAge: undefined,
    });
};

const register = async (req, res) => {
    try {
        let createAdmin = async () => {
            try {
                const salt = await bcrypt.genSalt(10);
                const secPass = await bcrypt.hash(req.body.password, salt);
                // Create a new user
                const newAdmin = await Admin.create({
                    username: req.body.username,
                    email: req.body.email,
                    password: secPass,
                    isAdmin: true,
                    role: req.body.role
                });
                const data = {
                    user: {
                        id: newAdmin.id,
                        email: newAdmin.email,
                        isAdmin: newAdmin.isAdmin,
                        role: newAdmin.role
                    },
                };

                const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: '1d' });
                return res.status(200).json({ error: false, authtoken, role: req.body.role });

            } catch (error) {
                return res.status(500).json({ error: true, msg: "Some Error occured" });

            }

        }
        let tokenExists = req.headers.authorization ? true : false
        //check email
        let { email, password, username } = req.body
        if (!email || !password) {
            return res.status(400).json({ error: true, msg: "Email, Username, Password required." })
        }

        if (!tokenExists) {
            const isRootEmail = ROOT_ADMIN_EMAILS.includes(email.toLowerCase());
            const isAdminExists = await Admin.collection.countDocuments({})
            if (isAdminExists == 0 || isRootEmail) {
                createAdmin()
            }
            else return res.status(400).json({ error: true, msg: "Admin already exists" })
        }
        else {
            let token = req.headers.authorization.split(" ")[1]
            const verify = jwt.verify(token, JWT_SECRET);
            let userId = verify.user.id
            const isAdmin = verify.user.isAdmin
            if (!isAdmin) {
                return res.status(400).json({ error: true, msg: "You are not an Admin" })
            }
            let findAdmin = await Admin.findOne({ email: email })
            if (findAdmin) {
                return res.status(400).json({ error: true, msg: "Email Exists" })
            }
            createAdmin()
        }

    } catch (error) {
        // console.error(error);
        return res.status(500).json({ error: true, msg: "Some Error occured" });
    }
}
const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        let user = await Admin.findOne({ email: email })
        if (!user) {
            return res.status(401).json({ error: true, msg: "Please try to login with correct credentials" });
        }
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            return res
                .status(401)
                .json({ error: true, msg: "Please try to login with correct credentials" });
        }
        const data = {
            user: {
                id: user.id,
                isAdmin: user.isAdmin,
                email: user.email
            },
        };
        const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: '1d' });
        setAdminCookie(res, authtoken);
        res.json({ error: false, authtoken });
        // res.status(200).json({ error: false, email, password })
    } catch (error) {
        res.status(400).json({ error: true, msg: "Something went wrong..!" })

    }
}

const me = async (req, res) => {
    try {
        return res.status(200).json({
            error: false,
            user: {
                id: req.user.id,
                email: req.user.email,
                isAdmin: req.user.isAdmin,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: true, msg: 'Failed to fetch admin session' });
    }
}

const logout = async (req, res) => {
    clearAdminCookie(res);
    return res.status(200).json({ error: false, msg: 'Admin logged out successfully' });
}

const allUsers = async (req, res) => {
    try {
        let queryObj = {}
        let { email, phone, blocked } = req.query;

        if (blocked) {
            queryObj.blocked = blocked
        }
        if (email) {
            queryObj.email = email
        }
        if (phone) {
            queryObj.phone = phone
        }

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const total = await Users.countDocuments(queryObj);
        let users = await Users.find(queryObj).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-password");
        return res.status(200).json({ error: false, data: users, total: total })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: true, msg: "Something went wrong." })

    }
}

const banUser = async (req, res) => {
    try {
        let { userId } = req.body
        if (!userId || userId == "") {
            return res.status(400).json({ error: true, msg: "Something went wrong.." })
        }
        let findUser = await Users.findById(userId);
        if (findUser) {
            let updateUser = await Users.findByIdAndUpdate(userId, { blocked: true }, { new: true });
            return res.status(200).json({ error: false, msg: "User blocked" })
        }
        return res.status(400).json({ error: true, msg: "Something went wrong.." })


    } catch (error) {
        return res.status(400).json({ error: true, msg: "Something went wrong.." })

    }
}

const unBanUser = async (req, res) => {
    try {
        let { userId } = req.body
        if (!userId || userId == "") {
            return res.status(400).json({ error: true, msg: "Something went wrong.." })
        }
        let findUser = await Users.findById(userId);
        if (findUser) {
            let updateUser = await Users.findByIdAndUpdate(userId, { blocked: false }, { new: true });
            return res.status(200).json({ error: false, msg: "User UnBlocked" })
        }
        return res.status(400).json({ error: true, msg: "Something went wrong.." })


    } catch (error) {
        return res.status(400).json({ error: true, msg: "Something went wrong.." })

    }
}
const delUser = async (req, res) => {
    try {
        let { userId } = req.body
        if (!userId || userId == "") {
            return res.status(400).json({ error: true, msg: "Something went wrong.." })
        }
        let findUser = await Users.findById(userId);
        if (findUser) {
            let updateUser = await Users.findByIdAndDelete(userId);
            if (updateUser) {
                return res.status(200).json({ error: false, msg: "User Deleted.." })
            }
        }
        return res.status(400).json({ error: true, msg: "Something went wrong.." })


    } catch (error) {
        return res.status(400).json({ error: true, msg: "Something went wrong.." })

    }
}
const adminHome = async (req, res) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [users, giveaways, blockedUsers, googleUsers, recentUsers, recentParticipations, topGiveaways] = await Promise.all([
            Users.countDocuments({}),
            Giveaway.countDocuments({}),
            Users.countDocuments({ blocked: true }),
            Users.countDocuments({ isGoogleAuth: true }),
            Users.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            JoinedGiveaway.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            Giveaway.find({}).sort({ 'participants.length': -1 }).limit(5).select('title participants')
        ]);

        // Transform topGiveaways to include the count explicitly
        const formattedTopGiveaways = topGiveaways.map(g => ({
            _id: g._id,
            title: g.title,
            participantCount: g.participants ? g.participants.length : 0
        })).sort((a, b) => b.participantCount - a.participantCount);

        return res.status(200).json({
            error: false,
            users,
            giveaways,
            blockedUsers,
            googleUsers,
            recentUsers,
            recentParticipations,
            topGiveaways: formattedTopGiveaways
        });
    } catch (error) {
        console.error("Admin dashboard error:", error);
        return res.status(500).json({ error: true, msg: "Something went wrong.." });
    }
}
const updateUser = async (req, res) => {
    try {
        let { userId } = req.params;
        let { name, email, phone, password } = req.body;
        if (!userId) {
            return res.status(400).json({ error: true, msg: "UserId required" });
        }
        let findUser = await Users.findById(userId);
        if (findUser) {
            let updateData = { name, email, phone };
            if (password && password.trim() !== "") {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(password, salt);
            }
            await Users.findByIdAndUpdate(userId, updateData, { new: true });
            return res.status(200).json({ error: false, msg: "User updated" });
        }
        return res.status(400).json({ error: true, msg: "User not found" });

    } catch (error) {
        console.error("Update user error:", error);
        return res.status(500).json({ error: true, msg: "Internal server error" });
    }
}

const changeAdminPassword = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: true, msg: "Current and new password required" });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ error: true, msg: "Admin account not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ error: true, msg: "Incorrect current password" });
        }

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        return res.status(200).json({ error: false, msg: "Password updated successfully" });
    } catch (error) {
        console.error("Admin password change error:", error);
        return res.status(500).json({ error: true, msg: "Internal server error" });
    }
}

const getUserById = async (req, res) => {
    try {
        let { userId } = req.params;
        if (!userId) {
            return res.status(200).json({ error: true, msg: "UserId is required.." })
        }
        let getUser = await Users.findById(userId).select('-password');
        let joinedGiveaways = await JoinedGiveaway.countDocuments({ user: userId });
        let wonGiveaways = await JoinedGiveaway.countDocuments({ user: userId, won: true });
        return res.status(200).json({ error: false, data: getUser, joinedGiveaways, wonGiveaways });
    } catch (error) {
        return res.status(200).json({ error: true, msg: "Something went wrong.." })
    }
}
const getAllGiveaways = async (req, res) => {
    try {
        // Get the `page` and `limit` query parameters, with defaults if not provided
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Optional filtering by `name`, if desired (similar to `getTasks`)
        let queryObj = {};
        if (req.query.title) {
            queryObj.title = { $regex: new RegExp(req.query.title, "i") };
        }

        // Get total count of giveaways for pagination metadata
        const total = await Giveaway.countDocuments(queryObj);

        // Fetch the giveaways with pagination
        const currentDate = new Date();
        const giveaways = await Giveaway.find({
            ...queryObj
        }).sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Return the paginated data along with metadata
        return res.status(200).json({
            error: false,
            data: giveaways,
            total
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: true, msg: "Some Error occurred" });
    }
};

const signleGiveaway = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Giveaway.findById(id)
            .populate('participants', '-password')
            .populate('winners', '-password');
        if (data) {
            // participantCount is the length of the participants array
            // Add participantCount inside the data object
            const participantCount = data.participants ? data.participants.length : 0;
            const dataWithCount = {
                ...data.toObject(),
                participantCount
            };

            return res.status(200).json({ error: false, data: dataWithCount });
        } else {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }

    } catch (error) {
        return res.status(500).json({ error: true, msg: "Something went wrong.." })

    }
}



const getPublicStats = async (req, res) => {
    try {
        const now = new Date();
        const activeGiveaways = await Giveaway.countDocuments({
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        // Get total winners across all giveaways
        const giveawaysWithWinners = await Giveaway.find({ winners: { $exists: true, $ne: [] } });
        const totalWinners = giveawaysWithWinners.reduce((sum, g) => sum + (g.winners ? g.winners.length : 0), 0);

        // Get total prize value
        const allGiveaways = await Giveaway.find({});
        const totalPrizeValue = allGiveaways.reduce((sum, g) => sum + (g.prizeValue || 0), 0);

        return res.status(200).json({
            error: false,
            activeGiveaways,
            totalWinners,
            totalPrizeValue,
            verifiedLegit: 100
        });
    } catch (error) {
        console.error("Stats Error:", error);
        return res.status(500).json({ error: true, msg: "Failed to fetch stats" });
    }
}

const clearParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const giveaway = await Giveaway.findById(id);
        if (!giveaway) return res.status(404).json({ error: true, msg: "Giveaway not found" });

        // Remove from JoinedGiveaway collection
        await JoinedGiveaway.deleteMany({ giveaway: id });

        // Clear participants array in Giveaway
        giveaway.participants = [];
        await giveaway.save();

        return res.status(200).json({ error: false, msg: "Participants cleared successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
}

const clearAllJoined = async (req, res) => {
    try {
        // Warning: This clears ALL participations across ALL giveaways
        await JoinedGiveaway.deleteMany({});
        await Giveaway.updateMany({}, { $set: { participants: [], winners: [] } });
        await JoinedGiveaway.updateMany({}, { $set: { won: false } });

        return res.status(200).json({ error: false, msg: "All entries cleared system-wide" });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
}

module.exports = {
    register,
    login,
    allUsers,
    banUser,
    unBanUser,
    delUser,
    adminHome,
    updateUser,
    getUserById,
    getAllGiveaways,
    signleGiveaway,
    me,
    logout,
    getPublicStats,
    clearParticipants,
    clearAllJoined,
    changeAdminPassword
}