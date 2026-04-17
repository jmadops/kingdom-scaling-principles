// Proxies frontend form submits into the GHL Inbound Webhook.
// Keeps the webhook URL server-side (frontend never sees it).
// Called before payment is attempted, so every form start is captured
// as a lead (tag: ksp-lead) even if the visitor bails on Stripe.

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { name, email, variant, tag } = req.body || {};

    if (!email) return res.status(400).json({ error: 'email required' });
    if (!process.env.GHL_WEBHOOK_URL) {
        // Not configured yet — respond OK so frontend doesn't hang, but log it.
        console.warn('GHL_WEBHOOK_URL not set; skipping lead capture');
        return res.status(200).json({ ok: true, skipped: true });
    }

    try {
        const ghlRes = await fetch(process.env.GHL_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                name: name || '',
                tag: tag || 'ksp-lead',
                variant: variant || 'unknown',
                event: 'kingdom-scaling-principles',
                status: tag === 'ksp-paid' ? 'paid' : 'lead',
            }),
        });
        if (!ghlRes.ok) {
            console.error('GHL webhook returned non-2xx:', ghlRes.status);
        }
        res.status(200).json({ ok: true });
    } catch (err) {
        console.error('capture-lead error:', err);
        // Don't fail the user's request if GHL is down — let them continue to pay
        res.status(200).json({ ok: true, warning: 'ghl_unreachable' });
    }
}
