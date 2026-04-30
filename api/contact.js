module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, company, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' });

  const notifyPayload = {
    from: 'Cap Rate Advisory <matt@calnan.co>',
    to: ['matt@caprateadvisory.com'],
    reply_to: email,
    subject: 'New inquiry: ' + name,
    html: '<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ' + name + '</p><p><strong>Email:</strong> ' + email + '</p><p><strong>Service:</strong> ' + (company || 'Not specified') + '</p><p><strong>Message:</strong><br>' + String(message).replace(/\n/g, '<br>') + '</p>'
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
      return res.status(500).json({ error: 'Email send failed', detail: notifyBody });
    }
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Matt Calnan <matt@calnan.co>',
        to: [email],
        subject: "Thanks for reaching out — Cap Rate Advisory",
        html: '<p>Hi ' + name + ',</p><p>Thanks for getting in touch. I have received your message and will follow up within one business day.</p><p>Best,<br>Matt Calnan<br>Cap Rate Advisory<br>matt@caprateadvisory.com</p>'
      })
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
};
