// backend/config/nodemailer.js
const nodemailer = require('nodemailer');
// dotenv.config() is called in server.js *before* this file is required,
// so process.env variables should be available here.

console.log("--- nodemailer.js: Initializing Nodemailer Configuration ---");

let transporter;
let isNodemailerConfigured = true; // Assume configured, then set to false if checks fail

// Check for essential environment variables
if (
    !process.env.EMAIL_SERVER_HOST ||
    !process.env.EMAIL_SERVER_PORT ||
    !process.env.EMAIL_SERVER_USER ||
    !process.env.EMAIL_SERVER_PASSWORD ||
    !process.env.EMAIL_TO // Recipient email is also crucial for the form's function
) {
    console.error("--- nodemailer.js: CRITICAL CONFIGURATION ERROR ---");
    console.error("    One or more required email server environment variables are MISSING.");
    console.error("    Required: EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_TO.");
    console.error("    Email sending will be DISABLED. Please check your .env file.");
    console.error("----------------------------------------------------");
    isNodemailerConfigured = false;

    // Create a mock transporter that will gracefully fail any send attempts
    transporter = {
        sendMail: async (mailOptions) => {
            console.error("--- MockTransporter.sendMail: Called, but email service is not properly configured due to missing .env variables. Email NOT sent. ---");
            // Simulate an error structure similar to a real Nodemailer error
            const error = new Error("Email service is not configured. Administrator has been notified.");
            error.code = "EMISSCNFG"; // Custom error code for "Email Missing Configuration"
            error.responseCode = 503; // Service Unavailable
            throw error;
        },
        verify: async () => {
            console.warn("--- MockTransporter.verify: Called, but email service is not configured. Verification skipped. ---");
            return false; // Indicate verification failure
        }
    };
} else {
    // Log the configuration being used (be careful with sensitive data in production logs)
    console.log("    Nodemailer Config: Using EMAIL_SERVER_HOST:", process.env.EMAIL_SERVER_HOST);
    console.log("    Nodemailer Config: Using EMAIL_SERVER_PORT:", process.env.EMAIL_SERVER_PORT);
    console.log("    Nodemailer Config: Using EMAIL_SERVER_USER:", process.env.EMAIL_SERVER_USER ? process.env.EMAIL_SERVER_USER.substring(0, 3) + "***" : "NOT SET"); // Obfuscate user
    console.log("    Nodemailer Config: Target recipient EMAIL_TO:", process.env.EMAIL_TO);
    // DO NOT log EMAIL_SERVER_PASSWORD

    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // `secure:true` for port 465 (SSL), `secure:false` for port 587 (TLS/STARTTLS)
        auth: {
            user: process.env.EMAIL_SERVER_USER, // Your email address
            pass: process.env.EMAIL_SERVER_PASSWORD, // Your email password or App Password
        },
        // Optional settings for debugging or specific server requirements:
        // tls: {
        //     // Do not fail on invalid certs (useful for local testing with self-signed certs, e.g., MailHog)
        //     // rejectUnauthorized: false // IMPORTANT: DO NOT USE IN PRODUCTION
        // },
        // logger: true, // Enable Nodemailer's internal logging for deep debugging
        // debug: true,  // Enable debug output from Nodemailer
    });

    // Asynchronously verify the transporter configuration when the module loads.
    // This helps catch issues early during server startup.
    transporter.verify()
        .then(() => {
            console.log("--- nodemailer.js: Nodemailer SMTP Server connection VERIFIED SUCCESSFULLY (asynchronous check upon module load). Ready to send emails. ---");
        })
        .catch(error => {
            console.error("--- nodemailer.js: Nodemailer SMTP Server connection VERIFICATION FAILED (asynchronous check upon module load). ---");
            console.error("    Error Code:", error.code);
            console.error("    Error Message:", error.message);
            console.error("    Hint: Please double-check your .env file for EMAIL_SERVER_HOST, PORT, USER, and PASSWORD.");
            console.error("    Ensure your email provider (e.g., Gmail) allows access (App Password for 2FA).");
            console.error("    Check firewall and network connectivity from your server to the mail server.");
            console.error("--------------------------------------------------------------------------------------------");
            isNodemailerConfigured = false; // Mark as not configured if verification fails
        });
}

module.exports = {
    transporter,            // The configured Nodemailer transporter object
    isNodemailerConfigured  // A boolean flag indicating if configuration was successful
};