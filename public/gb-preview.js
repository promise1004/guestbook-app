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
        return `${y}.${m}.${day}`;
      } catch {
        return "";
      }
    };

    listEl.innerHTML = skeleton;

    const API_URL =
      "https://guestbook-app-nu.vercel.app/api/guestbook?sort=new&page=1&limit=3";

    fetch(API_URL, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((data) => {
        const entries = Array.isArray(data?.entries) ? data.entries : [];
        if (!entries.length) {
          listEl.innerHTML =
            '<div class="gbp-card"><p class="gbp-text">아직 방명록이 없어요. 첫 글을 남겨주세요.</p></div>';
          return;
        }

        listEl.innerHTML = entries.slice(0, 3).map((e) => {
          const name = esc(e?.name);
          const avatar = esc(e?.avatar || "🙂");
          const content = esc(e?.content);
          const date = fmtDate(e?.created_at);

          return `
            <article class="gbp-card">
              <div class="gbp-row">
                <div class="gbp-avatar" aria-hidden="true">${avatar}</div>
                <div class="gbp-meta">
                  <p class="gbp-name">${name}</p>
                  <p class="gbp-date">${date}</p>
                </div>
              </div>
              <p class="gbp-text">${content}</p>
            </article>
          `;
        }).join("");
      })
      .catch(() => {
        listEl.innerHTML =
          '<div class="gbp-card"><p class="gbp-text">방명록 미리보기를 불러오지 못했어요.</p></div>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
