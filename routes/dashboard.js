const express = require('express');
const {getPusCountBySociete,getPusCount,getPusAffectationStatus,getEmployeeStats} = require('../controlleurs/dashboard');
const router = express.Router();


router.get('/count', getPusCount);
router.get('/count/societe', getPusCountBySociete);
router.get('/count/affectation', getPusAffectationStatus);
router.get('/count/employee', getEmployeeStats);

 


module.exports = router
