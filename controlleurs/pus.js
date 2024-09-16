const db = require('../config/db');

const addPus = (req, res) => {
    const { numero, type, typeUsage, quota, typeSIM } = req.body;
   // console.log(req.body);

    // Check if all required fields are provided
    if (!numero || !type || !typeUsage || !quota || !typeSIM) {
        return res.status(400).send('All fields are required.');
    }

    // SQL query including the new field
    const query = 'INSERT INTO pus (number, type, usage_type, quota, societe) VALUES (?, ?, ?, ?, ?)';
    const values = [numero, type, typeUsage, quota, typeSIM];

    // Execute the query
    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Database error occurred.' });
        }
        return res.status(201).json({ message: 'PUS added successfully!' });
    });
};

const getAllPus = (req, res) => {
    const query = `
        SELECT pus.id AS pus_id, pus.number, pus.type, pus.usage_type, pus.quota, pus.societe AS pus_societe,
               employees.id AS employee_id, employees.matricule, employees.nom, employees.prenom,
               employees.cin, employees.site, employees.societe AS employee_societe, 
               pus_affectation.active
        FROM pus
        LEFT JOIN pus_affectation ON pus.id = pus_affectation.id_pus
        LEFT JOIN employees ON pus_affectation.id_empl = employees.id;
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }

        const groupedData = results.reduce((acc, row) => {
            const pusId = row.pus_id;
            if (!acc[pusId]) {
                acc[pusId] = {
                    pus_id: row.pus_id,
                    number: row.number,
                    type: row.type,
                    usage_type: row.usage_type,
                    quota: row.quota,
                    societe: row.pus_societe, // Add societe from pus table
                    users: [] // Store users that have used this PUS
                };
            }

            // Add the user info to the PUS's user array
            if (row.employee_id) {
                acc[pusId].users.push({
                    employee_id: row.employee_id,
                    matricule: row.matricule,
                    nom: row.nom,
                    prenom: row.prenom,
                    cin: row.cin,
                    site: row.site,
                    societe: row.employee_societe, // Add employee societe
                    active: row.active // Track if the PUS is currently active for this employee
                });
            }

            return acc;
        }, {});

        // Convert the object back to an array of PUS with associated users
        const pusWithUsers = Object.values(groupedData);

        res.status(200).json(pusWithUsers);
    });
};




const getFilteredPus = (req, res) => {
    const usage_type = 'professionnelle'; 
    
    const query = `
        SELECT p.*
        FROM pus p
        LEFT JOIN pus_affectation pa ON p.id = pa.id_pus
        WHERE p.usage_type = ?
        AND (pa.id_pus IS NULL OR pa.active = 0)
        GROUP BY p.id
    `;

    db.query(query, [usage_type], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Failed to retrieve PUS records.' });
        }
        return res.status(200).json(results);
    });
};

const updatePus = (req, res) => {
    const { pus_id, number, type, usage_type, quota, societe } = req.body;

    console.log("Request Body:", req.body);

    // Check if pus_id is provided
    if (!pus_id) {
        return res.status(400).send('PUS ID is required.');
    }

    // Check if at least one field is provided to update
    if (!number && !type && !usage_type && !quota && !societe) {
        return res.status(400).send('At least one field is required to update.');
    }

    const fields = [];
    const values = [];

    // Build the query based on provided fields
    if (number) {
        fields.push('number = ?');
        values.push(number);
    }
    if (type) {
        fields.push('type = ?');
        values.push(type);
    }
    if (usage_type) {
        fields.push('usage_type = ?');
        values.push(usage_type);
    }
    if (quota) {
        fields.push('quota = ?');
        values.push(quota);
    }
    if (societe) {
        fields.push('societe = ?');
        values.push(societe);
    }

    // Ensure that there are fields to update
    if (fields.length === 0) {
        return res.status(400).send('No valid fields provided for update.');
    }

    // Add the pus_id to the values for the WHERE clause
    const query = `UPDATE pus SET ${fields.join(', ')} WHERE id = ?`;
    values.push(pus_id);

    // Execute the query
    db.query(query, values, (err, result) => {
        if (err) {
            console.log("Database Error:", err);
            return res.status(500).json({ error: 'Database error occurred.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'PUS not found.' });
        }
        return res.status(200).json({ message: 'PUS updated successfully!' });
    });
};



const deletePus = (req, res) => {
    const { ids } = req.body;
  

   
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send('A non-empty array of IDs is required to delete.');
    }

    
    const query = 'DELETE FROM pus WHERE id IN (?)';

    
    db.query(query, [ids], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Database error occurred.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No PUS records found with the provided IDs.' });
        }
        return res.status(200).json({ message: 'PUS records deleted successfully!' });
    });
};

const checkPusNumbers = (req, res) => {
    const pusList = req.body.pusNumbers; // Ensure you pass the pusNumbers array in the request body
    console.log('PUS List:', pusList);

    // Validate that pusList is an array and not empty
    if (!Array.isArray(pusList) || pusList.length === 0) {
        return res.status(400).json({ error: 'Please provide a valid list of PUS numbers.' });
    }

    // Filter out 'personnelle' PUS types from the list
    const professionalPusList = pusList.filter(pus => pus.type === 'professionnelle');
    console.log('Filtered PUS List (Professionnelle only):', professionalPusList);

    // Check if the filtered list is empty
    if (professionalPusList.length === 0) {
        return res.status(200).json({ message: 'No professional PUS numbers to check.' });
    }

    // Query to check if the professional PUS numbers exist in the 'pus' table
    const checkPusQuery = 'SELECT number FROM pus WHERE number IN (?)';

    db.query(checkPusQuery, [professionalPusList.map(pus => pus.number)], (err, pusResults) => {
        if (err) {
            console.error('Database query error:', err); // Log the error details
            return res.status(500).json({ error: 'Error checking PUS numbers in the database.' });
        }

        // Extract existing PUS numbers from the result
        const existingPusNumbers = pusResults.map(pus => pus.number);
        console.log('Existing PUS numbers:', existingPusNumbers);

        // Filter out the PUS numbers that are missing from the database
        const missingPus = professionalPusList.filter(pus => !existingPusNumbers.includes(pus.number));
        console.log('Missing PUS of type "professionnelle":', missingPus);

        // Return the missing professional PUS numbers in the response
        return res.status(200).json({
            message: 'Missing professional PUS numbers checked.',
            missingPus // Only professional numbers that are not found in the 'pus' table
        });
    });
};





    



module.exports = {addPus, getAllPus, deletePus, updatePus , getFilteredPus ,checkPusNumbers };
