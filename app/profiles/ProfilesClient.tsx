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

           {filtered.map((p) => (
  <div
    key={p.id}
    className="item"
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
          {/* ✅ 상세보기는 이제 진짜 링크로 */}
          <a
            className="openLink"
            href={`/profiles/${p.id}?embed=1`}
            onClick={(e) => e.stopPropagation()}
          >
            자세히 보기 →
          </a>

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

.openLink{
  color: rgba(245,158,11,.95);
  font-weight: 900;
  text-decoration: none;
}
.openLink:hover{ text-decoration: underline; }

.board{
  min-height:100vh;
  background:#fff;
  color: rgba(15,23,42,.92);
}

.wrap{
  max-width: 1100px;
  margin: 0 auto;
  padding: 26px 18px 60px;
}
@media (max-width: 560px){
  .wrap{ padding: 22px 12px 56px; }
}

.head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap: 14px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(15,23,42,.08);
  margin-bottom: 14px;
}

.kicker{
  font-size:11px;
  letter-spacing:.22em;
  color: rgba(15,23,42,.52);
}

.title{
  margin: 6px 0 0;
  font-size: 22px;
  letter-spacing: -0.02em;
  font-weight: 900;
}

.sub{
  margin: 7px 0 0;
  font-size: 13px;
  color: rgba(15,23,42,.60);
}

.tools{
  display:flex;
  align-items:center;
  gap: 10px;
  flex-wrap: wrap;
}

.search{
  height: 40px;
  display:flex;
  align-items:center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(15,23,42,.10);
  background: rgba(255,255,255,.92);
}
.search svg{ color: rgba(15,23,42,.45); }

.search input{
  border:0;
  outline:none;
  background: transparent;
  width: 260px;
  font-size: 13px;
  color: rgba(15,23,42,.86);
}
@media (max-width: 560px){
  .search input{ width: 200px; }
}

.btn{
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(245,158,11,.28);
  background: rgba(245,158,11,.12);
  color: rgba(120,53,15,.95);
  font-weight: 800;
  font-size: 13px;
  cursor:pointer;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
}
.btn:disabled{ opacity:.6; cursor:default; }
.btn.ghost{
  border-color: rgba(15,23,42,.12);
  background: rgba(255,255,255,.92);
  color: rgba(15,23,42,.78);
}

.state{
  margin-top: 14px;
  border-radius: 14px;
  border: 1px solid rgba(15,23,42,.08);
  background: rgba(255,255,255,.92);
  padding: 16px;
  text-align:center;
  color: rgba(15,23,42,.62);
  font-size: 13px;
}

.empty{
  margin-top: 14px;
  display:flex;
  justify-content:center;
}
.emptyCard{
  width: 100%;
  max-width: 720px;
  border-radius: 14px;
  border: 1px solid rgba(15,23,42,.08);
  background: rgba(255,255,255,.92);
  padding: 16px;
  text-align:center;
  color: rgba(15,23,42,.72);
  font-size: 13px;
}
.emptySub{
  margin-top: 6px;
  color: rgba(15,23,42,.52);
  font-size: 12px;
}

/* 리스트 */
.list{
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 980px){
  .list{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 620px){
  .list{ grid-template-columns: 1fr; }
}

.item{
  display:flex;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(15,23,42,.10);
  background: rgba(255,255,255,.94);
  text-decoration:none;
  color: inherit;
  transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease;
  box-shadow: 0 10px 24px rgba(15,23,42,.06);
}
.item:hover{
  transform: translateY(-1px);
  border-color: rgba(245,158,11,.22);
  box-shadow: 0 14px 34px rgba(15,23,42,.10);
}

.thumb{
  flex: 0 0 112px;
  height: 88px;
  border-radius: 14px;
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
  object-fit: contain;
  background: #fff;
  display:block;
}
.thumbPh{
  font-size: 26px;
  color: rgba(15,23,42,.55);
}

.body{
  min-width: 0;
  flex: 1 1 auto;
  display:flex;
  flex-direction:column;
  gap: 6px;
  padding-top: 2px;
}

.topRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
}

.name{
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.01em;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.badge{
  flex: 0 0 auto;
  font-size: 11px;
  padding: 6px 9px;
  border-radius: 999px;
  border: 1px solid rgba(245,158,11,.22);
  background: rgba(245,158,11,.10);
  color: rgba(120,53,15,.92);
  font-weight: 900;
}

.desc{
  font-size: 12.5px;
  line-height: 1.55;
  color: rgba(15,23,42,.70);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow:hidden;
  min-height: 36px;
}
.muted{ color: rgba(15,23,42,.46); }

.bottomRow{
  margin-top: 2px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  font-size: 11px;
  color: rgba(15,23,42,.52);
}

.rightActions{
  display:flex;
  align-items:center;
  gap:8px;
}

.open{
  color: rgba(245,158,11,.95);
  font-weight: 900;
}
.date{ color: rgba(15,23,42,.52); }

.miniBtn{
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(15,23,42,.12);
  background: rgba(255,255,255,.92);
  color: rgba(15,23,42,.78);
  font-weight: 900;
  font-size: 11px;
  text-decoration:none;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
}
.miniBtn.danger{
  border-color: rgba(220,38,38,.25);
  color: rgba(220,38,38,.95);
  background: rgba(220,38,38,.06);
}
`;
