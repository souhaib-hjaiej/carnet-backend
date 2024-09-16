const express = require('express');
const {addPus, getAllPus, deletePus, updatePus , getFilteredPus, checkPusNumbers} = require('../controlleurs/pus');
const router = express.Router();

router.post('/add', addPus);
router.post('/check', checkPusNumbers);
router.get('/all', getAllPus);
router.get('/fitrer', getFilteredPus);
router.patch('/update', updatePus); 
router.delete('/delete', deletePus); 

module.exports = router;
