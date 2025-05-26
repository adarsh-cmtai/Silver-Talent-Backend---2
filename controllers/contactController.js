// backend/controllers/contactController.js
const ContactInfo = require('../models/ContactInfo');
const { transporter, isNodemailerConfigured } = require('../config/nodemailer');
const ContactSubmission = require('../models/ContactSubmission');
require('dotenv').config();

const CONTACT_IDENTIFIER = "main_contact_info";

// GET current contact information
exports.getContactInfo = async (req, res) => {
    try {
        let contactInfo = await ContactInfo.findOne({ identifier: CONTACT_IDENTIFIER });
        if (!contactInfo) {
            // Create default if not found
            contactInfo = await ContactInfo.create({
                identifier: CONTACT_IDENTIFIER,
                address: "123 Main Street, Anytown, USA 12345",
                phone: "+1 (555) 123-4567",
                email: "contact@silvertalent.com",
                locationMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.617235807076!2d-73.98785368459393!3d40.74844097932817!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e1921e8a9a7f!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1603116835901!5m2!1sen!2sus"
            });
        }
        res.status(200).json(contactInfo);
    } catch (error) {
        console.error("Error fetching contact info:", error);
        res.status(500).json({ message: "Server error: Could not fetch contact information.", error: error.message });
    }
};

