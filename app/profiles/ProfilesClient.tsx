// app/profiles/ProfilesClient.tsx
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Post = {
  id: string;
  title: string;
  role: string | null;
  bio: string | null;
  cover_url: string | null;
  image_urls: string[] | null;
  created_at: string;
  comment_count?: number;
};

// ✅ default export는 Suspense로 감싸는 Wrapper
export default function ProfilesClient() {
  return (
    <Suspense fallback={null}>
      <ProfilesPage />
    </Suspense>
  );
}

function ProfilesPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // 관리자 키(로컬 저장)
  const [adminKey, setAdminKey] = useState<string>("");
  const isAdmin = !!adminKey;

  // 복귀 로직
  const [shouldResume, setShouldResume] = useState(false);
  const [resumeId, setResumeId] = useState<string>("");

  // ✅ 로컬스토리지에서 관리자 키 로드
  useEffect(() => {
    try {
      const found = (localStorage.getItem("adminKey") || "").trim();
      setAdminKey(found);
    } catch {}
  }, []);

async function load() {
  setLoading(true);
  try {
    const res = await fetch("/api/profiles", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    console.log("profiles api json string:", JSON.stringify(json, null, 2));

    setPosts(json?.posts ?? []);
  } finally {
    setLoading(false);
  }
}

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function deletePost(id: string) {
    if (!confirm("정말 삭제할까요?")) return;

    const res = await fetch(`/api/profiles/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminKey }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json?.error ?? "삭제 실패");
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  // ✅ (1) 마운트 시 복귀 여부 판단
  useEffect(() => {
    const embed = sp.get("embed") === "1";
    const resumeOff = sp.get("resume") === "0";

    const inIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    const isReload = (() => {
      try {
        const nav = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        if (nav?.type) return nav.type === "reload";
        // @ts-ignore
        return performance?.navigation?.type === 1;
      } catch {
        return false;
      }
    })();

    let last = "";
    try {
      last = localStorage.getItem("profiles_last_open") || "";
    } catch {}
    if (!last) {
      try {
        last = sessionStorage.getItem("profiles_last_open") || "";
      } catch {}
    }
    if (!last) {
      try {
        const m = String(window.name || "");
        if (m.startsWith("profiles_last_open:"))
          last = m.slice("profiles_last_open:".length);
      } catch {}
    }

    const looksLikeFirstEntry = (() => {
      try {
        return window.history.length <= 1;
      } catch {
        return false;
      }
    })();

    const ok =
      isReload && !resumeOff && (embed || inIframe) && !!last && !looksLikeFirstEntry;

    setShouldResume(ok);
    setResumeId(ok ? last : "");
  }, [sp]);

  // ✅ (2) 복귀면 즉시 replace
  useEffect(() => {
    if (!shouldResume || !resumeId) return;
    router.replace(`/profiles/${resumeId}?embed=1`);
  }, [router, shouldResume, resumeId]);

  // ✅ (3) 복귀가 아닐 때만 목록 로드
  useEffect(() => {
    if (shouldResume) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldResume]);

  // ✅ 검색 필터
  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return posts;
    return posts.filter((p) => {
      const t = (p.title ?? "").toLowerCase();
      const r = (p.role ?? "").toLowerCase();
      const b = (p.bio ?? "").toLowerCase();
      return t.includes(keyword) || r.includes(keyword) || b.includes(keyword);
    });
  }, [posts, q]);

  // ✅ 공지(role="공지") 카드는 항상 맨 위로
const ordered = useMemo(() => {
  const list = [...filtered];
  list.sort((a, b) => {
    const aNotice = (a.role ?? "") === "공지";
    const bNotice = (b.role ?? "") === "공지";
    if (aNotice === bNotice) return 0;
    return aNotice ? -1 : 1;
  });
  return list;
}, [filtered]);

  // ✅ 복귀 중이면 화면 안 그림(깜빡임 최소화)
  if (shouldResume) return null;

  return (
    <main className="board">
      <div className="wrap">
        <header className="head">
          <div className="h-left">
            <div className="kicker">PROMISE</div>
            <h1 className="title">멤버 프로필</h1>
            <p className="sub">공사중임니다 ㅇㅅㅠ</p>
          </div>

          <div className="tools">
            <div className="search" role="search">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2m0 2a6 6 0 1 1 0 12a6 6 0 0 1 0-12Z"
                />
              </svg>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="이름 / 역할 / 소개 검색…"
                aria-label="프로필 검색"
              />
            </div>

            <button className="btn" onClick={refresh} disabled={refreshing}>
              {refreshing ? "새로고침…" : "새로고침"}
            </button>

            <a className="btn ghost" href="/profiles/admin?embed=1">
              관리자 등록
            </a>

            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                const k = prompt("관리자 키(ADMIN_KEY)를 입력해줘")?.trim() || "";
                if (!k) return;
                try {
                  localStorage.setItem("adminKey", k);
                } catch {}
                setAdminKey(k);
                alert("관리자 모드 ON!");
              }}
            >
              관리자 로그인
            </button>

            {isAdmin ? (
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("adminKey");
                  } catch {}
                  setAdminKey("");
                  alert("관리자 모드 OFF");
                }}
              >
                로그아웃
              </button>
            ) : null}
          </div>
        </header>

        {loading ? (
          <div className="state">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="emptyCard">
              아직 등록된 프로필이 없어요.
              {q.trim() ? <div className="emptySub">검색어를 바꿔볼까?</div> : null}
            </div>
          </div>
        ) : (
          <section className="list" aria-label="프로필 목록">

           {ordered.map((p) => (
  <div
    key={p.id}
    className={`item ${(p.role ?? "") === "공지" ? "notice" : ""}`}
    role="link"
    tabIndex={0}
    onClick={() => {
      window.location.href = `/profiles/${p.id}?embed=1`;
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        window.location.href = `/profiles/${p.id}?embed=1`;
      }
    }}
  >
    <div className="thumb" aria-hidden="true">
      {p.cover_url ? (
        <img src={p.cover_url} alt="" loading="lazy" />
      ) : (
        <div className="thumbPh">🙂</div>
      )}
    </div>

    <div className="body">
      <div className="topRow">
        <div className="name" title={p.title}>
          {p.title}
        </div>
        {p.role ? <span className="badge">{p.role}</span> : null}
      </div>

      <div className="desc">
        {p.bio ? p.bio : <span className="muted">소개가 비어있어요.</span>}
      </div>

      <div className="bottomRow">
        <span className="date">{new Date(p.created_at).toLocaleDateString()}</span>

<div className="rightActions">
  <span className="commentCount">댓글 {p.comment_count ?? 0}개</span>

          {isAdmin ? (
            <>
              <a
                className="miniBtn"
                href={`/profiles/${p.id}/admin?embed=1`}
                onClick={(e) => {
                  e.stopPropagation(); // ✅ 카드 클릭 막기
                }}
              >
                수정
              </a>

              <button
                type="button"
                className="miniBtn danger"
                onClick={(e) => {
                  e.stopPropagation(); // ✅ 카드 클릭 막기
                  deletePost(p.id);
                }}
              >
                삭제
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  </div>
))}
          </section>
        )}
      </div>

      <style jsx>{css}</style>
    </main>
  );
}

const css = `
:root{
  --bg: #ffffff;
  --text: rgba(15,23,42,.92);
  --muted: rgba(15,23,42,.60);
  --line: rgba(15,23,42,.10);
  --shadow: 0 10px 30px rgba(15,23,42,.08);
  --accent: rgba(245,158,11,.95);
  --accent-soft: rgba(245,158,11,.12);
}

.board{
  min-height:100vh;
  background: var(--bg);
  color: var(--text);
}

.wrap{
  max-width: 1320px; /* ✅ 1120 -> 1320 */
  margin: 0 auto;
  padding: 34px 18px 70px;
}

@media (max-width: 560px){
  .wrap{ padding: 26px 12px 64px; }
}

/* 헤더 */
.head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 18px;
}

.h-left{ min-width: 240px; }

.kicker{
  font-size: 12px;
  letter-spacing:.24em;
  color: rgba(15,23,42,.48);
}

.title{
  margin: 8px 0 0;
  font-size: 26px;           /* ✅ 더 큼 */
  letter-spacing: -0.03em;
  font-weight: 850;
}

.sub{
  margin: 8px 0 0;
  font-size: 14.5px;         /* ✅ 더 큼 */
  line-height: 1.55;
  color: var(--muted);
}

/* 오른쪽 툴 */
.tools{
  display:flex;
  align-items:center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content:flex-end;
}

.search{
  height: 44px;               /* ✅ 높이 업 */
  display:flex;
  align-items:center;
  gap: 10px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,.98);
  box-shadow: 0 6px 18px rgba(15,23,42,.06);
}
.search svg{ color: rgba(15,23,42,.45); }

.search input{
  border:0;
  outline:none;
  background: transparent;
  width: 290px;
  font-size: 14px;            /* ✅ 더 큼 */
  color: rgba(15,23,42,.86);
}
@media (max-width: 560px){
  .search input{ width: 200px; }
}

/* ✅ 버튼 (요청: 글자 굵기 줄이기) */
.btn{
  height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(245,158,11,.25);
  background: rgba(245,158,11,.10);
  color: rgba(120,53,15,.95);
  font-weight: 650;           /* ✅ 기존 800 -> 650 */
  font-size: 13.5px;
  cursor:pointer;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
  box-shadow: 0 8px 22px rgba(245,158,11,.12);
}
.btn:hover{
  background: rgba(245,158,11,.14);
  transform: translateY(-1px);
}
.btn:disabled{ opacity:.6; cursor:default; transform:none; }

.btn.ghost{
  border-color: rgba(15,23,42,.12);
  background: rgba(255,255,255,.98);
  color: rgba(15,23,42,.76);
  font-weight: 650;           /* ✅ 통일 */
  box-shadow: 0 8px 22px rgba(15,23,42,.06);
}
.btn.ghost:hover{
  background: rgba(15,23,42,.02);
}

/* 상태/빈화면 */
.state{
  margin-top: 18px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,.98);
  padding: 18px;
  text-align:center;
  color: rgba(15,23,42,.62);
  font-size: 14px;
}

