const Giveaway = require("../model/Giveaway");
const JoinedGiveaway = require("../model/JoinedGiveaways");
const { getConfigHelper } = require("./configController");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");


dayjs.extend(utc);
dayjs.extend(timezone);
const jwt = require("jsonwebtoken");

const toPositiveInt = (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
};

const combineDateAndTime = (date, time) => {
    const normalizedDate = String(date || "").trim();
    const normalizedTime = String(time || "").trim();

    if (normalizedDate && normalizedTime && /^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
        return `${normalizedDate} ${normalizedTime}`;
    }

    return normalizedDate;
};

const parseGiveawayDates = (startDate, endDate) => {
    const start = dayjs.tz(`${startDate}`, "Asia/Kolkata");
    const end = dayjs.tz(`${endDate}`, "Asia/Kolkata");
    const nowIst = dayjs().tz("Asia/Kolkata");

    if (!start.isValid() || !end.isValid()) {
        return { error: "Start and end dates must be valid" };
    }
    if (start.isBefore(nowIst)) {
        return { error: "Start date and time cannot be in the past (IST)" };
    }
    if (!end.isAfter(start)) {
        return { error: "End date must be after start date" };
    }

    return { start: start.toDate(), end: end.toDate() };
};

const normalizeGiveawayInput = (body) => {
    const { title, description, startDate, startTime, endDate, endTime, prize, image, prizeValue } = body;
    const winnerCount = toPositiveInt(body.winnerCount);
    const maxParticipants = toPositiveInt(body.maxParticipants);

    if (!title || !description || !startDate || !endDate || !prize || !winnerCount || !maxParticipants) {
        return { error: "All input is required" };
    }
    if (winnerCount > maxParticipants) {
        return { error: "Winner count cannot exceed participant cap" };
    }

    const dates = parseGiveawayDates(
        combineDateAndTime(startDate, startTime),
        combineDateAndTime(endDate, endTime)
    );
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
const getGiveaways = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        let queryObj = {};
        if (req.query.title) {
            queryObj.title = { $regex: new RegExp(req.query.title, 'i') };
        }

        const nowIst = dayjs().tz('Asia/Kolkata').toDate();
        const config = await getConfigHelper();
        const { showUpcoming, showEnded } = config;

        // Build visible filter
        const orConds = [
            // Always include live (active)
            { startDate: { $lte: nowIst }, endDate: { $gte: nowIst } }
        ];
        if (showUpcoming) {
            orConds.push({ startDate: { $gt: nowIst } });
        }
        if (showEnded) {
            orConds.push({ endDate: { $lt: nowIst } });
        }
        const visibleFilter = { ...queryObj, $or: orConds };

        // Fetch visible giveaways
        const giveawaysRaw = await Giveaway.find(visibleFilter)
            .populate({
                path: 'winners',
                select: '_id name'
            })
            .sort({ startDate: 1 })     // upcoming first, then active by start time
            .skip(skip)
            .limit(limit)
            .lean();


        const authHeader = req.header("Authorization");
        const cookieToken = req.cookies?.user_token;
        const cleanToken = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : cookieToken;
        let userId = null;
        if (cleanToken) {
            try {
                const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
                if (decoded?.data?._id) {
                    userId = decoded.data._id;
                }
            } catch (err) {
                // Ignore token decode error
            }
        }

        const now = dayjs().tz('Asia/Kolkata');

        const giveaways = giveawaysRaw.map(g => {
            const start = dayjs(g.startDate).tz('Asia/Kolkata');
            const end = dayjs(g.endDate).tz('Asia/Kolkata');

            let status;
            if (now.isBefore(start)) {
                status = 'upcoming';
            } else if (now.isAfter(end) || now.isSame(end)) {
                status = 'ended';
            } else {
                status = 'active';
            }

            g.participantCount = g.participants ? g.participants.length : 0;
            g.status = status;
            if (userId && g.participants) {
                g.joined = g.participants.some(p => String(p) === String(userId));
            } else {
                g.joined = false;
            }
            delete g.participants;
            return g;
        });

        const total = await Giveaway.countDocuments(visibleFilter);

        return res.status(200).json({ error: false, data: giveaways, total });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: true, msg: 'Some Error occurred' });
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
        // participants stays as raw ObjectIds — populating names decrypted every
        // participant's user doc on each page view and leaked names publicly.
        const giveaway = await Giveaway.findById(req.params.id)
            .populate("winners", "name")
            .lean(); // Make it plain JS object so we can add fields

        if (!giveaway) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }

        giveaway.participantCount = giveaway.participants?.length || 0;

        const authHeader = req.header("Authorization");
        const cookieToken = req.cookies?.user_token;
        const cleanToken = authHeader?.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : cookieToken;
        if (cleanToken) {
            try {
                const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
                if (decoded?.data?._id) {
                    const userId = decoded.data._id;
                    giveaway.joined = giveaway.participants?.some(p => String(p._id || p) === String(userId));
                }
            } catch (err) {
                // Ignore token decode error
            }
        }

        return res.status(200).json({ error: false, giveaway });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};
