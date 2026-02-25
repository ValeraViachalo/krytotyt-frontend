"use server";

import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────────────────────
// SoundCloud helpers
// ─────────────────────────────────────────────────────────────────────────────

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SOUNDCLOUD_CLIENT_ID or SOUNDCLOUD_CLIENT_SECRET env vars");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  let res = await fetch("https://secure.soundcloud.com/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json; charset=utf-8",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) {
    res = await fetch("https://api.soundcloud.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
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
    throw new Error(`Token request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 21600) * 1000;
  return cachedToken;
}

function upsizeArtwork(url) {
  if (!url) return null;
  return url
    .replace(/-large(?=\.|$)/, "-t500x500")
    .replace("-t67x67", "-t500x500")
    .replace("-t200x200", "-t500x500");
}

export async function getSoundcloudPlaylist() {
  try {
    const token = await getAccessToken();
    const playlistUrl = process.env.SOUNDCLOUD_PLAYLIST_URL;

    if (!playlistUrl) {
      throw new Error("Missing SOUNDCLOUD_PLAYLIST_URL env var");
    }

    // Try resolving the URL directly (works for playlist/track URLs)
    let resolveRes = await fetch(
      `https://api.soundcloud.com/resolve?url=${encodeURIComponent(playlistUrl)}`,
      { headers: { Authorization: `OAuth ${token}` } }
    );

    let playlist = null;

    if (resolveRes.ok) {
      const resolved = await resolveRes.json();

      // If it resolved to a user profile, grab their first public playlist
      if (resolved.kind === "user") {
        const setsRes = await fetch(
          `https://api.soundcloud.com/users/${resolved.id}/playlists?limit=1`,
          { headers: { Authorization: `OAuth ${token}` } }
        );
        if (!setsRes.ok) throw new Error(`Playlists fetch failed (${setsRes.status})`);
        const sets = await setsRes.json();
        playlist = sets[0] ?? null;
      } else {
        playlist = resolved;
      }
    }

    if (!playlist) throw new Error("Could not resolve a playlist from SOUNDCLOUD_PLAYLIST_URL");

    let tracks = playlist.tracks ?? [];

    // Stubs come back without titles — fetch full track objects
    if (tracks.length === 0 || (tracks.length > 0 && !tracks[0].title)) {
      const tracksRes = await fetch(
        `https://api.soundcloud.com/playlists/${playlist.id}/tracks?limit=200`,
        { headers: { Authorization: `OAuth ${token}` } }
      );
      if (tracksRes.ok) {
        tracks = await tracksRes.json();
      }
    }

    return {
      title: playlist.title ?? "",
      artwork_url: upsizeArtwork(playlist.artwork_url ?? tracks[0]?.artwork_url ?? null),
      permalink_url: playlist.permalink_url ?? playlistUrl,
      tracks: tracks.map((t) => ({
        id: t.id,
        title: t.title ?? "",
        artwork_url: upsizeArtwork(t.artwork_url),
        duration: t.duration ?? 0,
        permalink_url: t.permalink_url ?? "",
      })),
    };
  } catch (err) {
    console.error("[getSoundcloudPlaylist]", err.message);
    return { error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email action
// ─────────────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.AUTH_PASS,
  },
});

export async function sendEmail(data) {
  try {
    const nameText = `${data.name ? `Name: ${data.name}` : "No name provided"}`;
    const emailText = `${data.email ? `Email: ${data.email}` : "No email provided"}`;
    const messageText = `${data.message ? `Message: \n${data.message}` : "No message provided"}`;

    // Plain text email (backup)
    const plainText = `${nameText}\n\n${emailText}\n\n${messageText}`;

    // HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Нове повідомлення з сайту</title>
        <style>
          body {
            font-family: Inter, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .container {
            padding: 20px;
            border: 1px solid #e1e1e1;
            border-radius: 5px;
          }
          .header {
            background-color: #000;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 5px 5px 0 0;
            margin-bottom: 20px;
          }
          .content {
            padding: 0 15px;
          }
          .field {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #f0f0f0;
          }
          .field:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            margin-bottom: 5px;
            color: #525252;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #888;
          }
          .message-text {
            white-space: pre-wrap;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Нове повідомлення від ${data.name || "{Не надано}"}</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Ім'я:</div>
              <div>${data.name || "{Не надано}"}</div>
            </div>
            <div class="field">
              <div class="label">Email:</div>
              <div>${data.email || "{Не надано}"}</div>
            </div>
            ${
              data.message
                ? `
            <div class="field">
              <div class="label">Повідомлення:</div>
              <div class="message-text">${data.message.replace(/\n/g, "<br>")}</div>
            </div>
            `
                : ""
            }
          </div>
          <div class="footer">
            <p>Це повідомлення було надіслано з контактної форми на сайті Krytotyt.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_SENDER,
      to: process.env.EMAIL_RECEIVER,
      subject: data.name
        ? `Нове повідомлення від ${data.name}`
        : "Нове повідомлення з сайту Krytotyt",
      text: plainText,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
}
