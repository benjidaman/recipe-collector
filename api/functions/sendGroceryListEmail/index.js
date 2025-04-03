const nodemailer = require('nodemailer');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const emailAddress = req.body.emailAddress;
    const subject = req.body.subject || "Your Grocery List";
    const message = req.body.message;

    if (!emailAddress || !message) {
        context.log.warn('Missing email address or message');
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Please provide an email address and message." })
        };
        return;
    }

    // Create a transporter using Brevo's SMTP settings
    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: '894b68001@smtp-brevo.com', // Your Brevo account email
            pass: 'ynZ0dzV1c63jQHJG' // Your Brevo SMTP key
        }
    });

    // Define the email options
    const mailOptions = {
        from: 'benjaminjamesrenaud@gmail.com', // Your verified sender email
        to: emailAddress,
        subject: subject,
        text: message
    };

    try {
        await transporter.sendMail(mailOptions);
        context.log(`Successfully sent email to ${emailAddress}`);
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Email sent successfully" })
        };
    } catch (error) {
        context.log.error(`Failed to send email: ${error.message}`);
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Error sending email: ${error.message}` })
        };
    }
};