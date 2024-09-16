const db = require('../config/db');

const addempl = (req, res) => {
    const { matricule, nom, prenom, societe, site, cin, pusAssignments, pus ,typeSIM } = req.body;
    console.log(req.body);
    
    if (!matricule || !nom || !prenom || !societe || !site || !cin || !Array.isArray(pusAssignments)) {
        return res.status(400).send("All fields are required");
    }

    // Add pus to pusAssignments if pus is provided and valid
    if (pus && pus.number && pus.type && pus.usage_type && pus.quota) {
        pusAssignments.push(pus);
    }

    // Check if pusAssignments is still empty after adding pus if necessary
    if (pusAssignments.length === 0) {
        return res.status(400).send("At least one PUS entry is required");
    }

    // Add typeSIM to societe if provided
    const finalSociete = typeSIM ? `${societe} (${typeSIM})` : societe;

    const insertEmployeeQuery = 'INSERT INTO employees (matricule, nom, prenom, societe, site, cin) VALUES (?, ?, ?, ?, ?, ?)';
    const employeeValues = [matricule, nom, prenom, societe, site, cin];

    db.query(insertEmployeeQuery, employeeValues, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }

        const employeeId = result.insertId;
        let errors = [];

        const processSinglePUS = (pusEntry, callback) => {
            const { number, type, usage_type, quota } = pusEntry;

            if (!number || !type || !usage_type || !quota) {
                return callback(new Error('PUS entry is missing required fields'));
            }

            // Check if the PUS exists in the 'pus' table
            const checkPUSQuery = 'SELECT id FROM pus WHERE number = ?';
            db.query(checkPUSQuery, [number], (err, results) => {
                if (err) {
                    console.log(err);
                    return callback(err);
                }

                if (results.length > 0) {
                    const pusId = results[0].id;

                    // Now check if the PUS is assigned in the 'pus_affectation' table and active
                    const checkPUSAffectionQuery = 'SELECT id FROM pus_affectation WHERE id_pus = ? AND active = true';
                    db.query(checkPUSAffectionQuery, [pusId], (err, results) => {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }

                        if (results.length > 0) {
                            errors.push(`PUS ${number} is already assigned and active.`);
                            return callback();
                        }

                        // If not active, update PUS values and assign it to the employee
                        const updatePUSQuery = 'UPDATE pus SET type = ?, usage_type = ?, quota = ?, societe = ? WHERE id = ?';
                        db.query(updatePUSQuery, [type, usage_type, quota, finalSociete, pusId], (err) => {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }

                            // Assign the updated PUS to the employee in 'pus_affectation' table with active = true
                            const insertPUSAffectionQuery = 'INSERT INTO pus_affectation (id_pus, id_empl, active) VALUES (?, ?, 1)';
                            db.query(insertPUSAffectionQuery, [pusId, employeeId], (err) => {
                                if (err) {
                                    console.log(err);
                                    return callback(err);
                                }
                                callback();
                            });
                        });
                    });
                } else {
                    // If the PUS does not exist in the 'pus' table, insert it as a new PUS
                    const insertPUSQuery = 'INSERT INTO pus (number, type, usage_type, quota, societe) VALUES (?, ?, ?, ?, ?)';
                    db.query(insertPUSQuery, [number, type, usage_type, quota, finalSociete], (err, result) => {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }

                        const pusId = result.insertId; // Get the pusId from the INSERT result
                        
                        // Insert the new PUS assignment in 'pus_affectation' with active = true
                        const insertPUSAffectionQuery = 'INSERT INTO pus_affectation (id_pus, id_empl, active) VALUES (?, ?, 1)';
                        db.query(insertPUSAffectionQuery, [pusId, employeeId], (err) => {
                            if (err) {
                                console.log(err);
                                return callback(err);
                            }
                            callback();
                        });
                    });
                }
            });
        };

        const processPUSAssignments = (index) => {
            if (index >= pusAssignments.length) {
                if (errors.length > 0) {
                    return res.status(400).json({ errors });
                }
                return res.status(200).json({ message: 'Employee added successfully' });
            }

            processSinglePUS(pusAssignments[index], (err) => {
                if (err) {
                    errors.push(err.message);
                }
                processPUSAssignments(index + 1);
            });
        };

        processPUSAssignments(0);
    });
};



