const { sendEmail } = require('../controller/authController');

async function test() {
    console.log("--- Production Email Service Test ---");
    console.log("This will test Brevo first, then Gmail fallback if Brevo fails.");
    
    // Replace with a valid recipient for testing
    const recipient = process.argv[2] || 'expectexception@gmail.com';
    
    const success = await sendEmail({
        to: recipient,
        subject: 'OneMoreGift - Production Email Test',
        html: '<h1>Hello!</h1><p>Your production email service is now properly configured.</p>'
    });
    
    if (success) {
        console.log("\nSUCCESS: Email was delivered successfully!");
    } else {
        console.log("\nFAILURE: Both Brevo and Gmail fallback failed. Please check your .env credentials.");
    }
}

test();
