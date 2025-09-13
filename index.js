const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db.js');

const superadminRoutes = require('./routes/superadmin.js');
const adminRoutes = require('./routes/admin.js');
const clientRoutes = require('./routes/client.js');
const datastoreRoutes = require('./routes/datastore.js')
const projectRoutes = require('./routes/project.js')
const rag = require('./routes/rag.js')
const { checkClientAccess } = require('./middlewares/authmiddleware.js');
const scrapperRoutes = require('./routes/scraperRoutes.js')
const app = express();

dotenv.config();

app.use(express.json());

app.use(cors());

app.get('/',(req,res)=>{
    res.send("hello world")
})

app.use('/api/v1/superadmin',superadminRoutes)
app.use('/api/v1/admin',adminRoutes)
app.use('/api/v1/client',clientRoutes)
app.use('/api/v1/datastore',datastoreRoutes)
app.use('/api/v1/projects',projectRoutes)
app.use('/api/v1/rag',rag)
app.use('/api/v1/scrapper',scrapperRoutes)


// app.use('/api/v1/clients/:clientId/datastore',
//     checkClientAccess(),
//     (req,res,next) => {
//         req.clientId = req.params.clientId
//         next()
//     },
//     datastoreRoutes
// )

const PORT = 8000 || process.env.PORT;

connectDB();
app.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`)
})

