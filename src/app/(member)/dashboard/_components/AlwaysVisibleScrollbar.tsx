"use client";

import React, { useRef, useEffect, useCallback } from "react";

export default function AlwaysVisibleScrollbar({
  children,
  className = "",
  trackHeight = 8,
}: {
  children: React.ReactNode;
  className?: string;
  trackHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef(0);
  const thumbStartRef = useRef(0);

  const updateThumb = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!container || !track || !thumb) return;

    const cw = container.clientWidth;
    const sw = container.scrollWidth;
    const sl = container.scrollLeft;
    const trackW = track.clientWidth;

    if (sw <= cw) {
      thumb.style.width = `${trackW}px`;
      thumb.style.transform = `translateX(0px)`;
      thumb.style.opacity = "0.6";
      return;
    }

    const ratio = cw / sw;
    const thumbW = Math.max(20, ratio * trackW);
    const maxThumbX = trackW - thumbW;
    const thumbX = (sl / (sw - cw)) * maxThumbX;

    thumb.style.width = `${thumbW}px`;
    thumb.style.transform = `translateX(${thumbX}px)`;
    thumb.style.opacity = "1";
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => requestAnimationFrame(updateThumb);
    const handleResize = () => requestAnimationFrame(updateThumb);

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    updateThumb();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateThumb]);

  // Thumb dragging
  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const container = containerRef.current;
    if (!track || !thumb || !container) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;

      const trackRect = track.getBoundingClientRect();
      const trackW = track.clientWidth;
      const thumbW = thumb.clientWidth;
      const maxThumbX = trackW - thumbW;
      const delta = e.clientX - dragStartRef.current;

      let newThumbX = thumbStartRef.current + delta;
      newThumbX = Math.max(0, Math.min(maxThumbX, newThumbX));

      const scrollable = container.scrollWidth - container.clientWidth;
      const ratio = newThumbX / maxThumbX;
      container.scrollLeft = ratio * scrollable;
    };

    const onPointerUp = () => {
      draggingRef.current = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true;
      dragStartRef.current = e.clientX;

      const transform = window.getComputedStyle(thumb).transform;
      let currentX = 0;
      if (transform && transform !== "none") {
        const m = transform.match(/matrix\((.+)\)/);
        if (m && m[1]) {
          const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
          currentX = parts.length >= 6 ? parts[4] : 0;
        }
      }
      thumbStartRef.current = currentX;

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    };

    thumb.addEventListener("pointerdown", onPointerDown as any);

    const onTrackClick = (e: MouseEvent) => {
      if (e.target === thumb) return;

      const trackRect = track.getBoundingClientRect();
      const clickX = e.clientX - trackRect.left;

      const trackW = track.clientWidth;
      const thumbW = thumb.clientWidth;
      const maxThumbX = trackW - thumbW;
      const newThumbX = Math.max(0, Math.min(maxThumbX, clickX - thumbW / 2));

      const ratio = newThumbX / maxThumbX;
      const scrollable = container.scrollWidth - container.clientWidth;
      container.scrollLeft = ratio * scrollable;
    };

    track.addEventListener("click", onTrackClick);

    return () => {
      thumb.removeEventListener("pointerdown", onPointerDown as any);
      track.removeEventListener("click", onTrackClick);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="always-hidden-scrollbar overflow-x-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>

      {/* Mobile-only custom scrollbar */}
      <div
        ref={trackRef}
        className="absolute left-0 right-0 bottom-0 block lg:hidden"
        style={{
          height: trackHeight,
          marginTop: 8,
        }}
      >
        <div
          ref={thumbRef}
          className="rounded-full cursor-pointer"
          style={{
            height: trackHeight,
            width: 40,
            background:
              "linear-gradient(90deg, #60BC9B 0%, #8fe4c5ff 100%)",
          }}
        />
      </div>

      <style jsx>{`
        .always-hidden-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .always-hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