.empty{
  margin-top: 18px;
  display:flex;
  justify-content:center;
}
.emptyCard{
  width: 100%;
  max-width: 760px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,.98);
  padding: 18px;
  text-align:center;
  color: rgba(15,23,42,.72);
  font-size: 14px;
  box-shadow: var(--shadow);
}
.emptySub{
  margin-top: 8px;
  color: rgba(15,23,42,.52);
  font-size: 13px;
}

/* 리스트 */
.list{
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;                  /* ✅ 간격 업 */
}
@media (max-width: 980px){
  .list{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 620px){
  .list{ grid-template-columns: 1fr; }
}

/* 카드 */
.item{
  display:flex;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(15,23,42,.09);
  background: rgba(255,255,255,.98);
  text-decoration:none;
  color: inherit;
  transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease;
  box-shadow: 0 10px 26px rgba(15,23,42,.08);
}
.item:hover{
  transform: translateY(-2px);
  border-color: rgba(245,158,11,.22);
  box-shadow: 0 16px 40px rgba(15,23,42,.12);
}

/* ✅ 공지 카드: 과한 노랑 제거 + 깔끔한 강조 */
.item.notice{
  border-color: rgba(245,158,11,.28);
  background: rgba(255,255,255,.98);
  box-shadow: 0 14px 34px rgba(15,23,42,.10);
  position: relative;
  overflow: hidden;
  padding-left: 18px; 
}

/* 얇은 포인트 바(고급 느낌) */
.item.notice::after{
  content:"";
  position:absolute;
  left:0;
  top:0;
  bottom:0;
  width: 6px;
  background: rgba(245,158,11,.75);
}

.thumb{
  flex: 0 0 120px;
  height: 92px;
  border-radius: 16px;
  border: 1px solid rgba(15,23,42,.08);
  background: rgba(15,23,42,.03);
  overflow:hidden;
  display:flex;
  align-items:center;
  justify-content:center;
}
.thumb img{
  width: 100%;
  height: 100%;
  object-fit: cover; /* ✅ 꽉 차게(잘려도 됨) */
  background: #fff;
  display:block;
}
.thumbPh{
  font-size: 28px;
  color: rgba(15,23,42,.55);
}

.body{
  min-width: 0;
  flex: 1 1 auto;
  display:flex;
  flex-direction:column;
  gap: 8px;
  padding-top: 2px;
}

.topRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
}

