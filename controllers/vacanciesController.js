// backend/controllers/vacanciesController.js
const Job = require('../models/Job');
const Application = require('../models/Application'); // Import Application model
const { uploadImageToCloudinary, deleteImageFromCloudinary } = require('../utils/imageUploader'); // Ensure this utility can handle PDF/DOCX for resumes and stores them appropriately (e.g., 'silver_talent/resumes')
const { jobCategories, locations, jobTypes, featuredCompanies: initialFeaturedCompaniesSeed } = require('../data');
const nodemailer = require('nodemailer');

// --- Nodemailer Transporter Configuration ---
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail', // Or your email provider
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
    });

    transporter.verify(function(error, success) {
        if (error) {
            console.error("--- vacanciesController.js: Nodemailer (Main) config error ---", error.message);
        } else {
            console.log("--- vacanciesController.js: Nodemailer (Main) is configured and ready. ---");
        }
    });
} else {
    console.warn("--- vacanciesController.js: Main EMAIL_USER or EMAIL_PASS not found. Email functions might be mocked/disabled. ---");
    // Fallback mock transporter
    transporter = {
        sendMail: async (mailOptions) => {
            console.warn("Mock Nodemailer (Main): sendMail called.", {to: mailOptions.to, subject: mailOptions.subject, attachments: mailOptions.attachments ? mailOptions.attachments.length : 0 });
            return Promise.resolve({ messageId: 'mock-id-' + Date.now() }); // Simulate success
        }
    };
}

// GET all jobs
exports.getAllJobs = async (req, res, next) => {
    try {
        const { q, category, location, type, page = 1, limit = 10, admin_view } = req.query;
        const query = {};
        const isAdminView = String(admin_view).toLowerCase() === 'true';

        if (q) {
            const searchTerm = q.toLowerCase().trim();
            query.$or = [
                { title: { $regex: searchTerm, $options: 'i' } },
                { company: { $regex: searchTerm, $options: 'i' } },
            ];
        }
        if (category && category !== "All Categories") query.category = category;
        if (location && location !== "All Locations") {
            query.location = location.toLowerCase() === "remote" ? { $regex: "remote", $options: 'i' } : { $regex: location, $options: 'i' };
        }
        if (type && type !== "All Types") query.type = type;

        const effectivePage = parseInt(page);
        const effectiveLimit = isAdminView ? 200 : parseInt(limit); 
        const skip = (effectivePage - 1) * effectiveLimit;

        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(effectiveLimit)
            .lean(); // Use lean for read-only if not modifying
        
        const totalJobs = await Job.countDocuments(query);

        res.status(200).json({
            jobs, 
            totalPages: Math.ceil(totalJobs / effectiveLimit),
            currentPage: effectivePage,
            totalJobs
        });
    } catch (error) {
        console.error("[VacanciesCtrl] Error fetching jobs:", error.message);
        next(error);
    }
};

// Create a new job
exports.createJob = async (req, res, next) => {
    try {
        const { title, company, location, type, salary, category, description, skills } = req.body;
        
        const requiredFields = { title, company, location, type, salary, category, description };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value || String(value).trim() === "") {
                return res.status(400).json({ message: `Missing required field: ${key}` });
            }
        }

        const skillsArray = skills ? String(skills).split(',').map(s => s.trim()).filter(s => s) : [];
        let logoData = { url: `https://via.placeholder.com/128/CCCCCC/FFFFFF?text=${encodeURIComponent(company.substring(0,2).toUpperCase())}` };

        if (req.files && req.files.logoImage) {
            try {
                const uploadedImage = await uploadImageToCloudinary(req.files.logoImage, "silver_talent/company_logos");
                logoData = { public_id: uploadedImage.public_id, url: uploadedImage.secure_url };
            } catch (uploadError) {
                console.warn("[VacanciesCtrl] Logo upload error during creation (non-blocking):", uploadError.message);
            }
        }

        const newJob = new Job({
            title, company, location, type, salary, category, description,
            skills: skillsArray, logo: logoData,
            rating: parseFloat((Math.random() * (4.9 - 3.8) + 3.8).toFixed(1)),
            applicants: Math.floor(Math.random() * 5),
        });

        await newJob.save();
        res.status(201).json({ message: "Job vacancy added successfully!", job: newJob });

    } catch (error) {
        console.error("[VacanciesCtrl] Error creating job:", error.message);
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        next(error);
    }
};

