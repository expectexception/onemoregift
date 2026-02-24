import { verifySolution } from 'altcha-lib';

export async function POST(req) {
    try {
        const { payload } = await req.json();

        if (!payload) {
            return new Response(
                JSON.stringify({ success: false, message: "Payload is required" }),
                { status: 400 }
            );
        }

        // The hmacKey must match what was used in createChallenge
        const hmacKey = process.env.ALTCHA_HMAC_KEY || 'default_dev_hmac_secret_key_12345';

        const isVerified = await verifySolution(payload, hmacKey);

        if (isVerified) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        return new Response(
            JSON.stringify({
                success: false,
                message: "ALTCHA verification failed",
            }),
            { status: 400 }
        );
    } catch (error) {
        console.error('ALTCHA verification error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: "An error occurred during verification",
            }),
            { status: 500 }
        );
    }
}
