const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const isAuth = require('../middleware/isAuth');
const {
    createGiveaway,
    editGiveaway,
    deleteGiveaway,
    getAllGiveaways,
    getSingleGiveaway,
    participate,
    getWinners,
    setWinners,
    getGiveaways,
    togglePauseGiveaway,
    drawEarlyGiveaway,
    resetWinners,
    removeParticipant
} = require('../controller/giveawayController');

router.post('/create-giveaway', isAdmin, createGiveaway);
router.patch('/:id', isAdmin, editGiveaway);
router.delete('/:id', isAdmin, deleteGiveaway);
router.get('/', getGiveaways);
router.get('/winners', getWinners);
router.post('/winners/:id', isAdmin, setWinners);
router.post('/toggle-pause/:id', isAdmin, togglePauseGiveaway);
router.post('/draw-early/:id', isAdmin, drawEarlyGiveaway);
router.post('/reset-winners/:id', isAdmin, resetWinners);
router.delete('/:id/participant/:userId', isAdmin, removeParticipant);
router.get('/:id', getSingleGiveaway);
router.post('/participate/:id', isAuth, participate);
module.exports = router;