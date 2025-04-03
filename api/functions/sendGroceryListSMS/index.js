const { Twilio } = require('twilio');

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
        context.log.error('Missing Twilio configuration');
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Server configuration error: Missing Twilio configuration" })
        };
        return;
    }

    const phoneNumber = req.body.phoneNumber;
    const message = req.body.message;

    if (!phoneNumber || !message) {
        context.log.warn('Missing phone number or message');
        context.res = {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Please provide a phone number and message." })
        };
        return;
    }

    const client = new Twilio(accountSid, authToken);

    try {
        await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: phoneNumber
        });
        context.log(`Successfully sent SMS to ${phoneNumber}`);
        context.res = {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "SMS sent successfully" })
        };
    } catch (error) {
        context.log.error(`Failed to send SMS: ${error.message}`);
        context.res = {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Error sending SMS: ${error.message}` })
        };
    }
};