// Get a single job by ID
exports.getJobById = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id).lean();
        if (!job) return res.status(404).json({ message: "Job not found." });
        res.status(200).json(job);
    } catch (error) {
        console.error("[VacanciesCtrl] Error fetching job by ID:", error.message);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: "Job not found (invalid ID format)." });
        }
        next(error);
    }
};

// Update an existing job
exports.updateJob = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const { title, company, location, type, salary, category, description, skills } = req.body;
        
        const jobToUpdate = await Job.findById(jobId);
        if (!jobToUpdate) return res.status(404).json({ message: "Job not found to update." });

        const requiredFields = { title, company, location, type, salary, category, description };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (value === undefined || String(value).trim() === "") {
                return res.status(400).json({ message: `Missing required field: ${key}` });
            }
        }

        jobToUpdate.title = title;
        jobToUpdate.company = company;
        jobToUpdate.location = location;
        jobToUpdate.type = type;
        jobToUpdate.salary = salary;
        jobToUpdate.category = category;
        jobToUpdate.description = description;
        jobToUpdate.skills = skills ? String(skills).split(',').map(s => s.trim()).filter(s => s) : jobToUpdate.skills;

        if (req.files && req.files.logoImage) {
            if (jobToUpdate.logo && jobToUpdate.logo.public_id) {
                try { await deleteImageFromCloudinary(jobToUpdate.logo.public_id); }
                catch (e) { console.warn("[VacanciesCtrl] Error deleting old logo during replacement (non-blocking):", e.message); }
            }
            try {
                const uploadedImage = await uploadImageToCloudinary(req.files.logoImage, "silver_talent/company_logos");
                jobToUpdate.logo = { public_id: uploadedImage.public_id, url: uploadedImage.secure_url };
            } catch (uploadError) {
                console.warn("[VacanciesCtrl] Logo upload error during update (non-blocking):", uploadError.message);
            }
        } else if (req.body.removeLogo === 'true') {
            if (jobToUpdate.logo && jobToUpdate.logo.public_id) {
                 try { await deleteImageFromCloudinary(jobToUpdate.logo.public_id); }
                 catch (e) { console.warn("[VacanciesCtrl] Error deleting logo on remove request (non-blocking):", e.message); }
            }
            jobToUpdate.logo = { url: `https://via.placeholder.com/128/CCCCCC/FFFFFF?text=${encodeURIComponent(jobToUpdate.company.substring(0,2).toUpperCase())}` };
        }

        const updatedJob = await jobToUpdate.save();
        res.status(200).json({ message: "Job vacancy updated successfully!", job: updatedJob });

    } catch (error) {
        console.error("[VacanciesCtrl] Error updating job:", error.message);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: "Job not found (invalid ID format for update)." });
        }
        next(error);
    }
};

// Delete a job
exports.deleteJob = async (req, res, next) => {
    try {
        const jobId = req.params.id;
        const jobToDelete = await Job.findById(jobId);
        if (!jobToDelete) return res.status(404).json({ message: "Job not found to delete." });

        if (jobToDelete.logo && jobToDelete.logo.public_id) {
            try { await deleteImageFromCloudinary(jobToDelete.logo.public_id); }
            catch (deleteError) { console.warn("[VacanciesCtrl] Error deleting logo from Cloudinary (non-blocking):", deleteError.message); }
        }

        await Job.findByIdAndDelete(jobId);
        // TODO: Also delete any applications associated with this job if desired.
        res.status(200).json({ message: "Job vacancy deleted successfully!", jobId: jobId });

    } catch (error) {
        console.error("[VacanciesCtrl] Error deleting job:", error.message);
        if (error.kind === 'ObjectId') {
             return res.status(404).json({ message: "Job not found (invalid ID format for delete)." });
        }
        next(error);
    }
};

// Get featured companies
exports.getFeaturedCompanies = async (req, res, next) => {
    try {
        const allJobCompanies = await Job.find({}, 'company').lean();
        const companyCounts = allJobCompanies.reduce((acc, job) => {
            const companyNameLower = job.company.toLowerCase();
            acc[companyNameLower] = (acc[companyNameLower] || 0) + 1;
            return acc;
        }, {});

        const dynamicFeaturedCompanies = initialFeaturedCompaniesSeed.map(fc => ({
            ...fc,
            _id: fc.id, // Ensure seed data 'id' is mapped if frontend uses '_id'
            jobs: companyCounts[fc.name.toLowerCase()] || 0
        }));
        res.status(200).json(dynamicFeaturedCompanies);
    } catch (error) {
        console.error("[VacanciesCtrl] Error fetching featured companies:", error.message);
        next(error);
    }
};

