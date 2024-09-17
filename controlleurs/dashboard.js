const db = require('../config/db');
// Get total count of PUS
const getPusCount = (req, res) => {
    const sql = 'SELECT COUNT(*) AS total FROM pus';
    
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching PUS count' });
        }
        res.json({ total: results[0].total });
    });
};

// Get count of PUS by societe
const getPusCountBySociete = (req, res) => {
    const sql = 'SELECT societe, COUNT(*) AS total FROM pus GROUP BY societe';
    
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching PUS count by societe' });
        }
        res.json(results);
    });
};
const getPusAffectationStatus = (req, res) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM pus_affectation WHERE active = 1) AS pus_affecter,
            (SELECT COUNT(*) FROM pus WHERE id NOT IN (SELECT id_pus FROM pus_affectation WHERE active = 1)) AS pus_non_affecter;
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching PUS affectation status' });
        }
        res.json(results[0]);  // Return the first row with the counts
    });
};




const getEmployeeStats = (req, res) => {
    const totalEmployeesQuery = 'SELECT COUNT(*) AS total_employees FROM employees';
    const employeesBySiteQuery = 'SELECT site, COUNT(*) AS total FROM employees GROUP BY site';
    const employeesBySocieteQuery = 'SELECT societe, COUNT(*) AS total FROM employees GROUP BY societe';

    // Execute all three queries
    db.query(totalEmployeesQuery, (err, totalResults) => {
        if (err) {
            console.error('Error fetching total employees count:', err); // Log the actual error
            return res.status(500).json({ error: 'Error fetching total employees count' });
        }

        db.query(employeesBySiteQuery, (err, siteResults) => {
            if (err) {
                console.error('Error fetching employees by site:', err); // Log the actual error
                return res.status(500).json({ error: 'Error fetching employees by site' });
            }

            db.query(employeesBySocieteQuery, (err, societeResults) => {
                if (err) {
                    console.error('Error fetching employees by societe:', err); // Log the actual error
                    return res.status(500).json({ error: 'Error fetching employees by societe' });
                }

                // Combine all results and return in a single response
                res.json({
                    total_employees: totalResults[0].total_employees,
                    employees_by_site: siteResults,
                    employees_by_societe: societeResults
                });
            });
        });
    });
};

module.exports = { getPusCount, getPusCountBySociete , getPusAffectationStatus  ,  getEmployeeStats };
