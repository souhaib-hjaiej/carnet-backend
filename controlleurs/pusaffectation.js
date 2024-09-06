const db = require('../config/db');



const affectation = (req, res) => {
    const { number, type, usage_type, quota, idemp } = req.body;
    console.log(req.body);
    if (!number || !type || !usage_type || !quota || !idemp) {
        return res.status(400).send('All fields are required.');
    }


    const checkPusQuery = 'SELECT id FROM pus WHERE number = ?';


    const insertPusQuery = 'INSERT INTO pus (number, type, usage_type, quota) VALUES (?, ?, ?, ?)';

    
    const insertPusAffectationQuery = 'INSERT INTO pus_affectation (employee_id, pus_id) VALUES (?, ?)';

    
    db.query(checkPusQuery, [number], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            const pusId = results[0].id;

            
            db.query(insertPusAffectationQuery, [id, pusId], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Error inserting into pus_affectation' });
                }
                res.status(200).json({ message: 'PUS affectation successful' });
            });
        } else {
            
            db.query(insertPusQuery, [number, type, usage_type, quota], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: 'Error inserting into pus' });
                }

                const pusId = result.insertId; 

             
                db.query(insertPusAffectationQuery, [idemp, pusId], (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: 'Error inserting into pus_affectation' });
                    }
                    res.status(200).json({ message: 'PUS affectation successful' });
                });
            });
        }
    });
};


module.exports = {affectation};
