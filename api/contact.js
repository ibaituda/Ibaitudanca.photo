const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM_EMAIL = 'Ibai Tudanca Photo <hola@ibaitudancaphoto.com>';
const TO_EMAIL = 'hola@ibaitudancaphoto.com';

function clean(value, max = 5000) {
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
  const name = clean(body.name, 120);
  const club = clean(body.club, 160);
  const email = clean(body.email, 180);
  const message = clean(body.message, 6000);

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required' });
  }

  const subject = `Nueva solicitud desde ibaitudancaphoto.com · ${name}`;
  const text = [
    'Nueva solicitud desde la web:',
    '',
    `Nombre: ${name}`,
    `Club / Agencia: ${club || '—'}`,
    `Email: ${email}`,
    '',
    'Mensaje:',
    message,
    '',
    `Responder a: ${email}`
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2>Nueva solicitud desde la web</h2>
      <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
      <p><strong>Club / Agencia:</strong> ${escapeHtml(club || '—')}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <hr>
      <p><strong>Mensaje:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      <hr>
      <p>Responder a: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
    </div>`;

  const resendResponse = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      reply_to: email,
      subject,
      text,
      html
    })
  });

  const data = await resendResponse.json().catch(() => ({}));
  if (!resendResponse.ok) {
    return res.status(resendResponse.status).json({ error: data.message || data.error || 'Resend error' });
  }

  return res.status(200).json({ ok: true, id: data.id || null });
};
