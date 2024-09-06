const express = require('express');
const { login ,register } = require('../controlleurs/userscon');
const router = express.Router();
const app =express();




router.post("/login",login);
router.post("/register", register);
  



module.exports = router;
  