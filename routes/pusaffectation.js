const express = require('express');
const {addPUSafec,deletePUSafec} = require('../controlleurs/pusaffectation');
const router = express.Router();

router.post('/add', addPUSafec);
router.delete('/delete', deletePUSafec);
module.exports = router;
