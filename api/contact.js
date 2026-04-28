const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, company, message } = req.body || {};
  if (!name || !email || !company) return res.status(400).json({ error: 'Missing required fields' });
  const notifyEmail = process.env.NOTIFY_EMAIL || 'matt@caprateadvisory.com';
  const fromEmail = process.env.FROM_EMAIL || 'noreply@caprateadvisory.com';
  try {
    await resend.emails.send({
      from: fromEmail, to: notifyEmail,
      subject: 'New Lead: ' + name + ' — ' + company,
      html: '<p><strong>Name:</strong> ' + name + '</p><p><strong>Email:</strong> ' + email + '</p><p><strong>Company:</strong> ' + company + '</p><p><strong>Message:</strong> ' + (message || 'None') + '</p>',
    });
    await resend.emails.send({
      from: fromEmail, to: email,
      subject: 'Got it, ' + name.split(' ')[0] + ' — I will be in touch shortly',
      html: '<p>Hi ' + name.split(' ')[0] + ',</p><p>Thanks for reaching out. I will get back to you within 24 hours.</p><p>Matt Calnan, CPA, CMA<br>Cap Rate Advisory</p>',
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
};
