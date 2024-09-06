const db = require('../config/db');

const addPus = (req, res) => {
    const { num, type, usage, quota } = req.body;

    if (!num || !type || !usage || !quota) {
        return res.status(400).send('All fields are required.');
    }

    const query = 'INSERT INTO pus (num, type, usage, quota) VALUES (?, ?, ?, ?)';
    const values = [num, type, usage, quota];

    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Database error occurred.' });
        }
        return res.status(201).json({ message: 'PUS added successfully!' });
    });
};

const getAllPus = (req, res) => {
    const query = 'SELECT * FROM pus';

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Failed to retrieve PUS records.' });
        }
        return res.status(200).json(results);
    });
};


const getFilteredPus = (req, res) => {
    const { usage_type, type } = req.query;  

    let query = 'SELECT * FROM pus WHERE 1=1'; 

    const queryParams = [];  

    if (usage_type) {
        query += ' AND usage_type = ?';
        queryParams.push(usage_type);
    }

    if (type) {
        query += ' AND type = ?';
        queryParams.push(type);
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Failed to retrieve PUS records.' });
        }
        return res.status(200).json(results);
    });
};

const updatePus = (req, res) => {
    const { id } = req.params;
    const { number, type, usage, quota } = req.body;

    if (!number && !type && !usage && !quota) {
        return res.status(400).send('At least one field is required to update.');
    }

    const fields = [];
    const values = [];

    if (num) {
        fields.push('number = ?');
        values.push(number);
    }
    if (type) {
        fields.push('type = ?');
        values.push(type);
    }
    if (usage) {
        fields.push('type_usage = ?');
        values.push(usage);
    }
    if (quota) {
        fields.push('quota = ?');
        values.push(quota);
    }

    const query = `UPDATE pus SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    db.query(query, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Database error occurred.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'PUS not found.' });
        }
        return res.status(200).json({ message: 'PUS updated successfully!' });
    });
};

const deletePus = (req, res) => {
    const { id } = req.query;
    const query = 'DELETE FROM pus WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Failed to delete PUS record.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'PUS not found.' });
        }
        return res.status(200).json({ message: 'PUS deleted successfully.' });
    });
};

module.exports = {addPus, getAllPus, deletePus, updatePus , getFilteredPus };
