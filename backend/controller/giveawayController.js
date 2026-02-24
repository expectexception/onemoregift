const Giveaway = require("../model/Giveaway");
const JoinedGiveaway = require("../model/JoinedGiveaways");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
// Create a new giveaway
const createGivewaway = async (req, res) => {
    try {
        const { title, description, startDate, endDate, prize, winnerCount, image, maxParticipants, prizeValue } = req.body;
        if (!title || !description || !startDate || !endDate || !prize || !winnerCount || !maxParticipants) {
            return res.status(400).json({ error: true, msg: "All input is required" });
        }
        dayjs.extend(utc);
        dayjs.extend(timezone);

        const start = dayjs.tz(`${startDate}`, "Asia/Kolkata").toDate();
        const end = dayjs.tz(`${endDate}`, "Asia/Kolkata").toDate();
        const giveaway = await Giveaway.create({
            title,
            description,
            startDate: start,
            endDate: end,
            prize,
            winnerCount,
            maxParticipants,
            prizeValue,
            image,
            participants: [], // Ensure these are empty arrays by default
            winners: []
        });
        return res.status(200).json({ error: false, giveaway });

    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};
//Edit a giveaway
const editGiveaway = async (req, res) => {
    try {
        const { title, description, startDate, endDate, prize, winnerCount, image, maxParticipants, prizeValue } = req.body;
        dayjs.extend(utc);
        dayjs.extend(timezone);

        const start = dayjs.tz(`${startDate}`, "Asia/Kolkata").toDate();
        const end = dayjs.tz(`${endDate}`, "Asia/Kolkata").toDate();
        const giveaway = await Giveaway.findByIdAndUpdate(req.params.id, {
            title,
            description,
            startDate: start,
            endDate: end,
            prize,
            winnerCount,
            maxParticipants,
            prizeValue,
            image
        }, { new: true });
        return res.status(200).json({ error: false, giveaway });

    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};
//Delete a giveaway
const deleteGiveaway = async (req, res) => {
    try {
        const giveaway = await Giveaway.findByIdAndDelete(req.params.id);
        const joinedGiveaways = await JoinedGiveaway.deleteMany({ giveaway: req.params.id });
        return res.status(200).json({ error: false, msg: "Giveaway deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};
//get all giveaways
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
        const giveawaysRaw = await Giveaway.find({
            ...queryObj,
            endDate: { $gte: new Date(currentDate.setDate(currentDate.getDate() - 1)) }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const giveaways = giveawaysRaw.map(g => {
            g.participantCount = g.participants ? g.participants.length : 0;
            delete g.participants;
            return g;
        });

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
//get giveaways for Users
const getGiveaways = async (req, res) => {
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
        dayjs.extend(utc);
        dayjs.extend(timezone);

        // current time in IST (includes hours/minutes/seconds) so giveaways that haven't started yet
        // or have already ended are excluded
        const nowIst = dayjs().tz("Asia/Kolkata").toDate();

        const giveawaysRaw = await Giveaway.find({
            ...queryObj,
            startDate: { $lte: nowIst }, // only include giveaways that have started
            endDate: { $gte: nowIst }    // and haven't ended yet
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const giveaways = giveawaysRaw.map(g => {
            g.participantCount = g.participants ? g.participants.length : 0;
            delete g.participants;
            return g;
        });

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

//get a single giveaway
// const getSingleGiveaway = async (req, res) => {
//     try {
//         const giveaway = await Giveaway.findById(req.params.id).select("-participants");
//         return res.status(200).json({ error: false, giveaway });
//     } catch (error) {
//         return res.status(500).json({ error: true, msg: error.message });
//     }
// };
const getSingleGiveaway = async (req, res) => {
    try {
        const giveaway = await Giveaway.findById(req.params.id)
            .select("-participants")
            .lean(); // Make it plain JS object so we can add fields

        if (!giveaway) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }

        // Get participant count only
        const participantCount = await Giveaway.findById(req.params.id).countDocuments({ _id: req.params.id, participants: { $exists: true } });
        const fullDoc = await Giveaway.findById(req.params.id).select("participants");
        giveaway.participantCount = fullDoc.participants.length;

        return res.status(200).json({ error: false, giveaway });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};
//participate
const participate = async (req, res) => {
    try {
        const giveaway = await Giveaway.findById(req.params.id);
        if (!giveaway) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }

        dayjs.extend(utc);
        dayjs.extend(timezone);

        // current time in IST (includes hours/minutes/seconds)
        const nowIst = dayjs().tz("Asia/Kolkata");
        // giveaway end time converted to IST
        const giveawayEndIst = dayjs(giveaway.endDate).tz("Asia/Kolkata");

        // if current IST is after or equal to the giveaway end IST, block participation
        if (nowIst.isAfter(giveawayEndIst) || nowIst.isSame(giveawayEndIst)) {
            return res.status(200).json({ error: true, msg: "This giveaway has ended" });
        }

        let userId = req.user.data._id;
        if (giveaway.maxParticipants && giveaway.participants.length >= giveaway.maxParticipants) {
            return res.status(200).json({ error: true, msg: "Maximum participants limit reached" });
        }

        if (giveaway.participants.includes(userId)) {
            return res.status(200).json({ error: true, msg: "You have already participated in this giveaway" });
        }
        giveaway.participants.push(userId);
        await JoinedGiveaway.create({ user: userId, giveaway: giveaway._id });
        await giveaway.save();
        return res.status(200).json({ error: false, msg: "Participation successful" });

    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};
//Get Winners

const getWinners = async (req, res) => {
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
            ...queryObj,
            winners: { $ne: [] } // Ensure winners array is not empty
        }).select("-participants").populate({
            path: "winners",
            select: "-_id name"
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
const getWinnersForAdmin = async (req, res) => {
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
            ...queryObj,
            winners: { $ne: [] } // Ensure winners array is not empty
        }).select("-participants").populate({
            path: "winners",
            select: "_id name"
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

const setWinners = async (req, res) => {
    try {
        let id = req.params.id;
        let { winners } = req.body;
        let findGiveaway = await Giveaway.findById(id);
        if (!findGiveaway) {
            return res.status(200).json({ error: true, msg: "Giveaway not found" });
        }

        if (findGiveaway.winners.length > 0) {
            return res.status(200).json({ error: true, msg: "Winners already selected" });
        }
        let winnerCount = findGiveaway.winnerCount;
        if (winners.length > winnerCount) {
            return res.status(400).json({ error: true, msg: "Number of winners exceeds the allowed winner count" });
        }
        findGiveaway.winners = winners;
        await findGiveaway.save();
        // Update JoinedGiveaway collection to mark winners
        await JoinedGiveaway.updateMany(
            { giveaway: id, user: { $in: winners } },
            { $set: { won: true } }
        );
        return res.status(200).json({ error: false, msg: "Winners Set Successfuly.." })

    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });

    }
}
module.exports = { createGivewaway, editGiveaway, deleteGiveaway, getAllGiveaways, getSingleGiveaway, participate, getWinners, setWinners, getGiveaways, getWinnersForAdmin };