// Get filter options
exports.getFilterOptions = async (req, res, next) => {
    try {
        res.status(200).json({
            categories: jobCategories,
            locations: locations,
            jobTypes: jobTypes,
        });
    } catch (error) {
        console.error("[VacanciesCtrl] Error fetching filter options:", error.message);
        next(error);
    }
};

// --- JOB APPLICATION HANDLING ---

// Apply for a job (Modified)
exports.applyForJob = async (req, res, next) => {
    console.log("--- vacanciesController.js: applyForJob controller hit ---");
    try {
        const { jobId, jobTitle, companyName, name, email, coverLetter } = req.body;

        if (!process.env.OWNER_EMAIL) {
            console.warn("    Application Warning: OWNER_EMAIL not configured for admin notifications.");
        }
        if (!process.env.EMAIL_USER) {
            console.warn("    Application Warning: EMAIL_USER not configured for sending emails (admin notification/applicant confirmation).");
        }


        if (!req.files || !req.files.resume) {
            return res.status(400).json({ success: false, message: 'Resume file is required (expected field name: resume).' });
        }
        const resumeFile = req.files.resume;

        const requiredDetails = { jobId, jobTitle, companyName, name, email };
        for (const [key, value] of Object.entries(requiredDetails)) {
            if (!value || String(value).trim() === "") {
                return res.status(400).json({ success: false, message: `Missing required detail: ${key}` });
            }
        }
        
        const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const MAX_RESUME_SIZE_MB = 5; // 5MB
        if (!allowedMimeTypes.includes(resumeFile.mimetype)) {
            return res.status(400).json({ success: false, message: `Invalid resume file type. Allowed: PDF, DOC, DOCX. Received: ${resumeFile.mimetype}` });
        }
        if (resumeFile.size > MAX_RESUME_SIZE_MB * 1024 * 1024) {
            return res.status(400).json({ success: false, message: `Resume file size exceeds ${MAX_RESUME_SIZE_MB}MB.` });
        }

        let uploadedResumeData = {};
        try {
            // IMPORTANT: Ensure 'uploadImageToCloudinary' is adapted or replaced with a generic file uploader
            // that can handle PDFs/DOCs and stores them in a 'resumes' folder.
            const uploadedFile = await uploadImageToCloudinary(resumeFile, "silver_talent/resumes"); // The second arg is the folder
            uploadedResumeData = { public_id: uploadedFile.public_id, url: uploadedFile.secure_url };
        } catch (uploadError) {
            console.error("--- vacanciesController.js: Resume upload to Cloudinary failed ---", uploadError);
            // It's critical, so we stop if resume upload fails
            return next(new Error("Failed to upload resume. Please try again."));
        }

        const newApplication = new Application({
            jobId, jobTitle, companyName, name, email, coverLetter,
            resume: uploadedResumeData,
            status: 'Pending', // Initial status
        });
        await newApplication.save();
        console.log(`    Application saved to DB for ${name} for job ${jobTitle}. App ID: ${newApplication._id}`);

        // Notify admin (OWNER_EMAIL)
        if (process.env.EMAIL_USER && process.env.OWNER_EMAIL && transporter.sendMail !== undefined) {
            const mailOptionsAdmin = {
                from: `"Job Portal Admin" <${process.env.EMAIL_USER}>`,
                to: process.env.OWNER_EMAIL,
                subject: `🔔 New Job Application: ${jobTitle} - ${name}`,
                html: `
                    <p>A new job application has been submitted:</p>
                    <ul>
                        <li><strong>Applicant:</strong> ${name} (${email})</li>
                        <li><strong>For Job:</strong> ${jobTitle} at ${companyName}</li>
                        <li><strong>Applied On:</strong> ${newApplication.appliedDate.toLocaleDateString()}</li>
                        <li><strong>Resume:</strong> <a href="${uploadedResumeData.url}" target="_blank">View/Download Resume</a></li>
                    </ul>
                    <p>Details available in the admin dashboard.</p>
                `,
            };
            try {
                await transporter.sendMail(mailOptionsAdmin);
                console.log(`    Admin notification email sent to ${process.env.OWNER_EMAIL}.`);
            } catch (emailError) {
                console.error("    Error sending admin notification email:", emailError.message);
                // Non-critical, don't fail the application process for this
            }
        }
        
        // Send confirmation to applicant
        if (process.env.EMAIL_USER && transporter.sendMail !== undefined) {
             const mailOptionsApplicant = {
                from: `"Silver Talent Careers" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Your Application for ${jobTitle} at ${companyName} - Received!`,
                html: `
                    <p>Dear ${name},</p>
                    <p>Thank you for your interest and for applying for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.</p>
                    <p>We have successfully received your application. Our hiring team will review your qualifications and experience. If your profile aligns with the requirements for this role, we will contact you regarding the next steps.</p>
                    <p>We appreciate your patience during this process.</p>
                    <br/>
                    <p>Sincerely,</p>
                    <p>The Silver Talent Team</p>
                `
            };
            try {
                await transporter.sendMail(mailOptionsApplicant);
                console.log(`    Applicant confirmation email sent to ${email}.`);
            } catch (applicantEmailError) {
                console.error("    Error sending applicant confirmation email:", applicantEmailError.message);
            }
        }

        res.status(200).json({ 
            success: true, 
            message: 'Application submitted successfully! We will review it and get back to you.' 
        });

    } catch (error) {
        console.error("--- vacanciesController.js: ERROR in applyForJob ---", error);
        // If resume was uploaded but DB save failed, consider deleting the uploaded resume from Cloudinary.
        // This adds complexity (e.g., if uploadedResumeData.public_id exists).
        if (uploadedResumeData.public_id) {
            console.warn(`    Potential cleanup needed: Resume ${uploadedResumeData.public_id} uploaded but DB operation failed.`);
            // await deleteImageFromCloudinary(uploadedResumeData.public_id); // Be careful with this
        }
        next(error);
    }
};