// UPDATE contact information (Admin)
exports.updateContactInfo = async (req, res) => {
    // TODO: Add admin authentication middleware
    try {
        const { address, phone, email, locationMapUrl } = req.body;

        if (address === undefined || phone === undefined || email === undefined || locationMapUrl === undefined) {
            return res.status(400).json({ message: 'All contact fields are required.' });
        }

        const updatedContactInfo = await ContactInfo.findOneAndUpdate(
            { identifier: CONTACT_IDENTIFIER },
            { address, phone, email, locationMapUrl },
            { new: true, upsert: true, runValidators: true } // upsert: true creates if not found
        );

        console.log("Contact information updated in DB.");
        res.status(200).json({ message: 'Contact information updated successfully.', data: updatedContactInfo });

    } catch (error) {
        console.error("Error updating contact info:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        res.status(500).json({ message: "Server error: Could not update contact information.", error: error.message });
    }
};

exports.handlePublicContactForm = async (req, res) => {
    console.log(`--- contactController.js: handlePublicContactForm invoked at ${new Date().toISOString()} ---`);
    console.log("    Request Body:", JSON.stringify(req.body, null, 2));

    // Basic check for Nodemailer config (doesn't guarantee it's working, but checks .env setup)
    if (!isNodemailerConfigured) {
        console.error("--- contactController.js: Aborting PUBLIC form. Email service is not configured (isNodemailerConfigured flag is false). Check startup logs for .env issues. ---");
        // Don't necessarily send error to user for public form, just log and maybe don't send notification
        // But we still want to save their submission.
    }
    if (!process.env.EMAIL_TO || !process.env.EMAIL_SERVER_USER) {
        console.warn("--- contactController.js: PUBLIC form: EMAIL_TO or EMAIL_SERVER_USER for admin notification is not set in .env. Admin will not be notified by email for this submission. ---");
    }

    try {
        const {
            yourName, yourEmail, fullPhoneNumber,
            countryName, countryCode, yourMessage,
        } = req.body;

        const errors = [];
        if (!yourName || typeof yourName !== 'string' || yourName.trim() === "") errors.push('Your name is required.');
        if (!yourEmail || typeof yourEmail !== 'string' || !/^\S+@\S+\.\S+$/.test(yourEmail)) errors.push('A valid email address is required.');
        if (!fullPhoneNumber || typeof fullPhoneNumber !== 'string' || fullPhoneNumber.trim() === "") errors.push('Your phone number is required.');
        if (!yourMessage || typeof yourMessage !== 'string' || yourMessage.trim() === "") errors.push('Your message is required.');

        if (errors.length > 0) {
            console.log("    contactController.js: Validation Errors on public form input:", errors.join(', '));
            if (!res.headersSent) {
                return res.status(400).json({ success: false, message: errors.join(' ') });
            }
            return;
        }

        // Save submission to database
        const newSubmission = new ContactSubmission({
            yourName: yourName.trim(),
            yourEmail: yourEmail.trim().toLowerCase(),
            fullPhoneNumber: fullPhoneNumber.trim(),
            countryName: countryName || '',
            countryCode: countryCode || '',
            yourMessage: yourMessage.trim(),
            status: 'New' // Initial status
        });
        await newSubmission.save();
        console.log("    contactController.js: Contact form submission saved to DB with ID:", newSubmission._id);

        // Optionally, send an email notification to the admin about the new submission
        if (isNodemailerConfigured && process.env.EMAIL_TO && process.env.EMAIL_SERVER_USER) {
            try {
                const adminNotificationHtml = `
                    <h1>New Contact Form Submission Received</h1>
                    <p>A new message has been submitted through the website contact form and saved to the database.</p>
                    <hr>
                    <p><strong>Name:</strong> ${newSubmission.yourName}</p>
                    <p><strong>Email:</strong> ${newSubmission.yourEmail}</p>
                    <p><strong>Phone:</strong> ${newSubmission.fullPhoneNumber}</p>
                    <p><strong>Message:</strong></p>
                    <div style="padding:10px;border:1px solid #eee;background-color:#f9f9f9;white-space:pre-wrap;">${newSubmission.yourMessage.replace(/\n/g, '<br>')}</div>
                    <hr>
                    <p><small>You can view and respond to this submission in the admin dashboard.</small></p>
                `;
                const adminMailOptions = {
                    from: `"Website System" <${process.env.EMAIL_SERVER_USER}>`,
                    to: process.env.EMAIL_TO,
                    subject: `New Contact Submission: ${newSubmission.yourName}`,
                    html: adminNotificationHtml,
                };
                await transporter.sendMail(adminMailOptions);
                console.log("    contactController.js: Admin notification email sent successfully for submission ID:", newSubmission._id);
            } catch (emailError) {
                console.error("--- contactController.js: ERROR sending admin notification email for new submission ---");
                console.error("    Submission ID:", newSubmission._id);
                console.error("    Email Error:", emailError.message);
                // Don't fail the user's submission if admin notification fails
            }
        }

        // Send success response to the user
        if (!res.headersSent) {
            return res.status(200).json({
                success: true,
                message: 'Thank you for your message! We have received it and will get back to you soon.',
            });
        }

    } catch (error) { // Catch errors from DB save or other synchronous code
        console.error("--- contactController.js: ERROR occurred in handlePublicContactForm's try/catch block ---");
        console.error("    Error Name:", error.name);
        console.error("    Error Message:", error.message);
        // ... (more detailed error logging as before)

        let clientMessage = "Failed to submit your message due to an unexpected server error. Please try again later.";
        let statusCode = 500;

        if (error.name === 'ValidationError') {
            clientMessage = Object.values(error.errors).map(e => e.message).join(' ');
            statusCode = 400;
        }

        if (!res.headersSent) {
            return res.status(statusCode).json({
                success: false,
                message: clientMessage,
            });
        } else {
            console.error("--- contactController.js: Headers already sent after an error in public form. Could not send error JSON. Error:", error.message);
        }
    }
};


exports.getContactSubmissions = async (req, res) => {
    console.log(`--- contactController.js: getContactSubmissions invoked at ${new Date().toISOString()} ---`);
    try {
        const { status_filter, limit = 50, page = 1 } = req.query;
        const query = {};
        if (status_filter && status_filter !== 'All') {
            query.status = status_filter;
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const submissions = await ContactSubmission.find(query)
            .sort({ submittedAt: -1 }) // Newest first
            .skip(skip)
            .limit(limitNum);

        const totalSubmissions = await ContactSubmission.countDocuments(query);

        if (!res.headersSent) {
            return res.status(200).json({
                success: true,
                submissions,
                totalPages: Math.ceil(totalSubmissions / limitNum),
                currentPage: pageNum,
                totalCount: totalSubmissions
            });
        }
    } catch (error) {
        console.error("--- contactController.js: ERROR fetching contact submissions ---");
        console.error("    Error:", error.message);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Failed to fetch contact submissions." });
        }
    }
};

// PUT /api/contact-submissions/:submissionId/status (Admin: Update submission status)
exports.updateSubmissionStatus = async (req, res) => {
    const { submissionId } = req.params;
    const { status, adminNotes } = req.body;
    console.log(`--- contactController.js: updateSubmissionStatus for ID ${submissionId} to ${status} ---`);

    try {
        if (!['New', 'Viewed', 'Replied', 'Archived'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value." });
        }

        const updateData = { status };
        if (adminNotes !== undefined) { // Allow clearing notes by passing empty string
            updateData.adminNotes = adminNotes;
        }
        if (status === 'Replied' && !adminNotes) { // If setting to replied, expect some note or ensure repliedAt is set
            updateData.repliedAt = new Date();
        }


        const submission = await ContactSubmission.findByIdAndUpdate(
            submissionId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!submission) {
            return res.status(404).json({ success: false, message: "Submission not found." });
        }
        console.log("    Submission status updated successfully for ID:", submissionId);
        if (!res.headersSent) {
            return res.status(200).json({ success: true, message: "Submission status updated.", submission });
        }
    } catch (error) {
        console.error(`--- contactController.js: ERROR updating status for submission ${submissionId} ---`);
        console.error("    Error:", error.message);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Failed to update submission status." });
        }
    }
};


// POST /api/contact-submissions/:submissionId/respond (Admin: Send email response)
exports.respondToSubmission = async (req, res) => {
    const { submissionId } = req.params;
    const { subject, body: emailBody, updateStatusToReplied = true } = req.body; // Renamed body to emailBody
    console.log(`--- contactController.js: respondToSubmission for ID ${submissionId} ---`);

    if (!isNodemailerConfigured) {
        console.error("--- contactController.js: Aborting respondToSubmission. Email service is not configured. ---");
        if (!res.headersSent) {
            return res.status(503).json({ success: false, message: "Email service is not configured. Cannot send response." });
        }
        return;
    }
    if (!process.env.EMAIL_SERVER_USER) { // Check for sender email
        console.error("--- contactController.js: CRITICAL .env var missing: EMAIL_SERVER_USER. Cannot send response. ---");
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Server configuration error: Sender email not set." });
        }
        return;
    }


    try {
        if (!subject || !emailBody) {
            return res.status(400).json({ success: false, message: "Email subject and body are required." });
        }

        const submission = await ContactSubmission.findById(submissionId);
        if (!submission) {
            return res.status(404).json({ success: false, message: "Contact submission not found." });
        }

        const mailOptions = {
            from: `"Your Company Name" <${process.env.EMAIL_SERVER_USER}>`, // Customize "Your Company Name"
            to: submission.yourEmail,
            subject: subject,
            html: emailBody.replace(/\n/g, '<br>'), // Convert newlines to <br> for HTML email
            // text: emailBody, // Optionally, provide a plain text version
        };

        console.log("    Attempting to send response email to:", submission.yourEmail);
        await transporter.sendMail(mailOptions);
        console.log("    Response email sent successfully to:", submission.yourEmail);

        if (updateStatusToReplied) {
            submission.status = 'Replied';
            submission.repliedAt = new Date();
            await submission.save();
            console.log("    Submission status updated to 'Replied' for ID:", submissionId);
        }

        if (!res.headersSent) {
            return res.status(200).json({ success: true, message: "Response sent successfully and submission updated." });
        }

    } catch (error) {
        console.error(`--- contactController.js: ERROR sending response for submission ${submissionId} ---`);
        console.error("    Error Name:", error.name);
        console.error("    Error Code:", error.code);
        console.error("    Error Message:", error.message);
        // ... (more detailed error logging for Nodemailer errors as before) ...

        let clientMessage = "Failed to send response email. Please try again later.";
        let statusCode = 500;
        // ... (logic to set clientMessage and statusCode based on error.code) ...

        if (!res.headersSent) {
            return res.status(statusCode).json({ success: false, message: clientMessage });
        }
    }
};


// DELETE /api/contact-submissions/:submissionId (Admin: Delete a submission)
exports.deleteSubmission = async (req, res) => {
    const { submissionId } = req.params;
    console.log(`--- contactController.js: deleteSubmission for ID ${submissionId} ---`);
    try {
        const result = await ContactSubmission.findByIdAndDelete(submissionId);
        if (!result) {
            return res.status(404).json({ success: false, message: "Submission not found." });
        }
        console.log("    Submission deleted successfully:", submissionId);
        if (!res.headersSent) {
            return res.status(200).json({ success: true, message: "Submission deleted successfully." });
        }
    } catch (error) {
        console.error(`--- contactController.js: ERROR deleting submission ${submissionId} ---`);
        console.error("    Error:", error.message);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: "Failed to delete submission." });
        }
    }
};