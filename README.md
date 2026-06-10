# WC26 Sweepstake (Vercel)

A no-login, mobile-first page to track which sweepstake teams are still alive.

- **Today** board at the top — every match today (live scores, finished results, kickoff times).
- One section per person with their 8 teams, plus a row of pips and an `X/8 in` counter.
- Tap any team for its full **results and fixtures**.

It's a static page (`index.html`) plus one serverless function (`api/matches.js`) that proxies [football-data.org](https://www.football-data.org) so the API token never reaches the browser.

## Structure

```
index.html          the whole frontend
api/matches.js       serverless proxy → /api/matches
```

No build step, no dependencies, no config files needed — Vercel serves `index.html` at `/` and turns `api/matches.js` into the `/api/matches` endpoint automatically.

## Deploy

1. Push this folder to a GitHub repo (or run `vercel` from the Vercel CLI in this folder).
2. Import the repo at [vercel.com/new](https://vercel.com/new). Framework preset: **Other** (it's static + a function). Leave build settings empty.
3. Get a free token at https://www.football-data.org/client/register and add it under **Project Settings → Environment Variables**:
   - `FOOTBALL_DATA_TOKEN` = your token
4. Deploy and share the URL. No accounts, everyone sees everything.

Until the token is set you'll see **sample data**, so you can confirm the layout right after deploying.

## Caching

The function sends `Cache-Control: s-maxage=60, stale-while-revalidate=300`, so Vercel's edge CDN serves a cached response for 60s and refreshes in the background after that. The upstream feed is therefore hit at most about once a minute regardless of how many friends are refreshing — comfortably inside the free tier's 10 requests/minute.

## Customise

- **The pool** lives in `index.html` in the `ROSTER` object — edit names and teams there.
- If a team ever shows no fixtures, add the feed's spelling to the `ALIASES` map just below `ROSTER` (matching ignores case and accents).
- Different competition? Set `FOOTBALL_DATA_COMP` (defaults to `WC`).

## Note on "still in"

A team counts as **still in** while it has a match left to play, and **out** once it has none. The full knockout bracket is published in advance as placeholders with no teams assigned yet, so in the ~24h between the last group game and the Round of 32, an advancing team may briefly read as "out" until the feed slots it into its knockout fixture. Fine for a casual pool; ask if you'd like exact group-standings logic to close that gap.
