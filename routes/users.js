const express = require('express');
const { login , register , getUsers } = require('../controlleurs/userscon');
const router = express.Router();
const app =express();




router.post("/login",login);
router.post("/register", register);
router.get("/all", getUsers);
  



module.exports = router;
  