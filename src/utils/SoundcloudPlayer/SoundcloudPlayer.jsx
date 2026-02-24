"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudio } from "@/utils/AudioContext";
import "./SoundcloudPlayer.scss";

const SOUNDCLOUD_WIDGET_URL = "https://w.soundcloud.com/player/";
const URL_PLAYLIST = "https://soundcloud.com/krytotytmusic";

function normalizeTitle(title) {
  if (!title) return "";
  return title
    .replace(/[\p{So}\p{Sk}\p{Mn}\p{Lm}\p{Cf}\p{Cs}\p{Co}\p{Cn}\u2000-\u206F\u2E00-\u2E7F\u2600-\u26FF\u2700-\u27BF\uFE00-\uFE0F\u1F900-\u1F9FF\u1F300-\u1F5FF\u1F600-\u1F64F\u1F680-\u1F6FF\u1F700-\u1F77F\u1F780-\u1F7FF\u1F800-\u1F8FF\u1F900-\u1F9FF\u1FA00-\u1FA6F\u1FA70-\u1FAFF\u2300-\u23FF\u25A0-\u25FF\u2190-\u21FF]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SoundcloudPlayer() {
  const { isMuted } = useAudio();
  const playlistUrl = URL_PLAYLIST;

  // Metadata from our API route (server-side, no CAPTCHA)
  const [playlistMeta, setPlaylistMeta] = useState(null);  // { title, artwork_url, tracks[] }
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Widget state
  const [isMounted, setIsMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState("");
  const [isApiReady, setIsApiReady] = useState(false);

  const iframeRef = useRef(null);
  const widgetRef = useRef(null);
  const progressInterval = useRef(null);
  const scriptRef = useRef(null);

  // ── Render iframe only after mount ────────────────────────────────────────
  useEffect(() => { setIsMounted(true); }, []);

  // ── Fetch playlist metadata from our secure API route ──────────────────────
  useEffect(() => {
    fetch("/api/soundcloud")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlaylistMeta(data);
      })
      .catch((err) => {
        console.error("Failed to fetch playlist metadata:", err);
        // Non-fatal — component still works with fallback values
      });
  }, []);

  // ── Derived display values ─────────────────────────────────────────────────
  const currentTrack = playlistMeta?.tracks?.[currentTrackIndex] ?? null;

  const displayTitle = currentTrack?.title
    ? normalizeTitle(currentTrack.title)
    : normalizeTitle(playlistMeta?.title) || "KRYTOTYT playlist";

  const displayArtwork = currentTrack?.artwork_url
    ?? playlistMeta?.artwork_url
    ?? "/assets/player-thumbnail.jpg";

  // ── SoundCloud Widget API ──────────────────────────────────────────────────
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

  const initWidget = useCallback(() => {
    if (!iframeRef.current || !window.SC) return;
    const widget = window.SC.Widget(iframeRef.current);
    widgetRef.current = widget;

    widget.bind(window.SC.Widget.Events.READY, () => {
      setIsLoaded(true);
      setError("");
    });

    widget.bind(window.SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
      // Sync currentTrackIndex so artwork + title update on track change
      widget.getCurrentSoundIndex((idx) => {
        setCurrentTrackIndex(idx ?? 0);
      });
      // Clear any existing interval before starting a new one
      clearInterval(progressInterval.current);
      progressInterval.current = setInterval(() => {
        widget.getPosition((pos) => setPosition(pos));
        widget.getDuration((dur) => setDuration(dur));
      }, 500);
    });

    widget.bind(window.SC.Widget.Events.PAUSE, () => {
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    });

    widget.bind(window.SC.Widget.Events.ERROR, () => {
      setError("Error loading track. Ensure the playlist is public.");
    });
  }, []);

  useEffect(() => {
    if (!playlistUrl || !isApiReady) return;
    const timer = setTimeout(() => initWidget(), 800);
    return () => clearTimeout(timer);
  }, [playlistUrl, isApiReady, initWidget]);

  useEffect(() => () => clearInterval(progressInterval.current), []);

  // ── Playback controls ──────────────────────────────────────────────────────
  const handlePlayPause = () => widgetRef.current?.toggle();
  const handleNext = () => widgetRef.current?.next();

  const progressPct = duration ? (position / duration) * 100 : 0;

  // ── Volume / mute sync ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !widgetRef.current) return;
    widgetRef.current.setVolume(isMuted ? 0 : 80);
    if (!isMuted) {
      widgetRef.current.play();
    } else {
      widgetRef.current.pause();
    }
  }, [isLoaded, isMuted]);

  return (
    <div className="player">
      <div className="player-content">
        <img
          className="player__thumbnail"
          src={displayArtwork}
          alt="Playlist Cover"
        />
        <div className="player__info">
          <span className="player__title">{displayTitle}</span>
          <div className="player__progress">
            <div
              className="player__progress-bar"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* TEST: next track button — remove when no longer needed */}
        <button
          className="player__next"
          onClick={handleNext}
          title="Next track"
          aria-label="Next track"
        >
          <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
            <path d="M2 2L8 6L2 10V2Z" fill="white" />
            <path d="M10 2V10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <a
          href={playlistMeta?.permalink_url ?? playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="player__link"
          title="Open in SoundCloud"
        >
          <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="player__link-icon">
            <g clipPath="url(#clip0_3284_2470)">
              <path
                d="M9.99988 1.99998L1.99984 10M9.99988 1.99998L9.99988 8.85715M9.99988 1.99998L3.1427 1.99998"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id="clip0_3284_2470">
                <rect width="12" height="12" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </a>

        {/* Hidden iframe — SoundCloud Widget API binds to this for playback */}
        {isMounted && (
          <iframe
            ref={iframeRef}
            className="sc-ifram"
            title="SoundCloud Widget"
            src={buildEmbedUrl(playlistUrl)}
            allow="autoplay"
            // style={{ display: "none" }}
          />
        )}
      </div>
    </div>
  );
}