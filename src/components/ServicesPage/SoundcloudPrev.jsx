"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const SOUNDCLOUD_WIDGET_URL = "https://w.soundcloud.com/player/";
const SOUNDCLOUD_PLAYLIST_URL = "https://soundcloud.com/krytotytmusic";

export default function SoundCloudPlayer() {
  const playlistUrl = SOUNDCLOUD_PLAYLIST_URL;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [trackIndex, setCurrentIndex] = useState(0);
  const [totalTracks, setTotalTracks] = useState(0);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isLooping, setIsLooping] = useState(true);
  const [error, setError] = useState("");
  const [isApiReady, setIsApiReady] = useState(false);
  const [isMetaRequested, setIsMetaRequested] = useState(false);
  // Playlist metadata fetched from SoundCloud oEmbed (cover image, title, author)
  const [playlistMeta, setPlaylistMeta] = useState(null);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);

  const iframeRef = useRef(null);
  const widgetRef = useRef(null);
  const progressInterval = useRef(null);
  const scriptRef = useRef(null);

  // Load SoundCloud Widget API script dynamically
  useEffect(() => {
    if (window.SC) { setIsApiReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = () => setIsApiReady(true);
    script.onerror = () => setError("Failed to load SoundCloud API.");
    document.body.appendChild(script);
    scriptRef.current = script;
    return () => { if (scriptRef.current) document.body.removeChild(scriptRef.current); };
  }, []);

  const buildEmbedUrl = (url) => {
    const encoded = encodeURIComponent(url);
    return `${SOUNDCLOUD_WIDGET_URL}?url=${encoded}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false&color=%23ff5500`;
  };

  // Fetch playlist cover + title via our Next.js proxy route (/api/sc-meta).
  // We proxy server-side to avoid the SoundCloud CAPTCHA / CORS block that
  // happens when the browser calls soundcloud.com/oembed directly.
  const fetchPlaylistMeta = async (url) => {
    setIsFetchingMeta(true);
    setPlaylistMeta(null);
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/sc-meta?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setPlaylistMeta({
          title: data.title || "Untitled Playlist",
          thumbnail_url: data.thumbnail_url || null,
          author_name: data.author_name || "",
        });
      } catch {
        // Non-fatal — player still works without the cover image
        setPlaylistMeta(null);
      } finally {
        setIsFetchingMeta(false);
      }
    }, 500); // Delay fetch by 500ms
  };

  const initWidget = useCallback(() => {
    if (!iframeRef.current || !window.SC) return;
    const widget = window.SC.Widget(iframeRef.current);
    widgetRef.current = widget;

    widget.bind(window.SC.Widget.Events.READY, () => {
      setIsLoaded(true);
      setError("");
      widget.setVolume(volume);
      widget.getSounds((sounds) => setTotalTracks(sounds.length));
      widget.getCurrentSound((sound) => { if (sound) setCurrentTrack(sound); });
    });

    widget.bind(window.SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
      widget.getCurrentSoundIndex((i) => setCurrentIndex(i));
      widget.getCurrentSound((sound) => { if (sound) setCurrentTrack(sound); });
      progressInterval.current = setInterval(() => {
        widget.getPosition((pos) => setPosition(pos));
        widget.getDuration((dur) => setDuration(dur));
      }, 500);
    });

    widget.bind(window.SC.Widget.Events.PAUSE, () => {
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    });

    widget.bind(window.SC.Widget.Events.FINISH, () => {
      clearInterval(progressInterval.current);
      // When the last track ends, loop the whole playlist back to track 0
      widget.getCurrentSoundIndex((i) => {
        widget.getSounds((sounds) => {
          if (i >= sounds.length - 1 && isLooping) {
            widget.seekTo(0);
            widget.skip(0);
            widget.play();
          }
        });
      });
    });

    widget.bind(window.SC.Widget.Events.ERROR, () => {
      setError("Error loading track. Ensure the playlist is public.");
    });
  }, [volume, isLooping]);

  // Re-init widget whenever iframe src changes
  useEffect(() => {
    if (!playlistUrl || !isApiReady) return;
    const timer = setTimeout(() => initWidget(), 2000);
    return () => clearTimeout(timer);
  }, [playlistUrl, isApiReady, initWidget]);

  useEffect(() => () => clearInterval(progressInterval.current), []);

  const handlePlayPause = () => widgetRef.current?.toggle();
  const handlePrev = () => widgetRef.current?.prev();
  const handleNext = () => widgetRef.current?.next();

  const handleSeek = (e) => {
    if (!widgetRef.current || !duration) return;
    widgetRef.current.seekTo((parseFloat(e.target.value) / 100) * duration);
  };

  const handleVolume = (e) => {
    const v = parseInt(e.target.value);
    setVolume(v);
    widgetRef.current?.setVolume(v);
  };

  const toggleLoop = () => setIsLooping((p) => !p);

  const formatTime = (ms) => {
    if (!ms) return "0:00";
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const progressPct = duration ? (position / duration) * 100 : 0;

  // Now-playing strip artwork: prefer current track art, fallback to playlist cover
  const stripArt =
    currentTrack?.artwork_url?.replace("-large", "-t200x200") ||
    playlistMeta?.thumbnail_url ||
    null;

  // Only fetch meta when requested
  useEffect(() => {
    if (isMetaRequested && playlistUrl) {
      fetchPlaylistMeta(playlistUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMetaRequested, playlistUrl]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sc-root {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
          padding: 2rem;
        }

        .sc-card {
          width: 100%;
          max-width: 520px;
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 3px;
          overflow: hidden;
          box-shadow: 0 0 100px rgba(255,85,0,0.07), 0 24px 48px rgba(0,0,0,0.6);
        }

        /* ── Header ── */
        .sc-header {
          background: #ff5500;
          padding: 1.2rem 1.6rem;
        }
        .sc-header-logo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.7rem;
          color: #fff;
          letter-spacing: 0.04em;
          line-height: 1;
        }
        .sc-header-sub {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.7);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-top: 3px;
        }

        /* ── Playlist Cover ── */
        .sc-cover-section {
          position: relative;
          width: 100%;
          aspect-ratio: 16/7;
          background: #0e0e0e;
          overflow: hidden;
        }
        .sc-cover-bg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.4) saturate(1.3);
          transition: filter 0.4s;
        }
        .sc-cover-section:hover .sc-cover-bg {
          filter: brightness(0.55) saturate(1.5);
        }
        .sc-cover-fg {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          padding: 1.1rem 1.4rem;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 65%);
        }
        .sc-cover-thumb {
          width: 62px;
          height: 62px;
          object-fit: cover;
          border-radius: 2px;
          border: 2px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
          margin-right: 1rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .sc-cover-playlist-label {
          font-size: 0.52rem;
          color: #ff5500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .sc-cover-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.35rem;
          color: #fff;
          letter-spacing: 0.04em;
          line-height: 1.1;
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sc-cover-author {
          font-size: 0.58rem;
          color: rgba(255,255,255,0.5);
          margin-top: 3px;
        }
        .sc-cover-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 0.5rem;
          color: #333;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
        }
        .sc-cover-spinner {
          font-size: 2rem;
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── Body ── */
        .sc-body { padding: 1.4rem 1.6rem; }

        .sc-btn {
          background: #ff5500;
          color: #fff;
          border: none;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1rem;
          letter-spacing: 0.08em;
          padding: 0 1.2rem;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          white-space: nowrap;
        }
        .sc-btn:hover { background: #e64d00; }
        .sc-btn:active { transform: scale(0.97); }
        .sc-btn:disabled { background: #2a2a2a; color: #555; cursor: not-allowed; }

        .sc-error {
          color: #ff4444;
          font-size: 0.62rem;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        /* Hidden iframe — Widget API binds to this */
        .sc-iframe { display: none; }

        /* Loading */
        .sc-loading {
          text-align: center;
          color: #555;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          padding: 0.8rem 0;
        }
        .sc-dot {
          display: inline-block;
          animation: blink 1.2s infinite;
        }
        .sc-dot:nth-child(2) { animation-delay: 0.2s; }
        .sc-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }

        /* ── Now Playing strip ── */
        .sc-now-playing {
          background: #181818;
          border: 1px solid #242424;
          border-radius: 2px;
          padding: 0.9rem;
          margin-bottom: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.9rem;
          min-height: 68px;
        }
        .sc-artwork {
          width: 48px;
          height: 48px;
          border-radius: 2px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .sc-artwork-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 2px;
          background: #222;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .sc-track-info { flex: 1; overflow: hidden; }
        .sc-track-title {
          font-size: 0.72rem;
          color: #fff;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        }
        .sc-track-artist {
          font-size: 0.6rem;
          color: #777;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sc-track-count {
          font-size: 0.58rem;
          color: #ff5500;
          letter-spacing: 0.1em;
          margin-top: 4px;
        }

        /* Progress */
        .sc-progress-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-bottom: 1rem;
        }
        .sc-time { font-size: 0.58rem; color: #555; width: 30px; flex-shrink: 0; }
        .sc-time:last-child { text-align: right; }
        .sc-slider {
          flex: 1;
          -webkit-appearance: none;
          height: 3px;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .sc-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 11px;
          height: 11px;
          background: #ff5500;
          border-radius: 50%;
          cursor: pointer;
        }
        .sc-slider::-moz-range-thumb {
          width: 11px;
          height: 11px;
          background: #ff5500;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }

        /* Controls */
        .sc-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.1rem;
          margin-bottom: 1.1rem;
        }
        .sc-ctrl-btn {
          background: transparent;
          border: none;
          color: #777;
          cursor: pointer;
          font-size: 1.15rem;
          padding: 0.4rem;
          border-radius: 2px;
          transition: color 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sc-ctrl-btn:hover { color: #fff; }
        .sc-ctrl-btn:active { transform: scale(0.88); }
        .sc-play-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: #ff5500;
          color: #fff;
          font-size: 1.2rem;
        }
        .sc-play-btn:hover { background: #e64d00; color: #fff; }
        .sc-loop-btn { font-size: 0.95rem; }
        .sc-loop-btn.active { color: #ff5500; }

        /* Volume */
        .sc-vol-row {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .sc-vol-icon { font-size: 0.85rem; color: #555; }

        /* Empty state */
        .sc-empty {
          color: #333;
          font-size: 0.62rem;
          text-align: center;
          padding: 1.5rem 0;
          letter-spacing: 0.1em;
          line-height: 2;
        }
      `}</style>

      <div className="sc-root">
        <div className="sc-card">

          {/* Header */}
          <div className="sc-header">
            <div className="sc-header-logo">SoundCloud</div>
            <div className="sc-header-sub">Playlist Player · Loop Mode</div>
          </div>

          {/* Load Playlist Info Button */}
          {!isMetaRequested && (
            <div style={{ padding: '1.2rem 1.6rem', textAlign: 'center' }}>
              <button
                className="sc-btn"
                onClick={() => setIsMetaRequested(true)}
                disabled={isFetchingMeta}
                style={{ minWidth: 180 }}
              >
                {isFetchingMeta ? 'Loading...' : 'Load Playlist Info'}
              </button>
            </div>
          )}

          {/* ── Playlist Cover Image (fetched via oEmbed) ── */}
          {isMetaRequested && (playlistMeta || isFetchingMeta) && (
            <div className="sc-cover-section">
              {playlistMeta?.thumbnail_url ? (
                <>
                  {/* Blurred background fill */}
                  <img
                    className="sc-cover-bg"
                    src={playlistMeta.thumbnail_url}
                    alt=""
                    aria-hidden="true"
                  />
                  {/* Foreground overlay with thumbnail + metadata */}
                  <div className="sc-cover-fg">
                    <img
                      className="sc-cover-thumb"
                      src={playlistMeta.thumbnail_url}
                      alt={playlistMeta.title}
                    />
                    <div>
                      <div className="sc-cover-playlist-label">Playlist</div>
                      <div className="sc-cover-title">{playlistMeta.title}</div>
                      <div className="sc-cover-author">{playlistMeta.author_name}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="sc-cover-placeholder">
                  {isFetchingMeta ? (
                    <>
                      <div className="sc-cover-spinner">🎵</div>
                      <span>FETCHING COVER</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "2.5rem" }}>🎵</span>
                      <div style={{ color: "#666", fontSize: "0.75rem", marginTop: "0.3rem" }}>
                        {playlistMeta?.title}
                      </div>
                      <div style={{ color: "#444", fontSize: "0.6rem" }}>
                        {playlistMeta?.author_name}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="sc-body">
            {/* Hidden iframe — SoundCloud Widget API binds to this element */}
            {playlistUrl && (
              <iframe
                ref={iframeRef}
                className="sc-ifram"
                title="SoundCloud Widget"
                src={buildEmbedUrl(playlistUrl)}
                allow="autoplay"
              />
            )}

            {/* Loading state */}
            {playlistUrl && !isLoaded && !error && (
              <div className="sc-loading">
                LOADING
                <span className="sc-dot">.</span>
                <span className="sc-dot">.</span>
                <span className="sc-dot">.</span>
              </div>
            )}

            {/* Player controls — visible once widget is ready */}
            {isLoaded && (
              <>
                {/* Now Playing strip */}
                <div className="sc-now-playing">
                  {stripArt ? (
                    <img className="sc-artwork" src={stripArt} alt="artwork" />
                  ) : (
                    <div className="sc-artwork-placeholder">🎵</div>
                  )}
                  <div className="sc-track-info">
                    <div className="sc-track-title">{currentTrack?.title || "—"}</div>
                    <div className="sc-track-artist">
                      {currentTrack?.user?.username || "Unknown Artist"}
                    </div>
                    {totalTracks > 0 && (
                      <div className="sc-track-count">
                        {trackIndex + 1} / {totalTracks} tracks
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="sc-progress-row">
                  <span className="sc-time">{formatTime(position)}</span>
                  <input
                    className="sc-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progressPct}
                    onChange={handleSeek}
                    style={{
                      background: `linear-gradient(to right, #ff5500 ${progressPct}%, #2a2a2a ${progressPct}%)`,
                    }}
                  />
                  <span className="sc-time">{formatTime(duration)}</span>
                </div>

                {/* Playback controls */}
                <div className="sc-controls">
                  <button
                    className={`sc-ctrl-btn sc-loop-btn ${isLooping ? "active" : ""}`}
                    onClick={toggleLoop}
                    title={isLooping ? "Loop on — click to disable" : "Loop off — click to enable"}
                  >
                    🔁
                  </button>
                  <button className="sc-ctrl-btn" onClick={handlePrev} title="Previous track">⏮</button>
                  <button
                    className="sc-ctrl-btn sc-play-btn"
                    onClick={handlePlayPause}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? "⏸" : "▶"}
                  </button>
                  <button className="sc-ctrl-btn" onClick={handleNext} title="Next track">⏭</button>
                  <span style={{ width: "32px" }} aria-hidden="true" />
                </div>

                {/* Volume */}
                <div className="sc-vol-row">
                  <span className="sc-vol-icon">🔈</span>
                  <input
                    className="sc-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolume}
                    style={{
                      background: `linear-gradient(to right, #ff5500 ${volume}%, #2a2a2a ${volume}%)`,
                    }}
                  />
                  <span className="sc-vol-icon">🔊</span>
                </div>
              </>
            )}

            {/* Empty state */}
            {!playlistUrl && (
              <div className="sc-empty">
                PASTE A PUBLIC SOUNDCLOUD<br />PLAYLIST URL ABOVE TO BEGIN
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}