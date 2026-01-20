export const dynamic = "force-dynamic";

export default function PreviewPage() {
  return (
    <>
      {/* iframe 안에서만 쓰는 최소 스타일 */}
      <style>{`
        html, body { margin:0; padding:0; background:transparent; }
      `}</style>

      {/* ✅ 네가 아임웹에 넣었던 미리보기 섹션 HTML/CSS를 여기로 옮겨 */}
      <section className="gb-preview" aria-label="방명록 미리보기">
        <div className="gbp-wrap">
          <div className="gbp-head">
            <div>
              <p className="gbp-kicker">GUESTBOOK</p>
              <h2 className="gbp-title">방명록</h2>
              <p className="gbp-sub">테스트입니다.</p>
            </div>
            <a className="gbp-link" href="https://promise.page24.app/doc/8c4420?mcode=1010&midx=1" target="_top" rel="noreferrer">
              전체 보기
            </a>
          </div>

          <div className="gbp-list" id="gbPreviewList" aria-live="polite"></div>

          <div className="gbp-foot">
            <a className="gbp-btn" href="https://promise.page24.app/doc/8c4420?mcode=1010&midx=1" target="_top" rel="noreferrer">
              방명록 남기러 가기
            </a>
          </div>
        </div>
      </section>

      {/* ✅ 네 CSS (원래 아임웹에 넣었던 그대로) */}
      <style>{`
        .gb-preview{
          position:relative;
          padding:40px 18px;
          overflow:hidden;
          color: rgba(20, 18, 16, 0.92);
          background:
            radial-gradient(900px 520px at 15% 25%, rgba(245, 158, 11, 0.10), transparent 60%),
            radial-gradient(780px 520px at 85% 75%, rgba(251, 113, 133, 0.10), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,250,244,0.92));
          border-top: 1px solid rgba(15, 23, 42, 0.06);
          border-bottom: 1px solid rgba(15, 23, 42, 0.06);
        }
        .gb-preview:before{
          content:"";
          position:absolute; inset:0;
          background:
            radial-gradient(600px 220px at 50% 0%, rgba(0,0,0,0.04), transparent 60%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cg fill='none' stroke='rgba(0,0,0,0.06)' stroke-width='1'%3E%3Cpath d='M0 70h140'/%3E%3Cpath d='M70 0v140'/%3E%3C/g%3E%3C/svg%3E");
          opacity:.18;
          pointer-events:none;
        }
        .gbp-wrap{ position:relative; max-width:980px; margin:0 auto; z-index:1; }
        .gbp-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:14px; margin-bottom:14px; }
        .gbp-kicker{ margin:0 0 8px; font-size:12px; letter-spacing:.18em; color: rgba(30, 25, 20, 0.55); }
        .gbp-title{ margin:0 0 6px; font-size:26px; line-height:1.2; color: rgba(20, 18, 16, 0.92); }
        .gbp-sub{ margin:0; font-size:13px; color: rgba(30, 25, 20, 0.60); }
        .gbp-link{
          font-size:13px; color: rgba(20, 18, 16, 0.75);
          text-decoration:none; border-bottom:1px solid rgba(20, 18, 16, 0.18);
          padding-bottom:2px; white-space:nowrap;
        }
        .gbp-list{ display:grid; gap:14px; margin-top:16px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        @media (max-width: 980px){ .gbp-list{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 560px){ .gbp-list{ grid-template-columns: 1fr; } }

        .gbp-card{
          position:relative; overflow:hidden; border-radius:18px;
          padding:14px 14px 12px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
        }
        .gbp-card:before{
          content:""; position:absolute; inset:-1px;
          background:
            radial-gradient(420px 160px at 18% 10%, rgba(245, 158, 11, 0.10), transparent 60%),
            radial-gradient(420px 170px at 82% 86%, rgba(251, 113, 133, 0.10), transparent 62%);
          opacity:.9; pointer-events:none;
        }
        .gbp-row{ position:relative; z-index:1; display:flex; align-items:center; gap:10px; }
        .gbp-avatar{
          width:36px; height:36px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,245,235,0.90));
          border: 1px solid rgba(15, 23, 42, 0.10);
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.10);
          flex:0 0 auto; font-size:16px;
        }
        .gbp-meta{ min-width:0; }
        .gbp-name{
          margin:0; font-size:14px; font-weight:800;
          color: rgba(20, 18, 16, 0.92);
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width: 18ch;
        }
        .gbp-date{ margin:2px 0 0; font-size:12px; color: rgba(30, 25, 20, 0.55); }
        .gbp-text{
          position:relative; z-index:1; margin:10px 0 0;
          font-size:14px; line-height:1.65; color: rgba(30, 25, 20, 0.78);
          display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;
          overflow:hidden; word-break:break-word;
        }
        .gbp-skel{ border-radius:18px; padding:14px; background: rgba(255,255,255,0.55); border: 1px solid rgba(15, 23, 42, 0.08); box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06); }
        .gbp-sbar{ height:10px; border-radius:10px; background: rgba(15, 23, 42, 0.08); margin:8px 0; }
        .gbp-sbar.w1{ width:55%; } .gbp-sbar.w2{ width:85%; } .gbp-sbar.w3{ width:70%; }
        .gbp-foot{ margin-top:18px; text-align:center; }
        .gbp-btn{
          display:inline-flex; align-items:center; justify-content:center;
          padding:10px 16px; border-radius:999px;
          background: rgba(15, 23, 42, 0.06);
          border:1px solid rgba(15, 23, 42, 0.10);
          color: rgba(20, 18, 16, 0.82);
          text-decoration:none; font-size:13px;
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
        }
      `}</style>

      {/* ✅ 여기서 JS 실행 (Next 페이지니까 실행됨) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function () {
  function run() {
    const listEl = document.getElementById("gbPreviewList");
    if (!listEl) return;

    const skeleton =
      '<div class="gbp-skel"><div class="gbp-sbar w1"></div><div class="gbp-sbar w2"></div><div class="gbp-sbar w3"></div></div>' +
      '<div class="gbp-skel"><div class="gbp-sbar w1"></div><div class="gbp-sbar w2"></div><div class="gbp-sbar w3"></div></div>' +
      '<div class="gbp-skel"><div class="gbp-sbar w1"></div><div class="gbp-sbar w2"></div><div class="gbp-sbar w3"></div></div>';

    const esc = (s) =>
      String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const fmtDate = (iso) => {
      try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return y + "." + m + "." + day;
      } catch {
        return "";
      }
    };

    listEl.innerHTML = skeleton;

    const API_URL = "https://guestbook-app-nu.vercel.app/api/guestbook?sort=new&page=1&limit=3";

    fetch(API_URL, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((data) => {
        const entries = Array.isArray(data?.entries) ? data.entries : [];
        if (!entries.length) {
          listEl.innerHTML = '<div class="gbp-card"><p class="gbp-text">아직 방명록이 없어요. 첫 글을 남겨주세요.</p></div>';
          return;
        }

        listEl.innerHTML = entries.slice(0, 3).map((e) => {
          const name = esc(e?.name);
          const avatar = esc(e?.avatar || "🙂");
          const content = esc(e?.content);
          const date = fmtDate(e?.created_at);

          return (
            '<article class="gbp-card">' +
              '<div class="gbp-row">' +
                '<div class="gbp-avatar" aria-hidden="true">' + avatar + '</div>' +
                '<div class="gbp-meta">' +
                  '<p class="gbp-name">' + name + '</p>' +
                  '<p class="gbp-date">' + date + '</p>' +
                '</div>' +
              '</div>' +
              '<p class="gbp-text">' + content + '</p>' +
            '</article>'
          );
        }).join("");
      })
      .catch(() => {
        listEl.innerHTML = '<div class="gbp-card"><p class="gbp-text">방명록 미리보기를 불러오지 못했어요.</p></div>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
          `,
        }}
      />
    </>
  );
}
