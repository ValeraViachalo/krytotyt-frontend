// app/api/soundcloud/route.js

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing env vars — make sure SOUNDCLOUD_CLIENT_ID and SOUNDCLOUD_CLIENT_SECRET are set in .env.local and you restarted the dev server"
    );
  }

  console.log("[soundcloud] Requesting access token...");

  // SoundCloud supports two token endpoint formats — try both
  // Some registered apps use the /token path, some use /oauth/token
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  let res = await fetch("https://secure.soundcloud.com/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json; charset=utf-8",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  // If that fails, try the alternative endpoint
  if (!res.ok) {
    const errText = await res.text();
    console.warn(`[soundcloud] /oauth/token failed (${res.status}): ${errText}`);
    console.log("[soundcloud] Trying alternative endpoint...");

    res = await fetch("https://api.soundcloud.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[soundcloud] All token endpoints failed (${res.status}): ${errText}`);
    throw new Error(`Token request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  console.log("[soundcloud] Token obtained successfully, expires in:", data.expires_in, "s");

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 21600) * 1000;
  return cachedToken;
}

function upsizeArtwork(url) {
  if (!url) return null;
  return url
    .replace("-large", "-t500x500")
    .replace("-t67x67", "-t500x500")
    .replace("-t200x200", "-t500x500");
}

export async function GET() {
  try {
    const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
    const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
    const playlistUrl = process.env.SOUNDCLOUD_PLAYLIST_URL;

    // Log env state (safe — only logs presence, not values)
    console.log("[soundcloud] Env check:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasPlaylistUrl: !!playlistUrl,
      playlistUrl,
    });

    if (!playlistUrl) {
      return Response.json(
        { error: "Missing SOUNDCLOUD_PLAYLIST_URL in .env.local" },
        { status: 500 }
      );
    }

    const token = await getAccessToken();

    // Resolve playlist URL → playlist object
    console.log("[soundcloud] Resolving playlist:", playlistUrl);
    const resolveRes = await fetch(
      `https://api.soundcloud.com/resolve?url=${encodeURIComponent(playlistUrl)}`,
      { headers: { Authorization: `OAuth ${token}` } }
    );

    if (!resolveRes.ok) {
      const errText = await resolveRes.text();
      console.error(`[soundcloud] Resolve failed (${resolveRes.status}):`, errText);
      throw new Error(`Resolve failed (${resolveRes.status}): ${errText}`);
    }

    const playlist = await resolveRes.json();
    console.log("[soundcloud] Playlist resolved:", {
      id: playlist.id,
      title: playlist.title,
      trackCount: playlist.tracks?.length,
      kind: playlist.kind,
    });

    let tracks = playlist.tracks ?? [];

    // If tracks came back as stubs (only id, no title), fetch full track data
    const needsFullFetch = tracks.length > 0 && !tracks[0].title;
    if (tracks.length === 0 || needsFullFetch) {
      console.log("[soundcloud] Fetching full track list for playlist id:", playlist.id);
      const tracksRes = await fetch(
        `https://api.soundcloud.com/playlists/${playlist.id}/tracks?limit=200`,
        { headers: { Authorization: `OAuth ${token}` } }
      );
      if (tracksRes.ok) {
        tracks = await tracksRes.json();
        console.log("[soundcloud] Got", tracks.length, "tracks");
      } else {
        const errText = await tracksRes.text();
        console.warn("[soundcloud] Tracks fetch failed:", errText);
      }
    }

    return Response.json({
      title: playlist.title ?? "",
      artwork_url: upsizeArtwork(
        playlist.artwork_url ?? tracks[0]?.artwork_url ?? null
      ),
      permalink_url: playlist.permalink_url ?? playlistUrl,
      tracks: tracks.map((t) => ({
        id: t.id,
        title: t.title ?? "",
        artwork_url: upsizeArtwork(t.artwork_url),
        duration: t.duration ?? 0,
        permalink_url: t.permalink_url ?? "",
      })),
    });
  } catch (err) {
    console.error("[soundcloud] Route error:", err.message);
    return Response.json({ error: err.message }, { status: 502 });
  }
}