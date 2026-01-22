"use client";

import { useState } from "react";

export default function UploadAndCreate() {
  const [result, setResult] = useState<string>("");
  const [imgUrl, setImgUrl] = useState<string>("");

  const [adminKey, setAdminKey] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");

  async function upload(file: File) {
    setResult("업로드 중...");
    setImgUrl("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "profiles");

    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const text = await res.text();

    const head = `HTTP ${res.status} ${res.statusText}\n`;
    if (!text) {
      setResult(head + "(응답 바디가 비어있음)");
      return;
    }

    try {
      const json = JSON.parse(text);
      setResult(head + JSON.stringify(json, null, 2));
      if (json?.url) setImgUrl(json.url);
    } catch {
      setResult(head + text);
    }
  }

  async function createPost() {
    if (!adminKey.trim()) return alert("ADMIN_KEY를 입력해줘!");
    if (!title.trim()) return alert("이름/닉네임(title)을 입력해줘!");
    if (!imgUrl) return alert("대표 이미지 업로드를 먼저 해줘!");

    setResult("게시글 등록 중...");

    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminKey: adminKey.trim(),
        title: title.trim(),
        role: role.trim(),
        bio: bio.trim(),
        cover_url: imgUrl,
        image_urls: [],
      }),
    });

    const text = await res.text();
    const head = `HTTP ${res.status} ${res.statusText}\n`;
    try {
      const json = JSON.parse(text || "{}");
      setResult(head + JSON.stringify(json, null, 2));
      if (res.ok) {
        alert("등록 성공! /profiles로 가면 카드가 보여요.");
      }
    } catch {
      setResult(head + (text || "(응답 바디 없음)"));
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
      <h1>프로필 업로드 + 게시글 등록</h1>

      <section style={card}>
        <h2 style={h2}>1) 대표 이미지 업로드</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && upload(e.target.files[0])}
        />
        {imgUrl && (
          <p style={{ marginTop: 10 }}>
            업로드 URL:{" "}
            <a href={imgUrl} target="_blank" rel="noreferrer">
              {imgUrl}
            </a>
          </p>
        )}
      </section>

      <section style={card}>
        <h2 style={h2}>2) 프로필 게시글 등록(관리자만)</h2>

        <div style={grid}>
          <label style={label}>
            ADMIN_KEY
            <input style={input} value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="환경변수 ADMIN_KEY와 동일" />
          </label>

          <label style={label}>
            이름/닉네임 (title)
            <input style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 뉴양" />
          </label>

          <label style={label}>
            역할/직책 (role)
            <input style={input} value={role} onChange={(e) => setRole(e.target.value)} placeholder="예: 부길마" />
          </label>

          <label style={label}>
            소개 (bio)
            <textarea style={{ ...input, height: 110 }} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="짧은 소개글" />
          </label>
        </div>

        <button style={btn} onClick={createPost}>
          게시글 등록
        </button>

        <p style={{ marginTop: 10, opacity: 0.8 }}>
          등록 성공 후{" "}
          <a href="/profiles" target="_blank" rel="noreferrer">
            /profiles
          </a>{" "}
          에서 카드 확인
        </p>
      </section>

      <pre style={pre}>{result}</pre>
    </main>
  );
}

const card: React.CSSProperties = {
  marginTop: 16,
  padding: 16,
  border: "1px solid rgba(0,0,0,.12)",
  borderRadius: 14,
  background: "rgba(0,0,0,.03)",
};

const h2: React.CSSProperties = { margin: "0 0 10px" };

const grid: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const label: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 13,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,.16)",
  outline: "none",
  background: "white",
};

const btn: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid rgba(245,158,11,.45)",
  background: "rgba(245,158,11,.18)",
  fontWeight: 800,
  cursor: "pointer",
};

const pre: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  border: "1px solid rgba(0,0,0,.12)",
  borderRadius: 12,
  background: "rgba(0,0,0,.04)",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};
