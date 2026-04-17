import { kv } from '@vercel/kv';

const METRICS = ['pageview', 'scroll_to_checkout', 'form_start', 'purchases', 'revenue'];
const VARIANTS = ['a', 'b'];

function datesInRange(range) {
    const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const out = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() - i);
        out.push(d.toISOString().slice(0, 10));
    }
    return out;
}

function requireBasicAuth(req, res) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="KSP Dashboard"');
        res.status(401).end();
        return false;
    }
    const decoded = Buffer.from(auth.slice(6), 'base64').toString();
    const [, pass] = decoded.split(':');
    if (pass !== process.env.DASHBOARD_PASSWORD) {
        res.setHeader('WWW-Authenticate', 'Basic realm="KSP Dashboard"');
        res.status(401).end();
        return false;
    }
    return true;
}

export default async function handler(req, res) {
    if (!requireBasicAuth(req, res)) return;

    const range = req.query.range || '7d';
    const dates = datesInRange(range);

    // Build the key list for a multi-get
    const keys = [];
    for (const variant of VARIANTS) {
        for (const metric of METRICS) {
            for (const date of dates) {
                keys.push(`${metric}:${variant}:${date}`);
            }
        }
    }

    const values = keys.length ? await kv.mget(...keys) : [];

    // Reshape into { variantA: { byDate: {...}, totals: {...} }, variantB: ... }
    const out = { a: buildVariant(), b: buildVariant() };
    keys.forEach((key, idx) => {
        const [metric, variant, date] = key.split(':');
        const value = Number(values[idx]) || 0;
        out[variant].byDate[metric][date] = value;
        out[variant].totals[metric] = (out[variant].totals[metric] || 0) + value;
    });

    // Recent activity
    const activityRaw = await kv.lrange('activity:recent', 0, 14) || [];
    const activity = activityRaw.map(a => typeof a === 'string' ? JSON.parse(a) : a);

    res.status(200).json({
        range,
        dates: dates.slice().reverse(),
        variantA: out.a,
        variantB: out.b,
        activity,
    });
}

function buildVariant() {
    const byDate = {};
    for (const m of METRICS) byDate[m] = {};
    return { byDate, totals: {} };
}
