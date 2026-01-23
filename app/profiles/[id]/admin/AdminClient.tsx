// app/profiles/[id]/admin/AdminClient.tsx
"use client";

import { useEffect, useState } from "react";
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

export default function AdminClient({ id }: { id: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const embed = sp.get("embed") === "1";

  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);

  // 입력 상태
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  useEffect(() => {
    try {
      setAdminKey((localStorage.getItem("adminKey") || "").trim());
    } catch {}
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${id}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error ?? "불러오기 실패");
        return;
      }

      const p = json?.post as Post | undefined;
      if (!p) {
        alert("프로필이 없습니다.");
        return;
      }

      setPost(p);
      setTitle(p.title ?? "");
      setRole(p.role ?? "");
      setBio(p.bio ?? "");
      setCoverUrl(p.cover_url ?? "");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save() {
    const k = adminKey.trim();
    if (!k) return alert("관리자 키가 없습니다. (목록에서 관리자 로그인 먼저)");

    const res = await fetch(`/api/profiles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminKey: k,
        title: title.trim(),
        role: role.trim() || null,
        bio: bio.trim() || null,
        cover_url: coverUrl.trim() || null,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) return alert(json?.error ?? "저장 실패");

    alert("저장 완료!");
    if (embed) router.replace(`/profiles/${id}?embed=1`);
    else router.replace(`/profiles/${id}`);
  }

  if (loading) return <div style={{ padding: 24 }}>불러오는 중…</div>;
  if (!post) return <div style={{ padding: 24 }}>프로필 없음</div>;

  return (
    <main style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>프로필 수정</h1>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            borderRadius: 12,
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          뒤로
        </button>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>이름</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>역할(뱃지)</div>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={inputStyle}
            placeholder="예) 주정"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>소개</div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ ...inputStyle, minHeight: 110, resize: "vertical" as any }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>커버 이미지 URL</div>
          <input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            style={inputStyle}
            placeholder="https://..."
          />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button
            type="button"
            onClick={save}
            style={{
              border: "none",
              background: "#111827",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            저장
          </button>
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
};
