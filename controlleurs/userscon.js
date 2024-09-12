const bcrypt = require('bcrypt');
const db = require('../config/db'); 
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');


dotenv.config();
const secretKey = process.env.JWT_SECRET;


const register = async (req, res) => {
  try {
    const { matricule, password, role, societe, site } = req.body;
    console.log(req.body);
    
    if (!matricule || !password || !role || !societe || !site) {
      return res.status(400).send("All fields are required!");
    }

   
    const selectMatricule = 'SELECT matricule FROM users WHERE matricule = ?';
    db.query(selectMatricule, [matricule], async (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).send({ message: 'Database query error' });
      }

      if (results.length > 0) {
        return res.status(400).send("This matricule is already in use!");
      }

      
      const hashedPassword = await bcrypt.hash(password, 10);

      const insert = 'INSERT INTO users (matricule, password, role, societe, site) VALUES (?, ?, ?, ?, ?)';
      const values = [matricule, hashedPassword, role, societe, site];
      db.query(insert, values, (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          return res.status(500).send({ message: 'Database query error' });
        }

        res.status(201).send("Registered successfully!");
      });
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { matricule, password } = req.body;
    console.log(req.body)

    if (!matricule || !password) {
      return res.status(400).send("Matricule and password are required!");
    }

    
    db.query('SELECT * FROM users WHERE matricule = ?', [matricule], async (err, results) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      if (results.length === 0) {
        return res.status(400).send("Wrong matricule or password!");
      }

      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        const payload = {
          username: user.matricule,
          role: user.role,
          societe: user.societe,
          site: user.site
      };
      const token = jwt.sign(payload, secretKey);
        res.status(200).send(token);
        console.log('worked')
      } else {
        res.status(400).send("Wrong matricule or password!");
      }
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};


const getUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, matricule, societe, role FROM users'); 
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

module.exports = { login, register ,getUsers };
