const express = require('express');
const { addempl , allEmpl ,  deleteEmpl , updateEmpl , getEmplById ,filterEmployees } = require('../controlleurs/employes')





const router = express.Router();

router.post("/add", addempl );
router.patch("/update",updateEmpl );
router.get("/alluser", allEmpl );
router.get("/oneuser",  getEmplById );
router.get("/filter",  filterEmployees );
router.delete("/delete", deleteEmpl );

  




module.exports = router;
  