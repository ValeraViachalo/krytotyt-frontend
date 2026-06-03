"use client"
import React, { useState, useEffect, useRef } from 'react'

import "./Loader.scss";
import Image from 'next/image';
import clsx from 'clsx';
import { usePathname } from 'next/navigation';

const DURATION = 3000;

export default function Loader() {
  const pathname = usePathname();
  // Lock to the page the site was first loaded on. Client-side navigating
  // to "/" later must not re-trigger the loader.
  const startedOnHomeRef = useRef(pathname === "/");
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(process.env.NEXT_PUBLIC_ENV !== "production");
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const tick = (now) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      setProgress(Math.round(t * 100));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (progress < 100) return;
    const timeout = setTimeout(() => setHidden(true), 600);
    return () => clearTimeout(timeout);
  }, [progress]);

  if (!startedOnHomeRef.current || hidden) return null;

  return (
    <div className={clsx('loader', { 'is-done': progress >= 100 })}>
      <Image
        src="/assets/logo-small.svg"
        alt="Krytotyt logo"
        width={120}
        height={103}
        className="loader__logo"
        priority
      />

      <p>{progress}%</p>

      <div className="loader-progress">
        <div className="loader-progress__bar" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  )
}
