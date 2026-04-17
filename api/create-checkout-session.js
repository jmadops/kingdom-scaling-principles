import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'method not allowed' });
    }

    const { name, email, variant } = req.body || {};

    if (!email) {
        return res.status(400).json({ error: 'email required' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: 'payment',
            line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
            customer_email: email,
            metadata: {
                name: name || '',
                variant: variant || 'unknown',
                event: 'kingdom-scaling-principles',
            },
            return_url: `${req.headers.origin}/thank-you/?session_id={CHECKOUT_SESSION_ID}`,
        });

        res.status(200).json({ clientSecret: session.client_secret });
    } catch (err) {
        console.error('stripe session error:', err);
        res.status(500).json({ error: err.message });
    }
}
