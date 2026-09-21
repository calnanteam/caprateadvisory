// Contact form handler — Resend. Hardened 2026-09-21: honeypot, origin allowlist, validation, rate limit.
const ALLOWED_HOSTS = ['caprateadvisory.com', 'www.caprateadvisory.com', 'caprateadvisory.vercel.app'];
const hits = new Map(); // ip -> [timestamps]; per-instance, best-effort
const WINDOW_MS = 10 * 60 * 1000, MAX_PER_WINDOW = 3;

function originAllowed(req) {
  const src = req.headers.origin || req.headers.referer || '';
  if (!src) return false;
  try {
    const h = new URL(src).hostname;
    return ALLOWED_HOSTS.includes(h) || /\.vercel\.app$/.test(h) && h.startsWith('caprateadvisory');
  } catch (e) { return false; }
}
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  arr.push(now); hits.set(ip, arr);
  return arr.length > MAX_PER_WINDOW;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.caprateadvisory.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!originAllowed(req)) return res.status(403).json({ error: 'Forbidden' });

  const body = req.body || {};
  const { name, email, company, message, website_url } = body;
  if (website_url) return res.status(200).json({ success: true }); // honeypot: pretend success, send nothing
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string')
    return res.status(400).json({ error: 'Invalid fields' });
  if (!name.trim() || !email.trim() || !message.trim()) return res.status(400).json({ error: 'Missing required fields' });
  if (name.length > 120 || email.length > 200 || message.length > 4000 || String(company || '').length > 120)
    return res.status(400).json({ error: 'Field too long' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Invalid email' });
  if (/https?:\/\/\S+.*https?:\/\/\S+/i.test(message) && message.length < 200) return res.status(400).json({ error: 'Rejected' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many requests' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });

  const notifyPayload = {
    from: 'Cap Rate Advisory <matt@calnan.co>',
    to: ['matt@calnan.co'],
    reply_to: email,
    subject: 'Contact Form - caprateadvisory.com: ' + name.trim(),
    html: '<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ' + esc(name) + '</p><p><strong>Email:</strong> ' + esc(email) + '</p><p><strong>Service:</strong> ' + esc(company || 'Not specified') + '</p><p><strong>Message:</strong><br>' + esc(message).replace(/\n/g, '<br>') + '</p><p style="color:#888;font-size:12px">IP ' + esc(ip) + ' · ' + new Date().toISOString() + '</p>'
  };

  try {
    const notifyRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(notifyPayload)
    });
    const notifyBody = await notifyRes.text();
    if (!notifyRes.ok) {
      console.error('Resend notify failed:', notifyRes.status, notifyBody);
      return res.status(500).json({ error: 'Email send failed' });
    }
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Matt Calnan <matt@calnan.co>',
        to: [email],
        subject: 'Thanks for reaching out — Cap Rate Advisory',
        html: '<p>Hi ' + esc(name.trim()) + ',</p><p>Thanks for getting in touch. I have received your message and will follow up within one business day. If you would rather talk first, book a 15-minute call: <a href="https://calendly.com/calnanreg/caprate-advisory-intro-call">calendly.com/calnanreg/caprate-advisory-intro-call</a></p><p>Matt Calnan, CPA, CMA<br>Cap Rate Advisory<br>matt@caprateadvisory.com</p>'
      })
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};
