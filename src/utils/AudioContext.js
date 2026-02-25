"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getSoundcloudPlaylist } from "@/app/actions";

const AudioContext = createContext();

const SOUNDCLOUD_WIDGET_URL = "https://w.soundcloud.com/player/";
const URL_PLAYLIST = process.env.SOUNDCLOUD_PLAYLIST_URL || "https://soundcloud.com/krytotytmusic/sets/home-mixes?si=d119afe4f7f14eeea60e00678789d5fb&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing";

function buildEmbedUrl(url) {
  const encoded = encodeURIComponent(url);
  return `${SOUNDCLOUD_WIDGET_URL}?url=${encoded}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false&color=%23ff5500`;
}

export function AudioProvider({ children }) {
  const [isMuted, setIsMuted] = useState(true);

  // ── iframe / SC API readiness ──────────────────────────────────────────────
  const [isMounted, setIsMounted] = useState(false);       // iframe rendered?
  const [isApiReady, setIsApiReady] = useState(false);     // SC script loaded?
  const [isPlayerReady, setIsPlayerReady] = useState(false); // widget READY fired?

  // ── Playlist metadata (fetched once, shared with all consumers) ──────────
  const [playlistMeta, setPlaylistMeta] = useState(null);

  // ── Playback state (consumed by SoundcloudPlayer UI) ─────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const iframeRef = useRef(null);
  const widgetRef = useRef(null);
  const progressInterval = useRef(null);
  const scriptRef = useRef(null);

  // ── 1. Mount iframe after hydration ──────────────────────────────────────
  useEffect(() => { setIsMounted(true); }, []);

  // ── 2. Fetch playlist metadata ────────────────────────────────────────────
  useEffect(() => {
    getSoundcloudPlaylist()
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setPlaylistMeta(data);
      })
      .catch((err) => console.error("[AudioProvider] metadata fetch failed:", err));
  }, []);

  // ── 2. Load SC Widget API script ─────────────────────────────────────────
  useEffect(() => {
    if (!isMounted) return;
    if (window.SC) { setIsApiReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;
    script.onload = () => setIsApiReady(true);
    document.body.appendChild(script);
    scriptRef.current = script;
    return () => {
      if (scriptRef.current) document.body.removeChild(scriptRef.current);
    };
  }, [isMounted]);

  // ── 3. Bind Widget events once API + iframe are ready ────────────────────
  const initWidget = useCallback(() => {
    if (!iframeRef.current || !window.SC) return;
    const widget = window.SC.Widget(iframeRef.current);
    widgetRef.current = widget;

    widget.bind(window.SC.Widget.Events.READY, () => {
      setIsPlayerReady(true);
    });

    widget.bind(window.SC.Widget.Events.PLAY, () => {
      setIsPlaying(true);
      widget.getCurrentSoundIndex((idx) => setCurrentTrackIndex(idx ?? 0));
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

    widget.bind(window.SC.Widget.Events.FINISH, () => {
      setIsPlaying(false);
      clearInterval(progressInterval.current);
    });
  }, []);

  useEffect(() => {
    if (!isApiReady) return;
    const timer = setTimeout(() => initWidget(), 800);
    return () => clearTimeout(timer);
  }, [isApiReady, initWidget]);

  // ── 4. Sync volume/playback when mute or ready state changes ─────────────
  useEffect(() => {
    if (!isPlayerReady || !widgetRef.current) return;
    widgetRef.current.setVolume(isMuted ? 0 : 80);
    if (!isMuted) {
      widgetRef.current.play();
    } else {
      widgetRef.current.pause();
    }
  }, [isPlayerReady, isMuted]);

  // ── 5. Cleanup interval on unmount ───────────────────────────────────────
  useEffect(() => () => clearInterval(progressInterval.current), []);

  // ── Exposed controls ──────────────────────────────────────────────────────
  const next = useCallback(() => widgetRef.current?.next(), []);
  const prev = useCallback(() => widgetRef.current?.prev(), []);
  const toggle = useCallback(() => widgetRef.current?.toggle(), []);

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        setIsMuted,
        isPlayerReady,
        isPlaying,
        currentTrackIndex,
        position,
        duration,
        playlistMeta,
        next,
        prev,
        toggle,
      }}
    >
      {children}

      {/* Hidden iframe lives here so it persists across page navigations */}
      {isMounted && (
        <iframe
          ref={iframeRef}
          title="SoundCloud Widget"
          src={buildEmbedUrl(URL_PLAYLIST)}
          allow="autoplay"
          style={{ display: "none" }}
        />
      )}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
