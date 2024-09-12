const db = require('../config/db');

const addPUSafec = (req, res) => {
    const { idempl, number, type, usage_type, quota } = req.body;
    console.log(req.body);

    if (!idempl || !number || !type || !usage_type || !quota) {
        return res.status(400).send("User ID and PU details are required");
    }

    let errors = [];

    const checkPUSQuery = 'SELECT id FROM pus WHERE number = ?';
    db.query(checkPUSQuery, [number], (err, pusResults) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error checking PU");
        }

        if (pusResults.length > 0) {
            const pusId = pusResults[0].id;

            const checkPUSAffectionQuery = 'SELECT id FROM pus_affectation WHERE id_pus = ? AND active = true';
            db.query(checkPUSAffectionQuery, [pusId], (err, affResults) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Error checking PU affection");
                }

                if (affResults.length === 0) {
                    errors.push(`PU ${number} is not assigned`);
                    return res.status(400).json({ errors });
                } else {
                    return res.status(200).send("PU already assigned and active");
                }
            });
        } else {
            // Insert new PU and assign it
            const insertPUSQuery = 'INSERT INTO pus (number, type, usage_type, quota) VALUES (?, ?, ?, ?)';
            db.query(insertPUSQuery, [number, type, usage_type, quota], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Error inserting new PU");
                }

                const pusId = result.insertId;
                const insertPUSAffectionQuery = 'INSERT INTO pus_affectation (id_pus, id_empl, active) VALUES (?, ?, 1)';
                db.query(insertPUSAffectionQuery, [pusId, idempl], (err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("Error assigning new PU");
                    }

                    return res.status(200).send("PU assigned successfully");
                });
            });
        }
    });
};




  


module.exports = {addPUSafec};
