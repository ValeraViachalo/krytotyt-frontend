"use client";

import { useCallback, useRef } from "react";
import { useAudio } from "@/lib/providers/AudioContext/AudioContext";
import "./SoundcloudPlayer.scss";

const URL_PLAYLIST = "https://soundcloud.com/krytotytmusic";

export default function SoundcloudPlayer() {
  const {
    isPlayerReady,
    isMuted,
    setIsMuted,
    currentTrackIndex,
    position,
    duration,
    playlistMeta,
    next,
    seekTo,
  } = useAudio();

  const progressRef = useRef(null);

  const handleProgressClick = useCallback(
    (e) => {
      if (!duration || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (isMuted) setIsMuted(false);
      seekTo(pct * duration);
    },
    [duration, seekTo, isMuted, setIsMuted]
  );

  // ── Derived display values ─────────────────────────────────────────────────
  const currentTrack = playlistMeta?.tracks?.[currentTrackIndex] ?? null;

  const displayTitle = currentTrack?.title || "KRYTOTYT playlist";

  const displayArtwork =
    currentTrack?.artwork_url ??
    playlistMeta?.artwork_url ??
    "/assets/player-thumbnail.jpg";

  const progressPct = duration ? (position / duration) * 100 : 0;

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
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
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
      </div>
    </div>
  );
}

