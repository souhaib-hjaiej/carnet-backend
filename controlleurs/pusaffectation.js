const db = require('../config/db');

const addPUSafec = (req, res) => {
    const { idempl, number, type, usage_type, typeSIM, quota } = req.body; // Adjusted to match the new column name
    console.log(req.body);

    if (!idempl || !number || !type || !usage_type || !typeSIM || !quota) {
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
            // Insert new PU with the `typeSIM` value added to `societe` column
            const insertPUSQuery = 'INSERT INTO pus (number, type, usage_type, societe, quota) VALUES (?, ?, ?, ?, ?)';
            db.query(insertPUSQuery, [number, type, usage_type, typeSIM, quota], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Error inserting new PU");
                }

                const pusId = result.insertId;

                // Insert into pus_affectation
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

const deletePUSafec = (req, res) => {
    const { id_pus, id_empl } = req.body;
    console.log(req.body);

    if (!id_pus || !id_empl) {
        return res.status(400).send("PU ID and Employee ID are required");
    }

    // Update the active status in pus_affectation
    const updatePUSAffectionQuery = 'UPDATE pus_affectation SET active = false WHERE id_pus = ? AND id_empl = ? AND active = true';
    db.query(updatePUSAffectionQuery, [id_pus, id_empl], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error updating PU assignment status");
        }

        if (result.affectedRows === 0) {
            return res.status(400).send("No active PU assignment found for this employee");
        }

        return res.status(200).send("PU assignment deactivated successfully");
    });
};




  


module.exports = {addPUSafec,deletePUSafec};
