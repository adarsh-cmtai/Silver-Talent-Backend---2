// backend/server.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const fileUpload = require("express-fileupload");

const { cloudinaryConnect } = require("./config/cloudinary"); 
const database = require("./config/database"); 

// --- Route Imports ---
const vacancyRoutes = require('./routes/vacancyRoutes');
const contactRoutes = require('./routes/contactRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const blogRoutes = require('./routes/blogRoutes'); // <<<< MAKE SURE THIS LINE IS PRESENT AND PATH IS CORRECT

console.log("--- server.js: Initializing server ---"); // Log on module load

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*", 
        credentials: true,
    })
);
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/", 
    })
);

// --- Database and Cloudinary Connections ---
database.connect();     
cloudinaryConnect();   

// --- API Routes Mounting ---
// General log for any request starting with /api (useful for seeing all API traffic)
app.use('/api', (req, res, next) => { 
    console.log(`--- server.js: API Gateway received: ${req.method} ${req.originalUrl} ---`); 
    console.log("    Request Body (first 200 chars if JSON):", req.is('application/json') ? JSON.stringify(req.body).substring(0,200) : "Not JSON or empty");
    next();
});

app.use('/api', vacancyRoutes);       
console.log("--- server.js: Mounted vacancyRoutes under /api ---");

app.use('/api', contactRoutes);       
console.log("--- server.js: Mounted contactRoutes under /api ---");

app.use('/api', subscriptionRoutes);  
console.log("--- server.js: Mounted subscriptionRoutes under /api ---");

app.use('/api', blogRoutes); // <<<< THIS IS WHERE blogRoutes IS MOUNTED
console.log("--- server.js: Mounted blogRoutes under /api ---");


// --- Basic Health Check and Root Endpoints ---
// ... (same as before) ...
 app.get('/', (req, res) => {
    res.status(200).send('<h1>Silver Talent Backend</h1><p>Server is operational!</p><p><a href="/api/health">Health Check</a></p>');
});
app.get('/api/health', (req, res) => {
    const dbStatus = database.isConnected && typeof database.isConnected === 'function' ? (database.isConnected() ? 'Connected' : 'Disconnected') : 'Status Unknown';
    res.status(200).json({
        status: "UP",
        message: "Backend is healthy and running.",
        timestamp: new Date().toISOString(),
        database: dbStatus
    });
});


// --- Global Error Handling Middleware (This should be defined AFTER all routes) ---
app.use((err, req, res, next) => {
    console.error("--- server.js: GLOBAL ERROR HANDLER CAUGHT AN ERROR ---");
    console.error("    Error Message:", err.message);
    // console.error("    Error Status:", err.status); 
    // console.error("    Error Stack:", err.stack); // Full stack can be very verbose
    console.error("-------------------------------------------------------");

    const statusCode = err.status || 500; 
    const errorMessage = err.message || "An unexpected internal server error occurred.";

    res.status(statusCode).json({
        success: false,
        message: errorMessage,
    });
});

// --- Start the HTTP Server ---
app.listen(PORT, () => {
    console.log(`\n🚀 Backend server is running and listening on http://localhost:${PORT}`);
    // ... other startup logs
});