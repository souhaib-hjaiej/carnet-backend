const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();  

const secretKey = process.env.JWT_SECRET;

const superadminAuth = (req, res, next) => {
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No Token Provided' });
  }

  
  jwt.verify(token, secretKey, (err, decodedToken) => {
    if (err) {
      console.log(err.message);
      return res.status(403).json({ message: 'Access Denied: Invalid Token' });
    } else {
    if (decodedToken.role === 'superadmin') {
            next();
          } else {
            return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
          }
    }
  });
};
const adminAuth = (req, res, next) => {
   const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }
  
     jwt.verify(token, secretKey, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        return res.status(403).json({ message: 'Access Denied: Invalid Token' });
      } else {
      if (decodedToken.role === 'admin') {
              next();
            } else {
              return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
            }
      }
    });
  };
module.exports = {adminAuth, superadminAuth};  