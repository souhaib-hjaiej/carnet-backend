const mysql = require('mysql2');
const dotenv = require('dotenv')



dotenv.config();

// Create a MySQL connection
const connection = mysql.createConnection({
  host: process.env.host,  
  user:  process.env.user ,       
  password: process.env.password, 
  database:  process.env.database
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

module.exports = connection;