.name{
  font-size: 16px;       /* ✅ 더 큼 */
  font-weight: 700;      /* ✅ 너무 두껍지 않게 */
  letter-spacing: -0.02em;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.badge{
  flex: 0 0 auto;
  font-size: 12px;       /* ✅ 더 큼 */
  padding: 4px 10px;     /* ✅ 위아래 줄이고 좌우 유지 */
  border-radius: 999px;
  border: 1px solid rgba(245,158,11,.22);
  background: rgba(245,158,11,.10);
  color: rgba(120,53,15,.92);
  font-weight: 650;
  line-height: 1.2;
}

/* ✅ 공지 배지(role=공지)만 살짝 더 또렷하게 */
.item.notice .badge{
  border-color: rgba(245,158,11,.30);
  background: rgba(245,158,11,.14);
  color: rgba(120,53,15,.95);
}

.desc{
  font-size: 14px;       /* ✅ 더 큼 */
  line-height: 1.6;
  color: rgba(15,23,42,.72);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow:hidden;
  min-height: 44px;
}
.muted{ color: rgba(15,23,42,.50); }

.bottomRow{
  margin-top: 2px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  font-size: 12px;      /* ✅ 더 큼 */
  color: rgba(15,23,42,.55);
}

.rightActions{
  display:flex;
  align-items:center;
  gap:10px;
}

.commentCount{
  font-size: 12px;
  color: rgba(15,23,42,.55);
  font-weight: 650;
}

/* 관리자 버튼(수정/삭제) */
.miniBtn{
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(15,23,42,.12);
  background: rgba(255,255,255,.98);
  color: rgba(15,23,42,.78);
  font-weight: 650; /* ✅ 과한 굵기 제거 */
  font-size: 12px;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  transition: background .12s ease, transform .12s ease;
}
.miniBtn:hover{
  background: rgba(15,23,42,.03);
  transform: translateY(-1px);
}
.miniBtn.danger{
  border-color: rgba(220,38,38,.25);
  color: rgba(220,38,38,.95);
  background: rgba(220,38,38,.06);
}
.miniBtn.danger:hover{ background: rgba(220,38,38,.10); }

/* ✅ 페이지24 TOP 플로팅 버튼 숨김(일반적으로 아래 셀렉터 중 하나가 맞음) */
#top_btn,
#topbtn,
.btn_top,
.go-top,
.scroll-top,
a[href="#top"]{
  display:none !important;
}
`;

