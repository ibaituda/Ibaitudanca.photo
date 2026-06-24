const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM_EMAIL = 'Ibai Tudanca Photo <hola@ibaitudancaphoto.com>';

function clean(value, max = 8000) {
  return String(value || '').trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY is not configured' });

  const body = req.body || {};
  const to = clean(body.to, 240);
  const subject = clean(body.subject, 240);
  const message = clean(body.body, 10000);

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Recipient, subject and body are required' });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      ${escapeHtml(message).replace(/\n/g, '<br>')}
      <br><br>
      <hr>
      <p style="color:#666;font-size:12px">Ibai Tudanca Photo · ibaitudancaphoto.com</p>
    </div>`;

  const resendResponse = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      text: message,
      html
    })
  });

  const data = await resendResponse.json().catch(() => ({}));
  if (!resendResponse.ok) {
    return res.status(resendResponse.status).json({ error: data.message || data.error || 'Resend error' });
  }

  return res.status(200).json({ ok: true, id: data.id || null });
};
