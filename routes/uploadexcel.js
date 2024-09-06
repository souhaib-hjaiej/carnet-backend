const express = require('express');
const { upload, handleFileUpload } = require('../controlleurs/uploadexcel'); 
const router = express.Router();
const {superadminAuth}  = require('../middleware/authmiddleware');


router.post('/upload', superadminAuth , upload.single('file'), handleFileUpload);

module.exports = router;
