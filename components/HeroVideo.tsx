"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  function ensureSource(video: HTMLVideoElement) {
    if (!video.getAttribute("src")) {
      video.src = window.matchMedia("(max-width: 767px)").matches
        ? "/videos/solar-mobile.mp4"
        : "/videos/solar-desktop.mp4";
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = true;
    let disposed = false;
    const syncPlayback = () => {
      if (disposed) return;
      if (reducedMotion.matches || document.hidden || !inView) {
        video.pause();
        return;
      }
      ensureSource(video);
      void video.play().catch(() => { /* Keep the poster if autoplay is blocked. */ });
    };
    const timer = window.setTimeout(syncPlayback, 800);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) video.pause();
      else if (video.getAttribute("src")) syncPlayback();
    }, { threshold: 0.1 });
    observer.observe(video);
    document.addEventListener("visibilitychange", syncPlayback);
    // Retry after the first interaction if the browser blocked muted autoplay.
    document.addEventListener("pointerdown", syncPlayback, { once: true, passive: true });
    reducedMotion.addEventListener("change", syncPlayback);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      document.removeEventListener("pointerdown", syncPlayback);
      reducedMotion.removeEventListener("change", syncPlayback);
      video.pause();
    };
  }, []);

  return (
      <div className="hero-media" aria-hidden="true">
        <Image src="/images/solar-poster.webp" alt="" fill preload sizes="100vw" className="hero-media__poster" />
        <video ref={videoRef} className="hero-media__video" data-ready={ready && !failed} autoPlay muted loop playsInline preload="none" disablePictureInPicture tabIndex={-1} onPlaying={() => setReady(true)} onError={() => setFailed(true)} />
        <div className="hero-media__shade" />
      </div>
  );
}
