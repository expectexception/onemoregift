import { createChallenge } from 'altcha-lib';

export async function GET() {
    try {
        const challenge = await createChallenge({
            hmacKey: process.env.ALTCHA_HMAC_KEY || 'default_dev_hmac_secret_key_12345',
            maxNumber: 100000,
        });

        return new Response(JSON.stringify(challenge), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error('Altcha challenge creation error:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate challenge' }), { status: 500 });
    }
}