const allEmpl = (req, res) => {
    const query = `
        SELECT employees.id, employees.matricule, employees.nom, employees.prenom,
               employees.cin, employees.site, employees.societe,  -- Include societe here
               pus.id AS pus_id, pus.number, pus.type, pus.usage_type, pus.quota, pus.societe AS pus_societe,
               pus_affectation.active
        FROM employees
        LEFT JOIN pus_affectation ON employees.id = pus_affectation.id_empl
        LEFT JOIN pus ON pus_affectation.id_pus = pus.id;
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        const groupedData = results.reduce((acc, row) => {
            const employeeId = row.id;
            if (!acc[employeeId]) {
                acc[employeeId] = {
                    id: row.id,
                    matricule: row.matricule,
                    nom: row.nom,
                    prenom: row.prenom,
                    cin: row.cin,
                    site: row.site,
                    societe: row.societe, // Add societe here
                    pus: [] 
                };
            }

            // Add the PUS info to the employee's PUS array if active
            if (row.active) {
                acc[employeeId].pus.push({
                    pus_id: row.pus_id,
                    number: row.number,
                    type: row.type,
                    usage_type: row.usage_type,
                    quota: row.quota,
                    societe: row.pus_societe // Add societe to PUS info from pus table
                });
            }

            return acc;
        }, {});

        // Convert the object back to an array of employees
        const employeesWithPus = Object.values(groupedData);

        res.status(200).json(employeesWithPus);
    });
};








const filterEmployees = (req, res) => {
    const { societe, site } = req.query;

    let query = `
    SELECT employees.*, pus.*
    FROM employees
    LEFT JOIN pus_affectation ON employees.id = pus_affectation.id_empl
    LEFT JOIN pus ON pus_affectation.id_pus = pus.id
    WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (societe) {
        query += ' AND employees.societe = ?';
        queryParams.push(societe);
    }
    
    if (site) {
        query += ' AND employees.site = ?';
        queryParams.push(site);
    }
    
    db.query(query, queryParams, (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        res.status(200).json(results);
    });
};




const getEmplById = (req, res) => {
    const { id } = req.query; 

    const query = `
    SELECT employees.*, pus.*
    FROM employees
    LEFT JOIN pus_affectation ON employees.id = pus_affectation.id_empl
    LEFT JOIN pus ON pus_affectation.id_pus = pus.id
    WHERE employees.id = ?
    `;

    db.query(query, [id], (error, results) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json(results);
    });
};


const deleteEmpl = async (req, res) => { 
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send("User IDs are required and should be an array.");
    }

    
    const updatePusStatusQuery = `
    UPDATE pus_affectation
    SET active = '0'
    WHERE id_pus IN (
        SELECT id_pus
        FROM pus_affectation
        WHERE id_empl IN (?)
    )
`;

    db.query(updatePusStatusQuery, [ids], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Failed to update PUS status.' });
        }

        
        const deleteUserQuery = 'DELETE FROM employees WHERE id IN (?)';
        db.query(deleteUserQuery, [ids], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Failed to delete employees.' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).send("No users found to delete.");
            }

            return res.status(200).json({ message: 'Users deleted and PUS status updated successfully.' });
        });
    });
};







const updateEmpl = async (req, res) => {
    const {id, matricule, nom, prenom, societe, site, cin, pusAssignments } = req.body;
    

    console.log(req.body);
   
    if (!id) {
        return res.status(400).json({ error: "Employee ID is required" });
    }
    let updateFields = [];
    let updateValues = [];

    if (matricule) {
        updateFields.push('matricule = ?');
        updateValues.push(matricule);
    }
    if (nom) {
        updateFields.push('nom = ?');
        updateValues.push(nom);
    }
    if (prenom) {
        updateFields.push('prenom = ?');
        updateValues.push(prenom);
    }
    if (societe) {
        updateFields.push('societe = ?');
        updateValues.push(societe);
    }
    if (site) {
        updateFields.push('site = ?');
        updateValues.push(site);
    }
    if (cin) {
        updateFields.push('cin = ?');
        updateValues.push(cin);
    }
    

    if (updateFields.length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
    }

    
    updateValues.push(id);

    const updateEmployeeQuery = `UPDATE employees SET ${updateFields.join(', ')} WHERE id = ?`;

    db.query(updateEmployeeQuery, updateValues, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }

        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Employee not found or no changes made" });
        }

        res.status(200).json({ message: "Employee updated successfully" });
    });
};


module.exports = { addempl , allEmpl ,  deleteEmpl , updateEmpl , getEmplById ,filterEmployees};
