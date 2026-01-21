"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function getParam(name: string) {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  return sp.get(name);
}

export default function HeroClient() {
  const DEFAULT_1 =
    "https://wngtvrecglvadguqnmvd.supabase.co/storage/v1/object/public/guestbook-images/test1.png";
  const DEFAULT_2 =
    "https://wngtvrecglvadguqnmvd.supabase.co/storage/v1/object/public/guestbook-images/test6.png";

  const images = useMemo(() => {
    // iframe src에서 ?img1=...&img2=... 로도 교체 가능
    const img1 = getParam("img1") || DEFAULT_1;
    const img2 = getParam("img2") || DEFAULT_2;
    return [img1, img2];
  }, []);

  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  const timerRef = useRef<number | null>(null);
  const INTERVAL = 4500; // 4.5초 감성 기본
  const FADE_MS = 900;

  // ✅ 이미지 프리로드 후에만 자동재생 시작 (검정/깜빡임 방지)
  useEffect(() => {
    let alive = true;

    const preload = (src: string) =>
      new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });

    (async () => {
      const ok = await Promise.all(images.map(preload));
      if (!alive) return;
      // 둘 중 하나라도 로드되면 진행
      if (ok.some(Boolean)) setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, [images]);

  const stop = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = () => {
    stop();
    timerRef.current = window.setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, INTERVAL);
  };

  useEffect(() => {
    if (!ready) return;
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const go = (idx: number) => {
    setActive(idx);
    // 클릭하면 타이머 리셋(UX 좋아짐)
    if (ready) start();
  };

  const prev = () => go((active - 1 + images.length) % images.length);
  const next = () => go((active + 1) % images.length);

  return (
    <section className="hero" aria-label="메인 슬라이드">
      <div className="slides" aria-hidden="true">
        {images.map((src, i) => (
          <div
            key={src + i}
            className={"slide" + (i === active ? " isActive" : "")}
            style={{ backgroundImage: `url("${src}")` }}
          />
        ))}
      </div>

      <div className="tint" aria-hidden="true" />

      {/* ✅ 화살표 버튼 */}
      <button
        type="button"
        className="navBtn navBtn--prev"
        aria-label="이전 이미지"
        onClick={prev}
      >
        ‹
      </button>
      <button
        type="button"
        className="navBtn navBtn--next"
        aria-label="다음 이미지"
        onClick={next}
      >
        ›
      </button>

      {/* ✅ 도트 */}
      <div className="dots" role="tablist" aria-label="슬라이드 선택">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={"dot" + (i === active ? " isOn" : "")}
            aria-label={`${i + 1}번 슬라이드`}
            aria-selected={i === active}
            role="tab"
            onClick={() => go(i)}
          />
        ))}
      </div>

      <style jsx>{`
        .hero {
          position: relative;
          width: 100%;
          height: 100vh;
          background: #000;
          overflow: hidden;
        }

        .slides {
          position: absolute;
          inset: 0;
        }

        .slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0;
          transition: opacity ${FADE_MS}ms ease;
          will-change: opacity;
        }
        .slide.isActive {
          opacity: 1;
        }

        .tint {
          position: absolute;
          inset: 0;
          background: rgba(43, 22, 1, 0.7);
          pointer-events: none;
        }
        @media (max-width: 520px) {
          .tint {
            background: rgba(43, 22, 1, 0.55);
          }
        }

        /* 버튼 */
        .navBtn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 5;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(0, 0, 0, 0.25);
          color: rgba(255, 255, 255, 0.92);
          font-size: 34px;
          line-height: 1;
          display: grid;
          place-items: center;
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .navBtn:hover {
          background: rgba(0, 0, 0, 0.35);
        }
        .navBtn:active {
          transform: translateY(-50%) scale(0.98);
        }
        .navBtn--prev {
          left: 14px;
        }
        .navBtn--next {
          right: 14px;
        }

        /* 도트 */
        .dots {
          position: absolute;
          left: 50%;
          bottom: 14px;
          transform: translateX(-50%);
          z-index: 6;
          display: flex;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          border: 0;
          background: rgba(255, 255, 255, 0.35);
          cursor: pointer;
          padding: 0;
        }
        .dot.isOn {
          background: rgba(255, 255, 255, 0.9);
        }

        @media (prefers-reduced-motion: reduce) {
          .slide {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}
