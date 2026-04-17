// Returns public config values that the frontend needs.
// Only public keys live here (publishable key is safe in the browser).
// Called once at page load from /shared/funnel.js.

export default function handler(req, res) {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json({
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || '',
        googleConversionId: process.env.NEXT_PUBLIC_GOOGLE_CONVERSION_ID || '',
        tiktokPixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || '',
    });
}
