const multer = require('multer');
const express = require('express');
const XLSX = require('xlsx');
const db = require('../config/db');
const fs = require('fs');




const upload = multer({ dest: 'uploads/' });



const handleFileUpload = (req, res) => {
  const filePath = req.file.path;

  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];


  const data = XLSX.utils.sheet_to_json(sheet);

  data.forEach((row) => {
    const query = 'INSERT INTO telephone (type_pus, type_telephone, quota, num) VALUES (?, ?, ?, ?)';
    const values = [row.type_pus, row.type_telephone, row.quota, row.num];
  

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Error inserting data:', err.stack);
        return;
      } 
      console.log('Data inserted successfully');
    });
  });

  
  fs.unlinkSync(filePath);
  res.send('File uploaded and data inserted into the database');
};

module.exports = { upload, handleFileUpload };
