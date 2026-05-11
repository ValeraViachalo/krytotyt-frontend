"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudio } from "@/lib/providers/AudioContext/AudioContext";
import "./SoundcloudPlayer.scss";
import Image from "next/image";

const URL_PLAYLIST = "https://soundcloud.com/krytotytmusic";

export default function SoundcloudPlayer() {
  const {
    isMuted,
    setIsMuted,
    currentTrackIndex,
    position,
    duration,
    playlistMeta,
    seekTo,
  } = useAudio();

  const progressRef = useRef(null);
  const pendingSeekRef = useRef(null);
  const [dragPct, setDragPct] = useState(null);
  const [pendingPct, setPendingPct] = useState(null);

  const computePct = useCallback((clientX) => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const commitSeek = useCallback(
    (pct) => {
      if (isMuted) setIsMuted(false);
      if (duration) {
        seekTo(pct * duration);
      } else {
        pendingSeekRef.current = pct;
      }
    },
    [duration, isMuted, seekTo, setIsMuted],
  );

  useEffect(() => {
    if (duration && pendingSeekRef.current != null) {
      seekTo(pendingSeekRef.current * duration);
      pendingSeekRef.current = null;
    }
  }, [duration, seekTo]);

  const handlePointerDown = useCallback(
    (e) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      setDragPct(computePct(e.clientX));
    },
    [computePct],
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (dragPct === null) return;
      setDragPct(computePct(e.clientX));
    },
    [dragPct, computePct],
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (dragPct === null) return;
      const pct = computePct(e.clientX);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setDragPct(null);
      setPendingPct(pct);
      commitSeek(pct);
    },
    [dragPct, computePct, commitSeek],
  );

  const currentTrack = playlistMeta?.tracks?.[currentTrackIndex] ?? null;

  const displayTitle = currentTrack?.title || "KRYTOTYT playlist";

  const displayArtwork =
    currentTrack?.artwork_url ??
    playlistMeta?.artwork_url ??
    "/assets/player-thumbnail.jpg";

  const playbackPct = duration ? (position / duration) * 100 : 0;
  const progressPct =
    dragPct !== null
      ? dragPct * 100
      : pendingPct !== null
        ? pendingPct * 100
        : playbackPct;

  useEffect(() => {
    if (pendingPct === null || !duration) return;
    if (Math.abs(playbackPct - pendingPct * 100) < 2) {
      setPendingPct(null);
    }
  }, [playbackPct, pendingPct, duration]);

  useEffect(() => {
    if (pendingPct === null) return;
    const t = setTimeout(() => setPendingPct(null), 1500);
    return () => clearTimeout(t);
  }, [pendingPct]);

  useEffect(() => {
    setPendingPct(null);
  }, [currentTrackIndex]);

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
          <div
            className="player__progress"
            ref={progressRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ touchAction: "none" }}
          >
            <div
              className="player__progress-bar"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <a
          href={playlistMeta?.permalink_url ?? URL_PLAYLIST}
          target="_blank"
          rel="noopener noreferrer"
          className="player__link"
          title="Open in SoundCloud"
        >
          <Image
            src="/assets/icon/soundcloud-icon.svg"
            alt="SoundCloud Icon"
            width={42}
            height={24}
            className="player__link-icon"
          />
        </a>
      </div>
    </div>
  );
}