// Get all applications (for Admin)
exports.getAllApplications = async (req, res, next) => {
    console.log("--- vacanciesController.js: getAllApplications controller hit ---");
    try {
        const { page = 1, limit = 20, sort = '-appliedDate', status_filter } = req.query;
        const query = {};

        if(status_filter && status_filter !== "All" && status_filter !== "") {
            query.status = status_filter;
        }

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        
        const applications = await Application.find(query)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit, 10))
            .populate('jobId', 'title') // Populate job title from referenced Job model
            .lean();

        const totalApplications = await Application.countDocuments(query);

        res.status(200).json({
            success: true,
            applications,
            totalPages: Math.ceil(totalApplications / parseInt(limit, 10)),
            currentPage: parseInt(page, 10),
            totalApplications,
        });
    } catch (error) {
        console.error("--- vacanciesController.js: ERROR in getAllApplications ---", error);
        next(error);
    }
};

// Respond to an application (Admin sends email to applicant)
exports.respondToApplication = async (req, res, next) => {
    console.log("--- vacanciesController.js: respondToApplication controller hit ---");
    try {
        const { applicationId } = req.params;
        const {  subject, body, newStatus } = req.body; // newStatus is optional

        if (!subject || !body) {
            return res.status(400).json({ success: false, message: "Response subject and body are required." });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found." });
        }

        if (!process.env.EMAIL_USER || !transporter.sendMail) {
             console.error("    Admin Response Error: Email service not configured for sending response.");
             return res.status(503).json({ success: false, message: "Email service unavailable. Cannot send response." });
        }

        const mailOptions = {
            from: `"Silver Talent Hiring Team" <${process.env.EMAIL_USER}>`,
            to: application.email,
            subject: subject,
            html: `<p>Dear ${application.name},</p>
                   <div style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>
                   <br/>
                   <p>Best regards,</p>
                   <p>The Silver Talent Team</p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`    Admin response sent to ${application.email} for application ${applicationId}.`);

        application.status = newStatus || 'Contacted'; // Update status, or default to 'Contacted'
        application.adminNotes = (application.adminNotes || "") + 
            `\n--- Response Sent (${new Date().toLocaleString()}) ---\nSubject: ${subject}\nStatus set to: ${application.status}\n---`;
        await application.save();
        console.log(`    Application ${applicationId} status updated to ${application.status}.`);

        res.status(200).json({ 
            success: true, 
            message: "Response sent successfully to the applicant and status updated.",
            updatedApplication: application // Send back updated app for frontend to update state
        });

    } catch (error) {
        console.error("--- vacanciesController.js: ERROR in respondToApplication ---", error);
        next(error);
    }
};