# caprateadvisory — repo notes for Cowork/Claude

Cap Rate Advisory: Matt Calnan's flat-fee commercial real estate underwriting and deal-analysis practice. Static site + one Vercel serverless function. Canonical operating notes live in the Brain (`Projects/CapRate_Advisory.md`, `Entities/CapRate Advisory.md`); this file covers only the repo.

## Layout
- `caprateadvisory-website.html` — the homepage (single file; CSS + JS inline). Served at `/`.
- `privacy.html`, `terms.html`, `404.html` — built from the homepage's nav/footer/styles. `/privacy`, `/terms`; everything unknown → 404.
- `form-override.js` (and `public/form-override.js`, keep identical) — replaces the modal form's mailto action with a POST to `/api/contact`; sends the honeypot field `website_url`.
- `api/contact.js` — Resend handler. Origin/Referer allowlist, honeypot (returns fake success), field validation, best-effort per-IP rate limit (3 / 10 min), HTML-escaped notification to `matt@calnan.co` (subject prefix `Contact Form - caprateadvisory.com:` — an Outlook rule keys on it) and an auto-reply to the sender. Sends from `matt@calnan.co` (calnan.co is the Resend-verified domain; caprateadvisory.com has no Resend domain).
- `og-image.png` — 1200×630 share image. `robots.txt`, `sitemap.xml`.
- `vercel.json` — explicit builds + routes. `/book` 301s to the Calendly intro call.

## Env
`RESEND_API_KEY` (Production) on Vercel project `caprateadvisory` (team `calnans-projects`). Nothing else. Never paste key values anywhere in this repo or in chat.

## Deploy
Vercel auto-deploys `main`. Verify after every push: `curl -sI https://www.caprateadvisory.com/og-image.png | grep content-type` should be image/png; `/privacy` and `/terms` must not return the homepage; `/nonexistent` must be 404.

## Copy rules (licensing — do not regress)
- Never describe deliverables as an appraisal, valuation, opinion of value, or opinion of estimated price. Analysis is "at the client's stated purchase price". (Texas Occ. Code §1101.002(1)(A)(xi) makes a written price opinion broker activity.)
- Never say Cap Rate Advisory locates properties, procures prospects, negotiates, solicits lenders, arranges/places loans, or takes lender/broker compensation.
- Not investment/securities, legal, tax, accounting, assurance or compilation advice. No "investor summary" / offering-material language for syndication raises — "sponsor economics summary" only.
- Voice is first person singular ("I"). Credentials: "Matt Calnan, CPA, CMA".
- Booking CTA: https://calendly.com/calnanreg/caprate-advisory-intro-call

## Brand
Navy `#0E1F38` · Gold `#B8952E` · Playfair Display (display) / Inter (body).
