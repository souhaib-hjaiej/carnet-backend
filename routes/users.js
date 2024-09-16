const express = require('express');
const { login , register , getUsers ,updateUser ,deleteUsers} = require('../controlleurs/userscon');
const router = express.Router();
const app =express();




router.post("/login",login);
router.post("/register", register);
router.get("/all", getUsers);
  
router.patch('/update', updateUser);
router.delete('/delete', deleteUsers); 


module.exports = router;
  