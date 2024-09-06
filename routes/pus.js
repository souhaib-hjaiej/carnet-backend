const express = require('express');
const {addPus, getAllPus, deletePus, updatePus } = require('../controlleurs/pus');
const router = express.Router();

router.post('/add', addPus);
router.get('/all', getAllPus);
router.patch('/update', updatePus); 
router.delete('/delete', deletePus); 

module.exports = router;
