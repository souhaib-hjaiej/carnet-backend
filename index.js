const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/uploadexcel'); 
const userRoutes = require('./routes/users');
const pusRoutes = require('./routes/pus');
const pusaffectationRoutes = require('./routes/pusaffectation');
const employeRoutes = require('./routes/employes');
const dashboard = require('./routes/dashboard');
const db = require('./config/db'); 
const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 


app.use('/api', uploadRoutes);
app.use('/user', userRoutes); 
app.use('/employe', employeRoutes ); 
app.use ('/pus', pusRoutes);
app.use ('/pusaffectation', pusaffectationRoutes);
app.use ('/dashboard', dashboard);




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
