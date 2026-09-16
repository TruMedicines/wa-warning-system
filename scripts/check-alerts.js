// Runs on a schedule (see .github/workflows/alert-check.yml).
// For every registered { zip, phone, carrier } in registrations.json, checks NWS active
// alerts for that ZIP, and emails any NEW alert to the subscriber's carrier SMS gateway
// address (e.g. 4255551234@tmomail.net), which the carrier delivers as a free text message.
//
// State (which alert IDs have already been sent) is kept in state.json in the repo so the
// same alert isn't texted twice. This script commits state.json back via the workflow.

const fs = require('fs');
const nodemailer = require('nodemailer');

const CARRIER_GATEWAYS = {
  att: 'txt.att.net',
  verizon: 'vtext.com',
  tmobile: 'tmomail.net',
  sprint: 'messaging.sprintpcs.com',
  boost: 'sms.myboostmobile.com',
  cricket: 'sms.cricketwireless.net',
  metro: 'mymetropcs.com',
  googlefi: 'msg.fi.google.com',
  visible: 'vtext.com',
  uscellular: 'email.uscc.net'
};

async function geocodeZip(zip) {
  const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!r.ok) throw new Error(`ZIP lookup failed for ${zip}`);
  const d = await r.json();
  const p = d.places[0];
  return { lat: parseFloat(p.latitude), lon: parseFloat(p.longitude), city: p['place name'] };
}

async function getAlerts(lat, lon) {
  const r = await fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, {
    headers: { 'User-Agent': '(wa-watch-alert-checker, contact: set-your-email@example.com)' }
  });
  if (!r.ok) throw new Error('NWS alerts fetch failed');
  return r.json();
}

function loadJson(path, fallback) {
  try { return JSON.parse(fs.readFileSync(path, 'utf8')); } catch (e) { return fallback; }
}

async function main() {
  const registrations = loadJson('registrations.json', []);
  const state = loadJson('state.json', {}); // { [zip]: [alertId, ...] }

  if (!registrations.length) {
    console.log('No registrations found in registrations.json. Nothing to do.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  const zipsSeen = {};

  for (const reg of registrations) {
    const { zip, phone, carrier } = reg;
    const gateway = CARRIER_GATEWAYS[carrier];
    if (!gateway) {
      console.warn(`Unknown carrier "${carrier}" for ${phone}, skipping.`);
      continue;
    }

    try {
      if (!zipsSeen[zip]) {
        const place = await geocodeZip(zip);
        const alerts = await getAlerts(place.lat, place.lon);
        zipsSeen[zip] = { place, alerts };
      }
      const { place, alerts } = zipsSeen[zip];

      const alreadySent = new Set(state[zip] || []);
      const newAlerts = alerts.features.filter((f) => !alreadySent.has(f.id));

      for (const f of newAlerts) {
        const p = f.properties;
        const body = `WA Watch: ${p.event} for ${place.city}, WA (${zip}). ${p.headline || ''}`.slice(0, 300);
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: `${phone}@${gateway}`,
          subject: '', // most gateways ignore subject; keep body short
          text: body
        });
        console.log(`Texted ${phone}: ${p.event}`);
      }

      state[zip] = alerts.features.map((f) => f.id);
    } catch (err) {
      console.error(`Error processing ${zip}:`, err.message);
    }
  }

  fs.writeFileSync('state.json', JSON.stringify(state, null, 2));
}

main();

