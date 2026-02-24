"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudio } from "@/utils/AudioContext";
import "./SoundcloudPlayer.scss";

const SOUNDCLOUD_WIDGET_URL = "https://w.soundcloud.com/player/";
const URL_PLAYLIST = "https://soundcloud.com/krytotytmusic/";

// Extract and upsize artwork URL from a sound object
function extractArtwork(sound) {
  if (!sound) return null;
  const raw = sound.playlist_artwork_url || sound.artwork_url || null;
  if (!raw) return null;
  return raw
    .replace("-large", "-t500x500")
    .replace("-t67x67", "-t500x500")
    .replace("-t200x200", "-t500x500");
}

export default function SoundcloudPlayer() {
  const { isMuted } = useAudio();
  const playlistUrl = URL_PLAYLIST;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [playlistThumbnail, setPlaylistThumbnail] = useState(null);
  const [error, setError] = useState("");
  const [isApiReady, setIsApiReady] = useState(false);

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

  // Update title + thumbnail from a sound object
  const applyTrackMeta = useCallback((sound) => {
    if (!sound) return;
    const thumb = extractArtwork(sound);
    if (thumb) setPlaylistThumbnail(thumb);
    const title = sound.title || "";
    if (title) setPlaylistTitle(title);
  }, []);

  const initWidget = useCallback(() => {
    if (!iframeRef.current || !window.SC) return;
    const widget = window.SC.Widget(iframeRef.current);
    widgetRef.current = widget;

    widget.bind(window.SC.Widget.Events.READY, () => {
      setIsLoaded(true);
      setError("");
      // Seed title + thumbnail from the first track on load
      widget.getSounds((sounds) => {
        if (sounds?.length) applyTrackMeta(sounds[0]);
      });
    });

    // PLAY fires on every track start (initial play + after next/prev skip)
    // → refresh title and thumbnail here so they always match the current track
    widget.bind(window.SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
      widget.getCurrentSound((sound) => applyTrackMeta(sound));
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
  }, [applyTrackMeta]);

  useEffect(() => {
    if (!playlistUrl || !isApiReady) return;
    const timer = setTimeout(() => initWidget(), 800);
    return () => clearTimeout(timer);
  }, [playlistUrl, isApiReady, initWidget]);

  useEffect(() => () => clearInterval(progressInterval.current), []);

  const handlePlayPause = () => widgetRef.current?.toggle();
  const handleNext = () => widgetRef.current?.next();

  const progressPct = duration ? (position / duration) * 100 : 0;

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
          src={playlistThumbnail || "/assets/player-thumbnail.jpg"}
          alt="Playlist Cover"
        />
        <div className="player__info">
          <span className="player__title">
            {playlistTitle || "KRYTOTYT playlist"}
          </span>
          <div className="player__progress">
            <div
              className="player__progress-bar"
              style={{ width: `${progressPct}%` }}
            ></div>
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
          href={playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="player__link"
          title="Open in SoundCloud"
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="player__link-icon"
          >
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

        {/* Hidden iframe — SoundCloud Widget API binds to this */}
        <iframe
          ref={iframeRef}
          className="sc-iframe"
          title="SoundCloud Widget"
          src={buildEmbedUrl(playlistUrl)}
          allow="autoplay"
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}