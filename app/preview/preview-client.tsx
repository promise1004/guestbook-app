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
        /* ===== Guestbook Preview – Premium Warm Glass ===== */
:root{
  --gb-ink: rgba(20,18,16,.92);
  --gb-sub: rgba(30,25,20,.62);
  --gb-line: rgba(15,23,42,.08);

  --gb-amber: rgba(245,158,11,.55);
  --gb-rose: rgba(251,113,133,.45);

  --gb-card: rgba(255,255,255,.78);
  --gb-card2: rgba(255,250,244,.78);

  --gb-shadow: 0 10px 30px rgba(15,23,42,.10);
  --gb-shadow2: 0 8px 18px rgba(15,23,42,.08);
}

.gb-preview{
  position:relative;
  padding:44px 18px;
  overflow:hidden;
  color: var(--gb-ink);

  background:
    radial-gradient(1200px 520px at 18% 20%, rgba(245, 158, 11, 0.12), transparent 60%),
    radial-gradient(980px 560px at 82% 78%, rgba(251, 113, 133, 0.10), transparent 60%),
    linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,250,244,0.92));

  border-top: 1px solid rgba(15, 23, 42, 0.06);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.gb-preview::before{
  content:"";
  position:absolute; inset:0;
  background:
    radial-gradient(700px 220px at 50% 0%, rgba(0,0,0,0.05), transparent 60%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cg fill='none' stroke='rgba(0,0,0,0.06)' stroke-width='1'%3E%3Cpath d='M0 80h160'/%3E%3Cpath d='M80 0v160'/%3E%3C/g%3E%3C/svg%3E");
  opacity:.12;
  pointer-events:none;
}

.gbp-wrap{
  position:relative;
  max-width: 1040px;
  margin:0 auto;
  z-index:1;
}

.gbp-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:16px;
  margin-bottom:16px;
}

.gbp-kicker{
  margin:0 0 8px;
  font-size:12px;
  letter-spacing:.20em;
  color: rgba(30, 25, 20, 0.55);
}

.gbp-title{
  margin:0 0 6px;
  font-size:28px;
  line-height:1.15;
  font-weight:900;
}

.gbp-sub{
  margin:0;
  font-size:13px;
  color: var(--gb-sub);
}

.gbp-link{
  font-size:13px;
  color: rgba(20, 18, 16, 0.78);
  text-decoration:none;
  border-bottom:1px solid rgba(20, 18, 16, 0.18);
  padding-bottom:2px;
  transition: transform .18s ease, border-color .18s ease, opacity .18s ease;
  white-space:nowrap;
  opacity:.92;
}
.gbp-link:hover{
  transform: translateY(-1px);
  border-color: rgba(245,158,11,.35);
  opacity:1;
}

/* ✅ 그리드 간격/리듬 더 고급스럽게 */
.gbp-list{
  display:grid;
  gap:16px;
  margin-top:18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
@media (max-width: 980px){
  .gbp-list{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px){
  .gbp-list{ grid-template-columns: 1fr; }
}

/* ✅ 카드: 유리 + 라이트 골드 테두리 + 마우스 떠오름 */
.gbp-card{
  position:relative;
  overflow:hidden;
  border-radius:18px;
  padding:14px 14px 12px;

  background: linear-gradient(180deg, var(--gb-card), var(--gb-card2));
  border: 1px solid rgba(245,158,11,.14);
  box-shadow: var(--gb-shadow2);
  backdrop-filter: blur(10px);

  transition: transform .20s ease, box-shadow .20s ease, border-color .20s ease;
}

.gbp-card::before{
  content:"";
  position:absolute; inset:-1px;
  background:
    radial-gradient(420px 160px at 16% 8%, rgba(245, 158, 11, 0.14), transparent 62%),
    radial-gradient(420px 180px at 86% 92%, rgba(251, 113, 133, 0.10), transparent 64%);
  opacity:.9;
  pointer-events:none;
}

.gbp-card:hover{
  transform: translateY(-3px);
  box-shadow: var(--gb-shadow);
  border-color: rgba(245,158,11,.22);
}

.gbp-row{
  position:relative;
  z-index:1;
  display:flex;
  align-items:center;
  gap:10px;
}

/* ✅ 아바타를 “메달/버튼” 느낌으로 */
.gbp-avatar{
  width:38px; height:38px;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;

  background:
    radial-gradient(12px 12px at 30% 30%, rgba(255,255,255,.95), rgba(255,255,255,.75)),
    linear-gradient(180deg, rgba(255,246,232,.92), rgba(255,255,255,.88));
  border: 1px solid rgba(245,158,11,.22);
  box-shadow:
    0 10px 16px rgba(15, 23, 42, 0.10),
    inset 0 1px 0 rgba(255,255,255,0.85);
  flex:0 0 auto;
  font-size:16px;
}

.gbp-meta{ min-width:0; }

.gbp-name{
  margin:0;
  font-size:14px;
  font-weight:900;
  letter-spacing:.01em;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  max-width: 18ch;
}

.gbp-date{
  margin:2px 0 0;
  font-size:12px;
  color: rgba(30, 25, 20, 0.56);
}

/* ✅ 글은 3줄 + 줄 간격/톤 조정 */
.gbp-text{
  position:relative;
  z-index:1;
  margin:10px 0 0;
  font-size:14px;
  line-height:1.70;
  color: rgba(30, 25, 20, 0.80);

  display:-webkit-box;
  -webkit-line-clamp:3;
  -webkit-box-orient:vertical;
  overflow:hidden;
  word-break:break-word;
}

/* ✅ 스켈레톤 더 고급스럽게 */
.gbp-skel{
  border-radius:18px;
  padding:14px;
  background: rgba(255,255,255,0.62);
  border: 1px solid rgba(245,158,11,.12);
  box-shadow: 0 10px 18px rgba(15,23,42,.06);
}
.gbp-sbar{
  height:10px;
  border-radius:999px;
  background: linear-gradient(90deg, rgba(15,23,42,.07), rgba(15,23,42,.12), rgba(15,23,42,.07));
  margin:8px 0;
}
.gbp-sbar.w1{ width:52%; }
.gbp-sbar.w2{ width:86%; }
.gbp-sbar.w3{ width:68%; }

.gbp-foot{ margin-top:20px; text-align:center; }

.gbp-btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:8px;

  padding:10px 16px;
  border-radius:999px;

  background:
    radial-gradient(120px 40px at 30% 20%, rgba(255,255,255,.9), transparent 60%),
    linear-gradient(180deg, rgba(255,246,232,.65), rgba(255,255,255,.55));
  border:1px solid rgba(245,158,11,.18);
  color: rgba(20, 18, 16, 0.84);
  text-decoration:none;
  font-size:13px;
  box-shadow: 0 12px 20px rgba(15,23,42,.08);
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.gbp-btn:hover{
  transform: translateY(-1px);
  border-color: rgba(245,158,11,.28);
  box-shadow: 0 16px 26px rgba(15,23,42,.10);
}

@media (max-width:520px){
  .gb-preview{ padding:38px 14px; }
  .gbp-head{ align-items:flex-start; }
  .gbp-title{ font-size:24px; }
  .gbp-name{ max-width: 22ch; }
}
      `}</style>
    </>
  );
}
