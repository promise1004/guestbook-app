"use client";

import { useEffect, useState } from "react";

type Entry = {
  id: string;
  name: string;
  avatar: string;
  content: string;
  created_at: string;
};

function fmtDate(iso?: string) {
  try {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  } catch {
    return "";
  }
}

export default function PreviewClient() {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    // ✅ 같은 도메인으로 호출하면 CORS 신경 안 써도 됨 (중요)
    fetch("/api/guestbook?sort=new&page=1&limit=3", {
      headers: { accept: "application/json" },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const list = Array.isArray(data?.entries) ? data.entries : [];
        setEntries(list);
      })
      .catch(() => setEntries([]));
  }, []);

  return (
    <>
      <style>{`html,body{margin:0;padding:0;background:transparent;}`}</style>

      <section className="gb-preview" aria-label="방명록 미리보기">
        <div className="gbp-wrap">
          <div className="gbp-head">
            <div>
              <p className="gbp-kicker">GUESTBOOK</p>
              <h2 className="gbp-title">방명록</h2>
              <p className="gbp-sub">테스트입니다.</p>
            </div>

            <a
              className="gbp-link"
              href="https://promise.page24.app/doc/8c4420?mcode=1010&midx=1"
              target="_top"
              rel="noreferrer"
            >
              전체 보기
            </a>
          </div>

          <div className="gbp-list" aria-live="polite">
            {entries === null && (
              <>
                <div className="gbp-skel">
                  <div className="gbp-sbar w1" />
                  <div className="gbp-sbar w2" />
                  <div className="gbp-sbar w3" />
                </div>
                <div className="gbp-skel">
                  <div className="gbp-sbar w1" />
                  <div className="gbp-sbar w2" />
                  <div className="gbp-sbar w3" />
                </div>
                <div className="gbp-skel">
                  <div className="gbp-sbar w1" />
                  <div className="gbp-sbar w2" />
                  <div className="gbp-sbar w3" />
                </div>
              </>
            )}

            {entries !== null && entries.length === 0 && (
              <article className="gbp-card">
                <p className="gbp-text">아직 방명록이 없어요. 첫 글을 남겨주세요.</p>
              </article>
            )}

            {entries?.map((e) => (
              <article className="gbp-card" key={e.id}>
                <div className="gbp-row">
                  <div className="gbp-avatar" aria-hidden="true">
                    {e.avatar || "🙂"}
                  </div>
                  <div className="gbp-meta">
                    <p className="gbp-name">{e.name}</p>
                    <p className="gbp-date">{fmtDate(e.created_at)}</p>
                  </div>
                </div>
                <p className="gbp-text">{e.content}</p>
              </article>
            ))}
          </div>

          <div className="gbp-foot">
            <a
              className="gbp-btn"
              href="https://promise.page24.app/doc/8c4420?mcode=1010&midx=1"
              target="_top"
              rel="noreferrer"
            >
              방명록 남기러 가기
            </a>
          </div>
        </div>
      </section>

      {/* ✅ 네 CSS 그대로 (지금 아임웹에 쓰던 CSS를 여기로 붙여넣어도 되고,
          아래는 “필수 최소 + 너 스타일 유지” 버전이야. */}
      <style>{`
        .gb-preview{
          position:relative; padding:40px 18px; overflow:hidden;
          color: rgba(20, 18, 16, 0.92);
          background:
            radial-gradient(900px 520px at 15% 25%, rgba(245, 158, 11, 0.10), transparent 60%),
            radial-gradient(780px 520px at 85% 75%, rgba(251, 113, 133, 0.10), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,250,244,0.92));
          border-top: 1px solid rgba(15, 23, 42, 0.06);
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }
        .gbp-wrap{ position:relative; max-width:980px; margin:0 auto; }
        .gbp-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:14px; }
        .gbp-kicker{ margin:0 0 8px; font-size:12px; letter-spacing:.18em; color: rgba(30, 25, 20, 0.55); }
        .gbp-title{ margin:0 0 6px; font-size:26px; line-height:1.2; }
        .gbp-sub{ margin:0; font-size:13px; color: rgba(30, 25, 20, 0.60); }
        .gbp-link{ font-size:13px; color: rgba(20, 18, 16, 0.75); text-decoration:none; border-bottom:1px solid rgba(20, 18, 16, 0.18); padding-bottom:2px; }
        .gbp-list{ display:grid; gap:14px; margin-top:16px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        @media (max-width: 980px){ .gbp-list{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 560px){ .gbp-list{ grid-template-columns: 1fr; } }

        .gbp-card{ border-radius:18px; padding:14px 14px 12px; background: rgba(255,255,255,0.72); border:1px solid rgba(15,23,42,0.08);
          box-shadow: 0 10px 24px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.7); }
        .gbp-row{ display:flex; align-items:center; gap:10px; }
        .gbp-avatar{ width:36px; height:36px; border-radius:14px; display:flex; align-items:center; justify-content:center;
          background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,245,235,0.90)); border:1px solid rgba(15,23,42,0.10);
          box-shadow: 0 10px 18px rgba(15,23,42,0.10); font-size:16px; flex:0 0 auto; }
        .gbp-name{ margin:0; font-size:14px; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:18ch; }
        .gbp-date{ margin:2px 0 0; font-size:12px; color: rgba(30, 25, 20, 0.55); }
        .gbp-text{ margin:10px 0 0; font-size:14px; line-height:1.65; color: rgba(30, 25, 20, 0.78);
          display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; word-break:break-word; }
        .gbp-skel{ border-radius:18px; padding:14px; background: rgba(255,255,255,0.55); border:1px solid rgba(15,23,42,0.08); }
        .gbp-sbar{ height:10px; border-radius:10px; background: rgba(15,23,42,0.08); margin:8px 0; }
        .gbp-sbar.w1{ width:55%; } .gbp-sbar.w2{ width:85%; } .gbp-sbar.w3{ width:70%; }
        .gbp-foot{ margin-top:18px; text-align:center; }
        .gbp-btn{ display:inline-flex; align-items:center; justify-content:center; padding:10px 16px; border-radius:999px;
          background: rgba(15,23,42,0.06); border:1px solid rgba(15,23,42,0.10); color: rgba(20,18,16,0.82); text-decoration:none; font-size:13px; }
      `}</style>
    </>
  );
}