//participate
const participate = async (req, res) => {
    try {
        const cfg = await getConfigHelper();
        if (!cfg.giveawaysEnabled) {
            return res.status(503).json({ error: true, msg: "Giveaway entries are temporarily closed. Please check back later." });
        }

        const giveaway = await Giveaway.findById(req.params.id);
        if (!giveaway) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }

        if (giveaway.isPaused) {
            return res.status(409).json({ error: true, msg: "This giveaway is currently paused" });
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

        const userId = req.user.data._id;
        try {
            await JoinedGiveaway.create({ user: userId, giveaway: giveaway._id });
        } catch (dupError) {
            if (dupError?.code === 11000) {
                return res.status(409).json({ error: true, msg: "You have already participated in this giveaway" });
            }
            throw dupError;
        }

        const updateQuery = {
            _id: giveaway._id,
            participants: { $ne: userId },
        };

        if (giveaway.maxParticipants && giveaway.maxParticipants > 0) {
            updateQuery[`participants.${giveaway.maxParticipants - 1}`] = { $exists: false };
        }

        const updatedGiveaway = await Giveaway.findOneAndUpdate(
            updateQuery,
            { $addToSet: { participants: userId } },
            { new: true }
        );

        if (!updatedGiveaway) {
            await JoinedGiveaway.deleteOne({ user: userId, giveaway: giveaway._id });

            const latestGiveaway = await Giveaway.findById(giveaway._id).select("participants maxParticipants");
            if (latestGiveaway?.participants?.some(participant => participant.equals(userId))) {
                return res.status(409).json({ error: true, msg: "You have already participated in this giveaway" });
            }

            return res.status(409).json({ error: true, msg: "Maximum participants limit reached" });
        }

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
            select: "_id name fullName avatar"
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

        const updated = await Giveaway.findOneAndUpdate(
            { _id: id, winners: { $size: 0 } },
            { $set: { winners } },
            { new: true }
        );

        if (!updated) {
            return res.status(409).json({ error: true, msg: "Winners have already been drawn for this giveaway" });
        }

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

        return res.status(200).json({ error: false, msg: "Winners set successfully", winners: selectedWinners });

    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });

    }
}

const togglePauseGiveaway = async (req, res) => {
    try {
        const updated = await Giveaway.findByIdAndUpdate(
            req.params.id,
            [ { $set: { isPaused: { $not: "$isPaused" } } } ],
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }
        return res.status(200).json({ error: false, msg: `Giveaway ${updated.isPaused ? "paused" : "resumed"} successfully`, isPaused: updated.isPaused });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};

const drawEarlyGiveaway = async (req, res) => {
    try {
        const nowIst = dayjs().tz("Asia/Kolkata");
        const endDate = nowIst.subtract(1, 'second').toDate();
        const updated = await Giveaway.findByIdAndUpdate(
            req.params.id,
            { $set: { endDate } },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }
        return res.status(200).json({ error: false, msg: "Giveaway closed early successfully", endDate: updated.endDate });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};

const resetWinners = async (req, res) => {
    try {
        const updated = await Giveaway.findByIdAndUpdate(
            req.params.id,
            { $set: { winners: [] } },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }

        await JoinedGiveaway.updateMany(
            { giveaway: req.params.id },
            { $set: { won: false } }
        );

        return res.status(200).json({ error: false, msg: "Winners reset successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};

const removeParticipant = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const updated = await Giveaway.findByIdAndUpdate(
            id,
            { $pull: { participants: userId, winners: userId } },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ error: true, msg: "Giveaway not found" });
        }

        await JoinedGiveaway.deleteOne({ giveaway: id, user: userId });

        return res.status(200).json({ error: false, msg: "Participant removed successfully" });
    } catch (error) {
        return res.status(500).json({ error: true, msg: error.message });
    }
};

module.exports = {
    createGiveaway,
    editGiveaway,
    deleteGiveaway,
    getAllGiveaways,
    getSingleGiveaway,
    participate,
    getWinners,
    setWinners,
    getGiveaways,
    getWinnersForAdmin,
    togglePauseGiveaway,
    drawEarlyGiveaway,
    resetWinners,
    removeParticipant
};
