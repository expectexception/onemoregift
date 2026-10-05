const express = require('express');
const router = express.Router();
const { publicCache } = require('../middleware/publicCache');
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
router.get('/', publicCache({ anonymousOnly: true }), getGiveaways);
router.get('/winners', publicCache(), getWinners);
router.post('/winners/:id', isAdmin, setWinners);
router.post('/toggle-pause/:id', isAdmin, togglePauseGiveaway);
router.post('/draw-early/:id', isAdmin, drawEarlyGiveaway);
router.post('/reset-winners/:id', isAdmin, resetWinners);
router.delete('/:id/participant/:userId', isAdmin, removeParticipant);
router.get('/:id', publicCache({ anonymousOnly: true }), getSingleGiveaway);
router.post('/participate/:id', isAuth, participate);
module.exports = router;