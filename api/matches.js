// Vercel serverless function — proxies World Cup match data so the API token
// stays server-side. The Cache-Control header below makes Vercel's edge CDN
// serve a cached copy for 60s, so football-data.org is hit at most ~once a
// minute no matter how many friends refresh (free tier = 10 req/min).
//
// Env vars (Project Settings → Environment Variables):
//   FOOTBALL_DATA_TOKEN  free token from football-data.org/client/register
//   FOOTBALL_DATA_COMP   competition code (optional, defaults to "WC")

const TOKEN = process.env.FOOTBALL_DATA_TOKEN;
const COMP = process.env.FOOTBALL_DATA_COMP || "WC";

function team(t) {
  t = t || {};
  return {
    name: t.name ?? null,
    shortName: t.shortName ?? null,
    tla: t.tla ?? null,
    crest: t.crest ?? null,
  };
}

function trim(m) {
  const score = m.score || {};
  const ft = score.fullTime || {};
  return {
    id: m.id,
    utcDate: m.utcDate,
    status: m.status,
    stage: m.stage,
    group: m.group,
    matchday: m.matchday,
    home: team(m.homeTeam),
    away: team(m.awayTeam),
    winner: score.winner ?? null,
    homeScore: ft.home ?? null,
    awayScore: ft.away ?? null,
  };
}

// A few fake matches dated around "now" so the page renders before a token is set.
function sample() {
  const now = Date.now();
  const iso = (ms) => new Date(now + ms).toISOString();
  const t = (name, tla) => ({ name, shortName: name, tla, crest: null });
  return [
    {
      id: 1,
      utcDate: iso(-3 * 3600e3),
      status: "FINISHED",
      stage: "GROUP_STAGE",
      group: "GROUP_A",
      matchday: 1,
      home: t("Mexico", "MEX"),
      away: t("South Africa", "RSA"),
      winner: "HOME_TEAM",
      homeScore: 2,
      awayScore: 1,
    },
    {
      id: 2,
      utcDate: iso(-25 * 60e3),
      status: "IN_PLAY",
      stage: "GROUP_STAGE",
      group: "GROUP_H",
      matchday: 1,
      home: t("Spain", "ESP"),
      away: t("Cape Verde", "CPV"),
      winner: null,
      homeScore: 1,
      awayScore: 0,
    },
    {
      id: 3,
      utcDate: iso(2 * 3600e3),
      status: "TIMED",
      stage: "GROUP_STAGE",
      group: "GROUP_L",
      matchday: 1,
      home: t("Portugal", "POR"),
      away: t("Norway", "NOR"),
      winner: null,
      homeScore: null,
      awayScore: null,
    },
    {
      id: 4,
      utcDate: iso(25 * 3600e3),
      status: "TIMED",
      stage: "GROUP_STAGE",
      group: "GROUP_D",
      matchday: 1,
      home: t("United States", "USA"),
      away: t("Turkey", "TUR"),
      winner: null,
      homeScore: null,
      awayScore: null,
    },
    {
      id: 5,
      utcDate: iso(48 * 3600e3),
      status: "TIMED",
      stage: "GROUP_STAGE",
      group: "GROUP_K",
      matchday: 1,
      home: t("France", "FRA"),
      away: t("Sweden", "SWE"),
      winner: null,
      homeScore: null,
      awayScore: null,
    },
  ];
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  if (!TOKEN) {
    res
      .status(200)
      .json({
        source: "sample",
        updated: Date.now() / 1000,
        matches: sample(),
      });
    return;
  }

  try {
    const r = await fetch(
      `https://api.football-data.org/v4/competitions/${COMP}/matches`,
      {
        headers: { "X-Auth-Token": TOKEN },
      },
    );
    if (!r.ok) throw new Error(`feed responded ${r.status}`);
    const raw = (await r.json()).matches || [];
    res
      .status(200)
      .json({
        source: "live",
        updated: Date.now() / 1000,
        matches: raw.map(trim),
      });
  } catch (e) {
    res
      .status(200)
      .json({
        source: "error",
        error: String(e),
        updated: Date.now() / 1000,
        matches: [],
      });
  }
};
