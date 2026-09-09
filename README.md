# WA Watch

A live, ZIP-code-specific hazard dashboard for Washington State — active National Weather
Service alerts, a 7-day outlook, and plain-language readouts for wind, snow, rain/flood,
cold, and heat risk. Inspired by [Cliff Mass's proposal](https://cliffmass.blogspot.com/)
for a Seattle-area environmental warning system.

Works on desktop, iPhone, and Android — it's a website, not a native app store app, but it
can be "installed" to a phone's home screen and used just like one.

## What it does

- Enter any WA ZIP code → live NWS alerts, forecast, and hazard readouts for that spot.
- No backend, no API keys, no build step. Two free public APIs power it:
  - [api.weather.gov](https://www.weather.gov/documentation/services-web-api) — alerts + forecast
  - [Zippopotam.us](https://www.zippopotam.us/) — ZIP → lat/lon
- Installable as a Progressive Web App (Add to Home Screen) on Android and iPhone.
- Browser push notifications while the tab/app is open (polls every 5 minutes for new alerts).

## 1. Deploy it (free, ~5 minutes)

**GitHub Pages:**
1. Create a new GitHub repo and push everything in this folder to it.
2. Repo → **Settings → Pages** → Source: "Deploy from a branch" → Branch: `main` / `root`.
3. Your site is live at `https://<your-username>.github.io/<repo-name>/`.

Any other free static host works the same way (Cloudflare Pages, Netlify, Vercel) — just
drag-and-drop this folder in.

## 2. Getting real text messages (the honest tradeoffs)

A static site can't send a text message while your phone is asleep and the site is closed —
that always requires *something* running on a server. There's no way around that; it's not
a limitation of this project specifically. Three real options, cheapest first:

### Option A — Browser push (already built in, $0, works today)
Click "Enable browser alerts" on the site. As long as the tab is open, or you've installed
the site to your home screen and it's running, you'll get a native-style notification within
5 minutes of a new NWS alert. Doesn't work if the phone is asleep or the app is fully closed.

### Option B — Free SMS via GitHub Actions + carrier email gateway
This repo includes a ready-to-use version of this:
- `scripts/check-alerts.js` checks alerts for everyone in `registrations.json` every 15
  minutes (via `.github/workflows/alert-check.yml`, which is free on public GitHub repos).
- New alerts are emailed to `<phone>@<carrier-gateway>` (e.g. `4255551234@tmomail.net`),
  which most US carriers deliver to the phone as a free text.

**Setup:**
1. Add each subscriber to `registrations.json`: `{ "zip": "...", "phone": "...", "carrier": "..." }`.
   Supported carriers are listed at the top of `scripts/check-alerts.js`.
2. Create a Gmail account (or use an existing one) and generate an
   [App Password](https://myaccount.google.com/apppasswords).
3. In your GitHub repo, go to **Settings → Secrets and variables → Actions** and add:
   - `EMAIL_USER` — the Gmail address
   - `EMAIL_PASS` — the App Password
4. The workflow runs automatically every 15 minutes. Trigger it manually anytime from the
   **Actions** tab to test.

**Caveats:** carrier email-to-SMS gateways are unofficial, can be delayed, rate-limited, or
occasionally blocked as spam by a carrier. It's genuinely free, but not as reliable as a
dedicated SMS provider. Committing real phone numbers to a public repo also isn't private —
use a private repo, or swap `registrations.json` for a small database if you open this up
to more than a few people.

### Option C — Paid SMS provider (most reliable)
For a real public-facing service, use [Twilio](https://www.twilio.com/) (or similar): about
$0.80 per 100 texts, plus a small serverless function (Cloudflare Worker, AWS Lambda, or a
Vercel function all have free tiers) to replace the email-sending step in
`check-alerts.js` with a Twilio API call. Everything else in this project — the registration
list, the alert-polling logic, the schedule — stays the same.

## 3. Customizing

- **Hazard thresholds** (what counts as "high wind," "hot," etc.) are in `renderGauges()`
  in `index.html` — tune them to match local guidance.
- **Colors, fonts, layout** are all in the `<style>` block at the top of `index.html`.
- **Add air quality / wildfire smoke:** the [AirNow API](https://docs.airnowapi.org/) is
  free with a signup and returns AQI by ZIP — a natural next data source to add alongside
  NWS alerts.
- **Statewide vs. local:** currently unrestricted to any WA ZIP; UW's
  [SnowWatch](https://a.atmos.washington.edu/SNOWWATCH/) and
  [WindWatch](https://a.atmos.washington.edu/SCL/) (mentioned in Cliff Mass's post, and now
  linked from the site's "More Seattle-area tools" section and footer) are Seattle-specific,
  model-based tools — worth digging further into for extra detail in King County than what
  the NWS API alone provides.

## Limits and disclaimer

This is a community tool built on public data, not an official emergency system. Always
follow guidance from the National Weather Service and local emergency management for
actual life-safety decisions. NWS API rate limits and outages will occasionally affect
data availability.
