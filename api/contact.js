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

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY is not configured in Vercel' });

  const body = await readBody(req);
  const name = clean(body.name || body.nombre, 120);
  const club = clean(body.club, 160);
  const email = clean(body.email, 180);
  const message = clean(body.message || body.mensaje, 6000);

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
