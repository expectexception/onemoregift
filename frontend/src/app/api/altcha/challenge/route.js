import { createChallenge } from 'altcha-lib';

export async function GET() {
    try {
        const hmacKey = process.env.ALTCHA_HMAC_KEY;
        if (!hmacKey) {
            console.error('ALTCHA_HMAC_KEY is not configured');
            return new Response(JSON.stringify({ error: 'Captcha is not configured' }), { status: 500 });
        }

        const challenge = await createChallenge({
            hmacKey,
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
