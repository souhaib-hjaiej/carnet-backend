const multer = require('multer');
const express = require('express');

const xlsx = require('xlsx'); // Import xlsx module

const db = require('../config/db');const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

const handleFileUpload = (req, res) => {
  const filePath = req.file.path;
  console.log(req.file);

  // Read the Excel file
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet to JSON
  const data = xlsx.utils.sheet_to_json(sheet);
  console.log(data);

  // Insert each row into the database
  data.forEach((row) => {
    const query = 'INSERT INTO pus (number, type, usage_type, quota, societe) VALUES (?, ?, ?, ?, ?)';
    const values = [
      row.number,            // Corresponding to 'number'
      row.type, // Corresponding to 'type'
      row.usage_type,      
      row.quota ,  
      row.societe  
    ];
   

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Error inserting data:', err.stack);
        return;
      }
      console.log('Data inserted successfully');
    });
  });

  // Remove the uploaded file after processing
  fs.unlinkSync(filePath);
  res.send('File uploaded and data inserted into the database');
};





const handleemployee = (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Read the uploaded Excel file
  const workbook = xlsx.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0]; // Assuming the first sheet
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

  // Collect unique PUS and employees
  const pusMap = new Map(); // Map to keep track of unique PUS
  const employeeMap = new Map(); // Map to keep track of unique employees

  jsonData.forEach(row => {
    // Collect employee data
    const employeeKey = row['matricule'];
    if (!employeeMap.has(employeeKey)) {
      employeeMap.set(employeeKey, {
        matricule: row['matricule'],
        nom: row['nom'],
        prenom: row['prenom'],
        site: row['site'],
        societe: row['societe']
      });
    }

    // Collect PUS data
    const pusKey = `${row['number']}-${row['type']}-${row['usage_type']}-${row['quota']}-${row['societe_pus']}`;
    if (!pusMap.has(pusKey)) {
      pusMap.set(pusKey, {
        number: row['number'],
        type: row['type'],
        usage_type: row['usage_type'],
        quota: row['quota'],
        societe: row['societe_pus']
      });
    }
  });

  // Insert PUS records
  const pusPromises = [];
  pusMap.forEach((pusData) => {
    const { number, type, usage_type, quota, societe } = pusData;
    pusPromises.push(
      new Promise((resolve, reject) => {
        const insertPUSQuery =
          'INSERT INTO pus (number, type, usage_type, quota, societe) VALUES (?, ?, ?, ?, ?)';
        db.query(insertPUSQuery, [number, type, usage_type, quota, societe], (err, result) => {
          if (err) return reject(err);
          resolve(result.insertId);
        });
      })
    );
  });

  Promise.all(pusPromises)
    .then(pusIds => {
      const pusIdMap = new Map();
      let index = 0;
      pusMap.forEach((_, pusKey) => {
        pusIdMap.set(pusKey, pusIds[index++]);
      });

      // Insert employee records
      const employeePromises = [];
      employeeMap.forEach((employeeData, matricule) => {
        const { nom, prenom, site, societe } = employeeData;
        employeePromises.push(
          new Promise((resolve, reject) => {
            const insertEmployeeQuery =
              'INSERT INTO employees (matricule, nom, prenom, site, societe) VALUES (?, ?, ?, ?, ?)';
            db.query(insertEmployeeQuery, [matricule, nom, prenom, site, societe], (err, result) => {
              if (err) return reject(err);
              resolve({ id: result.insertId, matricule });
            });
          })
        );
      });

      return Promise.all(employeePromises)
        .then(employeeIds => {
          // Insert PUS-affectation records
          const affectationPromises = [];
          jsonData.forEach(row => {
            const matricule = row['matricule'];
            const number = row['number'];
            const type = row['type'];
            const usage_type = row['usage_type'];
            const quota = row['quota'];
            const societe_pus = row['societe_pus'];
            const pusKey = `${number}-${type}-${usage_type}-${quota}-${societe_pus}`;
            const pusId = pusIdMap.get(pusKey);
            const employee = employeeIds.find(emp => emp.matricule === matricule);

            if (pusId && employee) {
              affectationPromises.push(
                new Promise((resolve, reject) => {
                  const insertAffectationQuery =
                    'INSERT INTO pus_affectation (id_pus, id_empl, active) VALUES (?, ?, 1)';
                  db.query(insertAffectationQuery, [pusId, employee.id], (err) => {
                    if (err) return reject(err);
                    resolve();
                  });
                })
              );
            }
          });

          return Promise.all(affectationPromises);
        });
    })
    .then(() => {
      res.status(200).json({ message: 'Data processed successfully' });
      console.log('workked');
    })
    .catch((err) => {
      res.status(500).json({ error: err.message });
    });
};





module.exports = { upload, handleFileUpload ,handleemployee };
