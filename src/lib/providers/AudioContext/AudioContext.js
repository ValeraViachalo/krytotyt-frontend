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
  const resetOnPlayRef = useRef(false);

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
      if (resetOnPlayRef.current) {
        widget.seekTo(0);
        resetOnPlayRef.current = false;
      }
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
    if (!isApiReady || !playlistMeta?.permalink_url) return;
    const timer = setTimeout(() => initWidget(), 800);
    return () => clearTimeout(timer);
  }, [isApiReady, initWidget, playlistMeta]);

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

  // ── 5. Pause when tab is hidden, resume when visible again ──────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isPlayerReady || !widgetRef.current) return;
      if (document.hidden) {
        widgetRef.current.pause();
      } else if (!isMuted) {
        widgetRef.current.play();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPlayerReady, isMuted]);

  // ── 6. Cleanup interval on unmount ───────────────────────────────────────
  useEffect(() => () => clearInterval(progressInterval.current), []);

  // ── Exposed controls ──────────────────────────────────────────────────────
  const next = useCallback(() => {
    const widget = widgetRef.current;
    const trackCount = playlistMeta?.tracks?.length ?? 0;
    if (!widget || trackCount === 0) return;
    widget.getCurrentSoundIndex((idx) => {
      const current = idx ?? 0;
      const target = current >= trackCount - 1 ? 0 : current + 1;
      resetOnPlayRef.current = true;
      widget.skip(target);
      widget.seekTo(0);
      setPosition(0);
      setCurrentTrackIndex(target);
      setIsMuted(false);
    });
  }, [playlistMeta]);

  const prev = useCallback(() => {
    const widget = widgetRef.current;
    const trackCount = playlistMeta?.tracks?.length ?? 0;
    if (!widget || trackCount === 0) return;
    widget.getCurrentSoundIndex((idx) => {
      const current = idx ?? 0;
      const target = current <= 0 ? trackCount - 1 : current - 1;
      resetOnPlayRef.current = true;
      widget.skip(target);
      widget.seekTo(0);
      setPosition(0);
      setCurrentTrackIndex(target);
      setIsMuted(false);
    });
  }, [playlistMeta]);

  const toggle = useCallback(() => widgetRef.current?.toggle(), []);
  const seekTo = useCallback((ms) => widgetRef.current?.seekTo(ms), []);

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
        seekTo,
      }}
    >
      {children}

      {/* Hidden iframe lives here so it persists across page navigations */}
      {isMounted && playlistMeta?.permalink_url && (
        <iframe
          ref={iframeRef}
          title="SoundCloud Widget"
          src={buildEmbedUrl(playlistMeta.permalink_url)}
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
