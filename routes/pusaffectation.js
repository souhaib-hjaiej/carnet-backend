const express = require('express');
const {addPUSafec} = require('../controlleurs/pusaffectation');
const router = express.Router();

router.post('/add', addPUSafec);

module.exports = router;
