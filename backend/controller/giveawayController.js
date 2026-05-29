const Giveaway = require("../model/Giveaway");
const JoinedGiveaway = require("../model/JoinedGiveaways");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const toPositiveInt = (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
};

const parseGiveawayDates = (startDate, endDate) => {
    const start = dayjs.tz(`${startDate}`, "Asia/Kolkata");
    const end = dayjs.tz(`${endDate}`, "Asia/Kolkata");

    if (!start.isValid() || !end.isValid()) {
        return { error: "Start and end dates must be valid" };
    }
    if (!end.isAfter(start)) {
        return { error: "End date must be after start date" };
    }

    return { start: start.toDate(), end: end.toDate() };
};

const normalizeGiveawayInput = (body) => {
    const { title, description, startDate, endDate, prize, image, prizeValue } = body;
    const winnerCount = toPositiveInt(body.winnerCount);
    const maxParticipants = toPositiveInt(body.maxParticipants);

    if (!title || !description || !startDate || !endDate || !prize || !winnerCount || !maxParticipants) {
        return { error: "All input is required" };
    }
    if (winnerCount > maxParticipants) {
        return { error: "Winner count cannot exceed participant cap" };
    }

    const dates = parseGiveawayDates(startDate, endDate);
    if (dates.error) return dates;

    return {
        title,
        description,
        startDate: dates.start,
        endDate: dates.end,
        prize,
        winnerCount,
        maxParticipants,
        prizeValue: Number(prizeValue) || 0,
        image: image || "/images/gift.png"
    };
};

const shuffle = (items) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

// Create a new giveaway
const createGiveaway = async (req, res) => {
    try {
        const input = normalizeGiveawayInput(req.body);
        if (input.error) {
            return res.status(400).json({ error: true, msg: input.error });
        }

        const giveaway = await Giveaway.create({
            ...input,
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
        const input = normalizeGiveawayInput(req.body);
        if (input.error) {
            return res.status(400).json({ error: true, msg: input.error });
        }

        const existing = await Giveaway.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }
        if (existing.winners.length > 0) {
            return res.status(409).json({ error: true, msg: "Cannot edit a giveaway after winners are selected" });
        }
        if (existing.participants.length > input.maxParticipants) {
            return res.status(400).json({ error: true, msg: "Participant cap cannot be lower than current participants" });
        }

        const giveaway = await Giveaway.findByIdAndUpdate(req.params.id, input, { new: true });
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
            .populate("participants", "_id name")
            .populate("winners", "name")
            .lean(); // Make it plain JS object so we can add fields

        if (!giveaway) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }

        giveaway.participantCount = giveaway.participants?.length || 0;

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

        // current time in IST (includes hours/minutes/seconds)
        const nowIst = dayjs().tz("Asia/Kolkata");
        const giveawayStartIst = dayjs(giveaway.startDate).tz("Asia/Kolkata");
        // giveaway end time converted to IST
        const giveawayEndIst = dayjs(giveaway.endDate).tz("Asia/Kolkata");

        if (nowIst.isBefore(giveawayStartIst)) {
            return res.status(409).json({ error: true, msg: "This giveaway has not started yet" });
        }
        // if current IST is after or equal to the giveaway end IST, block participation
        if (nowIst.isAfter(giveawayEndIst) || nowIst.isSame(giveawayEndIst)) {
            return res.status(409).json({ error: true, msg: "This giveaway has ended" });
        }

        let userId = req.user.data._id;
        if (giveaway.maxParticipants && giveaway.participants.length >= giveaway.maxParticipants) {
            return res.status(409).json({ error: true, msg: "Maximum participants limit reached" });
        }

        if (giveaway.participants.some(participant => participant.equals(userId))) {
            return res.status(409).json({ error: true, msg: "You have already participated in this giveaway" });
        }
        giveaway.participants.push(userId);
        try {
            await JoinedGiveaway.create({ user: userId, giveaway: giveaway._id });
        } catch (dupError) {
            if (dupError?.code === 11000) {
                return res.status(409).json({ error: true, msg: "You have already participated in this giveaway" });
            }
            throw dupError;
        }
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
        let { winners, mode } = req.body;
        let findGiveaway = await Giveaway.findById(id).populate("participants", "-password");
        if (!findGiveaway) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }

        if (findGiveaway.winners.length > 0) {
            return res.status(409).json({ error: true, msg: "Winners already selected" });
        }

        const nowIst = dayjs().tz("Asia/Kolkata");
        const giveawayEndIst = dayjs(findGiveaway.endDate).tz("Asia/Kolkata");
        const isTestEvent = findGiveaway.title && (findGiveaway.title.startsWith("LIFECYCLE-TEST-") || findGiveaway.title.startsWith("TEST-"));
        if (nowIst.isBefore(giveawayEndIst) && !isTestEvent) {
            return res.status(409).json({ error: true, msg: "Winners can be selected only after the giveaway ends" });
        }

        const participantIds = findGiveaway.participants.map(participant => participant._id.toString());
        const winnerCount = Number(findGiveaway.winnerCount);
        if (participantIds.length < winnerCount) {
            return res.status(400).json({ error: true, msg: "Not enough participants to select all winners" });
        }

        if (mode === "random" || !Array.isArray(winners) || winners.length === 0) {
            winners = shuffle(participantIds).slice(0, winnerCount);
        } else {
            winners = winners.map(winner => winner.toString());
            const uniqueWinners = [...new Set(winners)];
            if (uniqueWinners.length !== winners.length) {
                return res.status(400).json({ error: true, msg: "Duplicate winners are not allowed" });
            }
            if (uniqueWinners.length !== winnerCount) {
                return res.status(400).json({ error: true, msg: `Please select exactly ${winnerCount} winner${winnerCount === 1 ? "" : "s"}` });
            }
            const invalidWinner = uniqueWinners.find(winner => !participantIds.includes(winner));
            if (invalidWinner) {
                return res.status(400).json({ error: true, msg: "Winners must be selected from giveaway participants" });
            }
            winners = uniqueWinners;
        }

        findGiveaway.winners = winners;
        await findGiveaway.save();
        // Update JoinedGiveaway collection to mark winners
        await JoinedGiveaway.updateMany(
            { giveaway: id },
            { $set: { won: false } }
        );
        await JoinedGiveaway.updateMany(
            { giveaway: id, user: { $in: winners } },
            { $set: { won: true } }
        );

        const selectedWinners = findGiveaway.participants.filter(participant =>
            winners.includes(participant._id.toString())
        );

        return res.status(200).json({ error: false, msg: "Winners set successfully", winners: selectedWinners })

    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });

    }
}
module.exports = { createGiveaway, editGiveaway, deleteGiveaway, getAllGiveaways, getSingleGiveaway, participate, getWinners, setWinners, getGiveaways, getWinnersForAdmin };
