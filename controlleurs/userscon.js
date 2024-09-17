const bcrypt = require('bcrypt');
const db = require('../config/db'); 
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');


dotenv.config();
const secretKey = process.env.JWT_SECRET;


 // Adjust the path to your database connection
 const register = async (req, res) => {
  try {
    const { matricule, password, role, site, nom, prenom, societe } = req.body;
    console.log(req.body);

    // Check if all required fields are provided
    if (!matricule || !password || !role || !site || !nom || !prenom || !societe) {
      return res.status(400).json({ errors: ["All fields are required!"] });
    }

    // Check if the matricule already exists
    const selectMatricule = 'SELECT matricule FROM users WHERE matricule = ?';
    db.query(selectMatricule, [matricule], async (err, results) => {
      if (err) {
        return res.status(500).json({ errors: ["Database query error"] });
      }

      if (results.length > 0) {
        return res.status(400).json({ errors: ["This matricule is already in use!"] });
      }

      // Hash the password and insert the user
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertUser = 'INSERT INTO users (matricule, password, role, site, nom, prenom) VALUES (?, ?, ?, ?, ?, ?)';
      const userValues = [matricule, hashedPassword, role, site, nom, prenom];

      db.query(insertUser, userValues, function (err, results) {
        if (err) {
          return res.status(500).json({ errors: ["Database query error"] });
        }

        const userId = results.insertId;
        const insertSociete = 'INSERT INTO societe (user_id, societe) VALUES ?';
        const societeValues = societe.map(soc => [userId, soc]);

        db.query(insertSociete, [societeValues], function (err) {
          if (err) {
            return res.status(500).json({ errors: ["Database query error"] });
          }

          res.status(201).json({ message: "Registered successfully!" });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ errors: [err.message] });
  }
};


const updateUser = async (req, res) => {
  try {
    const { id, matricule, role, site, nom, prenom, societe } = req.body;
    console.log(req.body);

    if (!id) {
      return res.status(400).send("User ID is required!");
    }

    // Construct the update query dynamically based on provided fields
    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    const queryParts = [];

    // Check if each field is provided and needs to be updated
    if (matricule) {
      queryParts.push('matricule = ?');
      updateValues.push(matricule);
    }
    if (role) {
      queryParts.push('role = ?');
      updateValues.push(role);
    }
    if (site) {
      queryParts.push('site = ?');
      updateValues.push(site);
    }
    if (nom) {
      queryParts.push('nom = ?');
      updateValues.push(nom);
    }
    if (prenom) {
      queryParts.push('prenom = ?');
      updateValues.push(prenom);
    }

    // Only update user table if there are fields other than societe to update
    if (queryParts.length > 0) {
      updateQuery += queryParts.join(', ') + ' WHERE id = ?';
      updateValues.push(id);

      // Execute the update query for user fields
      db.query(updateQuery, updateValues, async (err) => {
        if (err) {
          console.error('Error executing query:', err);
          return res.status(500).send({ message: 'Database query error' });
        }
      });
    }

    // Handle societe update separately if provided
    if (societe) {
      // Step 1: Fetch current societe entries for this user
      const selectSociete = 'SELECT societe FROM societe WHERE user_id = ?';
      db.query(selectSociete, [id], (err, results) => {
        if (err) {
          console.error('Error fetching societe data:', err);
          return res.status(500).send({ message: 'Database query error' });
        }

        const existingSociete = results.map(row => row.societe);

        // Step 2: Determine which societe need to be added and which need to be removed
        const societeToAdd = societe.filter(s => !existingSociete.includes(s));
        const societeToDelete = existingSociete.filter(s => !societe.includes(s));

        // Step 3: Delete societe that are no longer in the new list
        if (societeToDelete.length > 0) {
          const deleteSociete = 'DELETE FROM societe WHERE user_id = ? AND societe IN (?)';
          db.query(deleteSociete, [id, societeToDelete], (err) => {
            if (err) {
              console.error('Error deleting societe:', err);
              return res.status(500).send({ message: 'Database query error' });
            }
          });
        }

        // Step 4: Add new societe entries
        if (societeToAdd.length > 0) {
          const insertSociete = 'INSERT INTO societe (user_id, societe) VALUES ?';
          const societeValues = societeToAdd.map(soc => [id, soc]);
          db.query(insertSociete, [societeValues], (err) => {
            if (err) {
              console.error('Error inserting societe:', err);
              return res.status(500).send({ message: 'Database query error' });
            }
          });
        }
      });
    }

    // Final response after all updates
    res.status(200).send("User updated successfully!");
    console.log('debug');

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};





const login = async (req, res) => {
  try {
    const { matricule, password } = req.body;
    console.log(req.body);

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

        // Send both token and role in the response
        res.status(200).json({
          token: token,
          role: user.role
        });

        console.log('worked');
      } else {
        res.status(400).send("Wrong matricule or password!");
      }
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getUsers = (req, res) => {
  // Query to get all users along with their associated societe
  const query = `
    SELECT users.* , societe.societe
    FROM users
    LEFT JOIN societe ON users.id = societe.user_id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users and societes:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }

    // Transform results into a user object with an array of societe
    const usersMap = {};
    results.forEach(row => {
      if (!usersMap[row.id]) {
        usersMap[row.id] = {
          id: row.id,
          matricule: row.matricule,
          role: row.role,
          nom :  row.nom,
          prenom :  row.prenom,
          site :  row.site,
          societe: []
        };
      }
      if (row.societe) {
        usersMap[row.id].societe.push(row.societe);
      }
    });

    // Convert map values to an array
    const users = Object.values(usersMap);

    res.status(200).json(users);
  });
};
const deleteUsers = (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).send("No user IDs provided!");
  }

  // Delete users from the users table
  const deleteQuery = 'DELETE FROM users WHERE id IN (?)';
  db.query(deleteQuery, [ids], (err) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).send("Error deleting users!");
    }

    res.status(200).send("Users deleted successfully!");
  });
};



module.exports = { login, register ,getUsers ,updateUser ,  deleteUsers };

// Assuming Express.js and MySQL are being used

