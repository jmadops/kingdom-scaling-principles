import { kv } from '@vercel/kv';

const ALLOWED_EVENTS = ['pageview', 'scroll_to_checkout', 'form_start', 'checkout_submit'];
const ALLOWED_VARIANTS = ['a', 'b', 'standalone'];

export default async function handler(req, res) {
    // Frontend-fired events — allow same-origin POSTs
    res.setHeader('Cache-Control', 'no-store');

    if (req.method !== 'POST') return res.status(405).end();

    const { event, variant } = req.body || {};

    if (!event || !ALLOWED_EVENTS.includes(event)) {
        return res.status(400).json({ error: 'unknown event' });
    }

    const v = (variant || '').toLowerCase();
    if (!ALLOWED_VARIANTS.includes(v)) {
        return res.status(400).json({ error: 'unknown variant' });
    }

    const today = new Date().toISOString().slice(0, 10);
    await kv.incr(`${event}:${v}:${today}`);

    res.status(200).json({ ok: true });
}
