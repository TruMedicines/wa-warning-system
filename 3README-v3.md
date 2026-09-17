# WA Watch

A live, ZIP-code-specific hazard dashboard for Washington State. Enter a WA ZIP code and get
active NWS alerts, a 7-day forecast, nearby USGS river gauges, active wildfire perimeters,
open FEMA/Red Cross shelters, power-outage links, and live traffic camera links — all in one
page, installable to a phone's home screen, no login required.

Live at: https://trumedicines.github.io/wa-warning-system/

Inspired by [Cliff Mass's proposal](https://cliffmass.blogspot.com/) for a Seattle-area
environmental warning system.

## What it does

- Enter any WA ZIP code → live NWS alerts, 7-day forecast, USGS river gauges, wildfire
  perimeters, and open shelters for that spot, plus traffic camera and power-outage links.
- No backend, no build step, and no API keys required for anything the page loads by default.
- Installable as a Progressive Web App (Add to Home Screen) on Android and iPhone.
- Browser push notifications while the tab/app is open (polls every 5 minutes for new alerts).

## Data sources

| Section | Source | Live? |
|---|---|---|
| Active alerts | [National Weather Service API](https://www.weather.gov/documentation/services-web-api) | Yes, no key |
| 7-day outlook | National Weather Service API | Yes, no key |
| River & stream gauges | [USGS Water Services](https://waterservices.usgs.gov/) | Yes, no key — nearest 6 gauges within ~30 mi, sorted by distance |
| Wildfire perimeters | [NIFC / WFIGS](https://data-nifc.opendata.arcgis.com/) interagency fire data | Yes, no key — active fires within ~75 mi |
| Emergency shelters | [FEMA National Shelter System](https://gis.fema.gov/arcgis/rest/services/NSS/OpenShelters/MapServer) (synced daily from the Red Cross) | Yes, no key — open shelters within ~50 mi |
| Traffic cameras | WSDOT / regional live camera pages | Links only, not embedded — see below |
| Power outages | Individual WA utility outage maps | Links only, not a live feed — see below |
| ZIP → location | [Zippopotam.us](https://www.zippopotam.us/) | Yes, no key |

### Why traffic cameras and power outages are links, not live feeds

**Traffic cameras / road alerts:** WSDOT's Traveler Information API (alerts and camera
metadata alike) requires a free access code *and* doesn't support direct browser requests
(no CORS) — a static site can't call it without either a backend proxy or a workaround like
JSONP, both of which add fragility for a single-page tool like this. Rather than ship
something that silently breaks, the "Traffic cameras" section links straight to WSDOT's own
live camera pages for Washington's main corridors (I-5 Seattle/Tacoma, I-90 Snoqualmie Pass,
US-2 Stevens Pass, I-405, SR-520, Seattle city cameras). One click, always current.

**Power outages:** there's no single free, live, statewide outage feed — every WA utility
runs its own map, and most don't publish a public API. Rather than guess or fake a status,
this section links directly to the real outage maps for the state's largest utilities
(Seattle City Light, PSE, Snohomish PUD, Tacoma Power, Clark PUD, Avista).

If you use a utility that publishes a public ArcGIS feature service for outages, that could
be wired in as a real live feed the same way the wildfire and shelter data are.

## 1. Deploy it (free, ~5 minutes)

**GitHub Pages:**
1. Create a new GitHub repo and push everything in this folder to it (`index.html`,
   `manifest.json`, `sw.js`, `icons/`, `README.md`, and the `scripts/`, `.github/`, and
   `registrations.json` files if you want free SMS — see below).
2. Repo → **Settings → Pages** → Source: "Deploy from a branch" → Branch: `main` / `root`.
3. Your site is live at `https://<your-username>.github.io/<repo-name>/`.

Any other free static host works the same way (Cloudflare Pages, Netlify, Vercel) — just
drag-and-drop this folder in.

## 2. Getting real text messages (the honest tradeoffs)

A static site can't send a text message while your phone is asleep and the site is closed —
that always requires *something* running on a server. There's no way around that; it's not
a limitation of this project specifically. Three real options, cheapest first:

### Option A — Browser push (already built in, $0, works today)
Click "Enable browser alerts" in the "Get alerts" section. As long as the tab is open, or
you've installed the site to your home screen and it's running, you'll get a native-style
notification within 5 minutes of a new NWS alert. Doesn't work if the phone is asleep or the
app is fully closed.

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

- **Colors, fonts, layout** are all in the `<style>` block at the top of `index.html`.
- **Search radii** (30 mi for river gauges, 75 mi for wildfires, 50 mi for shelters) are set
  in the `milesBBox(...)` calls inside each `load...Data()` function.
- **Add air quality / wildfire smoke:** the [AirNow API](https://docs.airnowapi.org/) is
  free with a signup and returns AQI by ZIP — a natural next data source to add.
- **Statewide vs. local:** currently unrestricted to any WA ZIP; UW's
  [SnowWatch](https://a.atmos.washington.edu/SNOWWATCH/) and
  [WindWatch](https://a.atmos.washington.edu/SCL/) are Seattle-specific, model-based tools
  worth linking to for extra King County detail beyond what the NWS API alone provides.

## Fixed since the last version

Two data sources were pointing at ArcGIS service IDs that didn't exist (`services3.arcgis.com/T4QD1APJqA2vdFcY/.../CY_Wildfire_Perimeters`
for wildfires and `services1.arcgis.com/Hp6G80Pky0om7QvQ/.../National_Shelter_System_Facilities`
for shelters — both returned `"Invalid URL"` errors, silently caught and replaced with vague
fallback text). They're now pointed at the real, verified NIFC/WFIGS and FEMA NSS services.
The USGS gauge list also previously ignored the entered ZIP's location entirely and just
showed five arbitrary statewide sites; it now filters and sorts by actual distance. The old
WSDOT road-alerts feature (which needed a private key baked into client-side code) was
removed in favor of direct camera links, described above.

## Limits and disclaimer

This is a community tool built on public data, not an official emergency system. Always
follow guidance from the National Weather Service and local emergency management for actual
life-safety decisions. Third-party APIs (NWS, USGS, NIFC, FEMA) can occasionally be slow or
briefly unavailable — the page is built to degrade gracefully (each section fails
independently with a plain message) rather than break the whole dashboard.
