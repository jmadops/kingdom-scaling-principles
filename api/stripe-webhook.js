import Stripe from 'stripe';
import { kv } from '@vercel/kv';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    let event;
    try {
        const rawBody = await readRawBody(req);
        const sig = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const variant = session.metadata?.variant || 'unknown';
        const name = session.customer_details?.name || session.metadata?.name || '';
        const email = session.customer_details?.email || session.customer_email;
        const today = new Date().toISOString().slice(0, 10);
        const amountDollars = (session.amount_total || 0) / 100;

        // Counters for dashboard
        await kv.incr(`purchases:${variant}:${today}`);
        await kv.incrby(`revenue:${variant}:${today}`, session.amount_total || 0);

        // Recent activity feed (capped at 50)
        await kv.lpush('activity:recent', JSON.stringify({
            ts: Date.now(),
            type: 'purchase',
            variant,
            name,
            email,
            amount: amountDollars,
        }));
        await kv.ltrim('activity:recent', 0, 49);

        // Tag the contact as paid in GHL
        if (process.env.GHL_WEBHOOK_URL) {
            try {
                await fetch(process.env.GHL_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        name,
                        tag: 'ksp-paid',
                        amount: amountDollars,
                        variant,
                        event: 'kingdom-scaling-principles',
                        status: 'paid',
                    }),
                });
            } catch (err) {
                console.error('GHL webhook post failed:', err);
                // Don't fail the webhook response — Stripe will retry otherwise
            }
        }
    }

    res.status(200).json({ received: true });
}
