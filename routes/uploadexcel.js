const express = require('express');
const { upload, handleFileUpload ,handleemployee} = require('../controlleurs/uploadexcel'); 
const router = express.Router();
const {superadminAuth}  = require('../middleware/authmiddleware');

router.post('/uploadpus', upload.single('file'), handleFileUpload);
router.post('/uploadempl', upload.single('file'), handleemployee);

module.exports = router;
