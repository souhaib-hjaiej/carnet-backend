const db = require('../config/db');




const addempl = async (req, res) => {
    const { matricule, nom, prenom, societe, site, cin, pusAssignments } = req.body;

    if (!matricule || !nom || !prenom || !societe || !site || !cin || !pusAssignments || !Array.isArray(pusAssignments) || pusAssignments.length === 0) {
        return res.status(400).send("All fields are required");
    }

    const insertEmployeeQuery = 'INSERT INTO employees (matricule, nom, prenom, societe, site, cin) VALUES (?, ?, ?, ?, ?, ?)';
    const employeeValues = [matricule, nom, prenom, societe, site, cin];

    db.query(insertEmployeeQuery, employeeValues, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }

        const employeeId = result.insertId; 

        
        const processSinglePUS = (pusEntry, callback) => {
            const { number, type, usage, quota } = pusEntry;
            
            
            

            
            const checkPUSQuery = 'SELECT id FROM pus WHERE number = ?';
            db.query(checkPUSQuery, [number], (err, results) => {
                if (err) {
                    console.log(err);
                    return callback(err);
                }

                if (results.length > 0) {
                    
                    callback(null, results[0].id);
                } else {
                   
                    const insertPUSQuery = 'INSERT INTO pus (number, type, usage_type, quota) VALUES (?, ?, ?, ?)';
                    db.query(insertPUSQuery, [number, type, usage, quota], (err, result) => {
                        if (err) {
                            console.log(err);
                            return callback(err);
                        }
                        callback(null, result.insertId);
                    });
                }
            });
        };

        let pusIds = [];

        
        let processedPUSCount = 0;
        pusAssignments.forEach(pusEntry => {
            processSinglePUS(pusEntry, (err, pusId) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                
pusIds.push([employeeId, pusId]);
                processedPUSCount++;

                if (processedPUSCount === pusAssignments.length) {
                    const insertAffectationQuery = 'INSERT INTO pus_affectation (id_employe, id_pus) VALUES ?';
                    db.query(insertAffectationQuery, [pusIds], (err, result) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).json({ error: err.message });
                        }

                        return res.status(200).json({ message: 'Employee and PUS assignments added successfully!' });
                    });
                }
            });
        });
    });
};





const allEmpl = (req,res) => {
const query = `
SELECT employees.*, pus.*
FROM employees
LEFT JOIN pus_affectation ON employees.id = pus_affectation.id_employe
LEFT JOIN pus ON pus_affectation.id_pus = pus.id
`;

db.query(query, (error, results) => {
 if (error) {
    console.log(error)
     return res.status(500).json({ error: 'Failed to retrieve data' });
 }
 res.status(200).json(results);
});
};



const filterEmployees = (req, res) => {
    const { societe, site } = req.query;

    let query = `
    SELECT employees.*, pus.*
    FROM employees
    LEFT JOIN pus_affectation ON employees.id = pus_affectation.id_employe
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
    LEFT JOIN pus_affectation ON employees.id = pus_affectation.id_employe
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
    const { id } = req.query;

    if (!id) {
        return res.status(400).send("User ID is required.");
    }

    
    const deleteUserQuery = 'DELETE FROM employees WHERE id = ?';

    db.query(deleteUserQuery, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("User not found.");
        }

        return res.status(200).json({ message: 'User deleted successfully.' });
    });
};



const updateEmpl = async (req, res) => {
    const { matricule, nom, prenom, societe, site, cin, pusAssignments } = req.body;
    const { id } = req.query;

    
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
