// deploy trigger

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Reply = {
  id: string;
  entry_id: string;
  name: string;
  content: string;
  created_at: string;
  is_admin?: boolean;
  image_url?: string | null;
};

type Entry = {
  id: string;
  name: string;
  avatar: string;
  content: string;
  created_at: string;
  image_url?: string | null;   // ✅ 추가
  replies: Reply[];
};

const NO_TAP: React.CSSProperties = {
  WebkitTapHighlightColor: "transparent",
  WebkitTouchCallout: "none",
  outline: "none",
};

const INDENT = 54;
const MOBILE_BP = 768;
const CONTROL_H = 40;           // PC 입력칸 높이
const CONTROL_H_M = 38;         // 모바일 입력칸 높이

const FONT_STACK =
  '"Pretendard Variable","Pretendard",system-ui,-apple-system,"Segoe UI","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';

const ACCENT = "#ffb600";          // 포인트(기준)
const ACCENT_SOFT = "#fff9e8";     // ✅ 더 옅은 배경(노란기 줄임)
const ACCENT_LINE = "#ffe6ad";     // ✅ 더 옅은 테두리(공지에만 사용)
const ACCENT_TEXT = "#7a5200";     // ✅ 배경과 비슷하지만 진한 예쁜 톤

function useIndent() {
  const [indent, setIndent] = useState(INDENT);

  useEffect(() => {
    const apply = () => setIndent(window.innerWidth <= MOBILE_BP ? 0 : INDENT);
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return indent;
}

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🙂");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");

  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null);

  const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const limit = 5;
const sideIndent = useIndent();

// ✅ 관리자 키
const [adminKey, setAdminKey] = useState("");

// ✅ 관리자 모드 ON/OFF
const [adminEnabled, setAdminEnabled] = useState(false);

// ✅ 관리자 권한 여부 (둘 다 true일 때만)
const isAdminMode = useMemo(
  () => adminEnabled && Boolean(adminKey),
  [adminEnabled, adminKey]
);

// ✅ 화면폭으로 모바일 판정 (indent랑 분리)
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const apply = () => setIsMobile(window.innerWidth <= MOBILE_BP);
  apply();
  window.addEventListener("resize", apply);
  return () => window.removeEventListener("resize", apply);
}, []);

const linkBtn: React.CSSProperties = {
  ...NO_TAP,
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "#8d8d8d",
  fontSize: 12,
  fontWeight: 300,          // ✅ 지금보다 얇게
  textDecoration: "none",   // ✅ 밑줄 제거
};

const baseBtn: React.CSSProperties = {
  padding: isMobile ? "1px 6px" : "0px",
  borderRadius: 999,

  borderWidth: isMobile ? 1 : 0,
  borderStyle: "solid",
  borderColor: isMobile ? "#e5e7eb" : "transparent",

  background: isMobile ? "#fff" : "transparent",
  fontSize: isMobile ? 9 : 13,
  fontWeight: isMobile ? 650 : 600,
  color: "#6b7280",
  cursor: "pointer",

  lineHeight: isMobile ? "14px" as any : 1.2, // ✅ 높이 고정 느낌
  height: isMobile ? 20 : undefined,          // ✅ 세로 덩치 컷
  display: "inline-flex",                      // ✅ 가운데 정렬
  alignItems: "center",
  justifyContent: "center",

  fontFamily: "inherit",
};

// ✅ 글(방명록 본문) 수정/삭제 버튼
const entryBtn = baseBtn;

// ✅ 삭제 버튼(색만 변경: borderColor도 “분해된 상태”에서 바꾸므로 경고 없음)
const entryDelBtn: React.CSSProperties = {
  ...baseBtn,
  color: "#ef4444",
  borderColor: isMobile ? "#fecaca" : "transparent",
};

  // ✅ 답글 본인 인증된 replyId 저장
const [verifiedReplies, setVerifiedReplies] = useState<Record<string, boolean>>({});

// ✅ 어떤 답글을 인증 중인지
const [verifyReplyId, setVerifyReplyId] = useState<string | null>(null);
const [verifyPw, setVerifyPw] = useState("");

  // ✅ 답글 인라인 편집 상태
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingPw, setEditingPw] = useState(""); // (요청2) 답글 수정 시 인라인 비번

  // ✅ 답글 삭제 확인(요청2) 인라인 UI 상태
  const [deleteReplyUi, setDeleteReplyUi] = useState<{
    entryId: string;
    replyId: string;
    pw: string;
  } | null>(null);

  const [isEmbedded, setIsEmbedded] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

function goPage(p: number) {
  setPage(p);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

useEffect(() => {
  try {
    setIsEmbedded(window.self !== window.top);
  } catch {
    // cross-origin iframe이면 접근 막혀서 여기로 옴 → 그냥 iframe이라고 간주
    setIsEmbedded(true);
  }
}, []);

function formatDateTime(dateString: string) {
  const d = new Date(dateString);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}.${mm}.${dd} · ${hh}:${mi}`;
}

  async function verifyReply(entryId: string, replyId: string) {
  const pw = verifyPw.trim();

  const res = await fetch(`/api/guestbook/${entryId}/replies/${replyId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pw, adminKey: isAdminMode ? adminKey : undefined }),
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || "인증 실패");

  setVerifiedReplies((prev) => ({ ...prev, [replyId]: true }));
  setVerifyReplyId(null);
  setVerifyPw("");
}

async function load(p = page) {
  const res = await fetch(`/api/guestbook?sort=new&page=${p}&limit=${limit}`);
  const text = await res.text();

  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error("Guestbook API returned non-JSON:", text);
    alert("방명록 목록을 불러오지 못했습니다. (API 응답이 JSON이 아님)");
    return;
  }

  if (!res.ok) {
    alert(data.error || "불러오기 실패");
    return;
  }

  setEntries(data.entries ?? []);
  setTotalPages(data.totalPages ?? 1);
  setPage(data.page ?? p);
}

  useEffect(() => {
    const saved = localStorage.getItem("ADMIN_KEY") || "";
    setAdminKey(saved);
  }, []);

  useEffect(() => {
  load(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [page]);

function setAdmin() {
  // 이미 저장된 키가 있으면 바로 ON
  if (adminKey) {
    setAdminEnabled(true);
    return;
  }
  const k = prompt("관리자 키를 입력하세요");
  if (!k) return;
  setAdminKey(k);
  localStorage.setItem("ADMIN_KEY", k);
  setAdminEnabled(true);
}

function clearAdmin() {
  setAdminEnabled(false); // ✅ 여기 추가 (관리자모드 끔)
  // adminKey는 지워도 되고/유지해도 됨. 원하는대로.
  // 난 깔끔하게 같이 지우는 쪽 추천:
  setAdminKey("");
  localStorage.removeItem("ADMIN_KEY");
}

async function submitEntry() {
  try {
    let image_url: string | null = null;

    if (imageFile) {
      image_url = await uploadImage(imageFile); // ✅ 업로드 먼저
    }

    console.log("CLIENT image_url =", image_url); // ✅ 추가

    const res = await fetch("/api/guestbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  name,
  avatar,
  password,
  content,
  adminKey: isAdminMode ? adminKey : undefined,
  image_url,
}),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "등록 실패");

    setName("");
    setAvatar("🙂");
    setPassword("");
    setContent("");
    setImageFile(null); // ✅ 파일도 초기화

    load(page);
  } catch (err: any) {
    alert(err?.message || "이미지 업로드 실패");
  }
}

  async function uploadImage(file: File) {
  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("guestbook-images")
    .upload(filename, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("guestbook-images")
    .getPublicUrl(filename);

  return data.publicUrl;
}

async function submitReply(
  entryId: string,
  r: { name: string; password: string; content: string },
  file?: File | null
) {
  const fd = new FormData();
  fd.set("name", r.name);
  fd.set("password", r.password);
  fd.set("content", r.content);
  if (isAdminMode) fd.set("adminKey", adminKey);
  if (file) fd.set("image", file);

  const res = await fetch(`/api/guestbook/${entryId}/replies`, {
    method: "POST",
    body: fd,
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    console.error("Reply POST returned non-JSON:", text);
    alert("답글 등록 실패 (서버 응답이 JSON이 아님)");
    return false;
  }

  if (!res.ok) {
    alert(data.error || "답글 실패");
    return false;
  }

  await load(page);
  return true;
}

  async function editEntry(entryId: string) {
    const next = prompt("수정할 내용을 입력하세요");
    if (!next) return;

    const pw = isAdminMode ? "" : prompt("비밀번호를 입력하세요");
    if (!isAdminMode && !pw) return;

    const res = await fetch(`/api/guestbook/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, content: next, adminKey: isAdminMode ? adminKey : undefined }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "수정 실패");
    load(page);
  }

  async function deleteEntry(entryId: string) {
    const ok = confirm("정말 삭제할까요?");
    if (!ok) return;

    const pw = isAdminMode ? "" : prompt("비밀번호를 입력하세요");
    if (!isAdminMode && !pw) return;

    const res = await fetch(`/api/guestbook/${entryId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, adminKey: isAdminMode ? adminKey : undefined }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "삭제 실패");
    load(page);
  }

  // =========================
  // ✅ 답글: 수정 (요청 1,2)
  // =========================
  function startEditReply(reply: Reply) {
    setEditingReplyId(reply.id);
    setEditingText(reply.content);
    setEditingPw("");
    // 다른 UI 닫기
    setDeleteReplyUi(null);
  }

  function cancelEditReply() {
    setEditingReplyId(null);
    setEditingText("");
    setEditingPw("");
  }

  async function saveReply(entryId: string, replyId: string) {
    const next = editingText.trim();
    if (!next) return alert("내용을 입력하세요");

    // (요청2) 일반 유저는 인라인 비번 사용
    const pw = isAdminMode ? "" : editingPw.trim();
    if (!isAdminMode && pw.length < 4) return alert("비밀번호는 4자 이상 입력하세요");

    const res = await fetch(`/api/guestbook/${entryId}/replies/${replyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, content: next, adminKey: isAdminMode ? adminKey : undefined }),
    });

    const text = await res.text();
let data: any = {};
try {
  data = text ? JSON.parse(text) : {};
} catch {
  console.error("Reply PUT returned non-JSON:", text);
  alert("답글 수정 실패 (서버 응답이 JSON이 아님)");
  return;
}

    if (!res.ok) return alert(data.error || "답글 수정 실패");

    cancelEditReply();
    load(page);
  }

  // =========================
  // ✅ 답글: 삭제 (요청2)
  // =========================
  function openDeleteReply(entryId: string, replyId: string) {
    // 편집 중이면 편집 취소 (충돌 방지)
    if (editingReplyId) cancelEditReply();

    if (isAdminMode) {
      // 관리자는 바로 진행(확인만)
      deleteReply(entryId, replyId, "");
      return;
    }

    setDeleteReplyUi({ entryId, replyId, pw: "" });
  }

  function closeDeleteReply() {
    setDeleteReplyUi(null);
  }

  async function deleteReply(entryId: string, replyId: string, pw: string) {
    const ok = confirm("답글을 삭제할까요?");
    if (!ok) return;

    const res = await fetch(`/api/guestbook/${entryId}/replies/${replyId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, adminKey: isAdminMode ? adminKey : undefined }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "답글 삭제 실패");

    if (editingReplyId === replyId) cancelEditReply();
    setDeleteReplyUi(null);
    load(page);
  }

return (
  <div
    style={{
      // ✅ PC/모바일 모두 폭 조금 키우기
      // - PC: 920 → 980 (살짝 넓게)
      // - iframe: 1320 → 1440 (살짝 넓게)
      // - 모바일: 100%로 꽉 채움
      maxWidth: isMobile ? "100%" : isEmbedded ? 1440 : 980,

      // ✅ 모바일은 위 여백만 살짝, 좌우는 꽉
      margin: isMobile ? "10px auto" : "40px auto",

      // ✅ 모바일 좌우 여백 줄여서 “가로가 더 커 보이게”
      padding: isMobile ? "0 6px" : "0 18px",

      fontFamily: FONT_STACK,
      WebkitTextSizeAdjust: "100%",

      background: "transparent",

      // ✅ 모바일에서만 “전체 영역 감싸는 테두리 느낌” 제거
      borderRadius: isMobile ? 0 : isEmbedded ? 0 : 18,
    }}
  >

      {/* 제목 + 관리자 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, marginBottom: 14 }}>방명록</h1>

{!adminEnabled ? (
  <button onClick={setAdmin} style={{ ...linkBtn, fontSize: 12 }}>
    관리자모드
  </button>
) : (
  <button onClick={clearAdmin} style={{ ...linkBtn, fontSize: 12 }}>
    관리자해제
  </button>
)}
      </div>

      {/* 작성 카드 */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          padding: 16,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Field label="닉네임" isMobile={isMobile}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 아작님은아기자기해서아작인가요?"
              style={inputStyle}
            />
          </Field>

          <Field label="프로필" narrow isMobile={isMobile}>
            <select value={avatar} onChange={(e) => setAvatar(e.target.value)} style={selectStyle}>
              {["🙂", "😎", "🐰", "🐻", "🦊", "🐱", "✨"].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>

          <Field label="비밀번호 (수정/삭제)" narrow isMobile={isMobile}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="4자 이상"
              style={inputStyle}
            />
          </Field>

            {/* ✅ 여기 추가: 이미지 첨부 */}
<Field label="사진 첨부" narrow isMobile={isMobile}>
  <FilePicker
    file={imageFile}
    onChange={(f) => setImageFile(f)}
    isMobile={isMobile}
    label="파일선택"
  />
</Field>

        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 6 }}>내용</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="응원 한마디 남겨주세요 !"
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" as any }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button
            onClick={submitEntry}
style={{
  ...NO_TAP,
  padding: "8px 14px",
  borderRadius: 12,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: ACCENT_LINE,
  background: ACCENT_SOFT,
  color: ACCENT_TEXT,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
}}
          >
            등록
          </button>
        </div>
      </div>

      {/* 공지사항 */}
<div
  style={{
    marginTop: 16,
    padding: "14px 16px",
    borderRadius: 14,
border: `1px dashed ${ACCENT_LINE}`,
background: ACCENT_SOFT,
color: "#374151",
    fontSize: 14,
    lineHeight: 1.6,
    textAlign: "center",
  }}
>
  <div style={{ fontWeight: 600, marginBottom: 6 }}>📌 공지</div>
  <div>
    이 방명록은 자유롭게 작성하실 수 있습니다.<br />
    비밀번호는 <b>수정·삭제 시 꼭 필요</b>하니 잊지 말아주세요 🙂
  </div>
</div>

<div style={{ marginTop: 20, marginBottom: 20 }}>
<Pagination page={page} totalPages={totalPages} onChange={goPage} isMobile={isMobile} />
      </div>

      {/* 리스트 카드 */}
<div
  style={{
    marginTop: 16,

    // ✅ 모바일에서만 바깥 테두리 제거 (구분선은 각 아이템 borderTop이라 그대로 남음)
    border: isMobile ? "none" : "1px solid #e5e7eb",

    // ✅ 모바일에서만 둥근 모서리 제거 (액자 느낌 제거)
    borderRadius: isMobile ? 0 : 18,

    overflow: "hidden",
    background: "#fff",
    boxShadow: "none",
  }}
>

        {entries.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
            아직 방명록이 없어요. 첫 글을 남겨주세요 🙂
          </div>
        ) : null}

        {entries.map((e, idx) => {
          const isReplyOpen = openReplyFor === e.id;

          return (
<div
  key={e.id}
  style={{
    padding: isMobile ? "26px 12px" : "22px 16px",
    borderTop: idx === 0 ? "none" : "1px solid #eef2f7",
    background: "#fff",
  }}
>
              {/* 헤더 */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border: "1px solid #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    {e.avatar}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
  {/* 윗줄: 닉네임 */}
  <div style={{ fontWeight: 700 }}>{e.name}</div>

  {/* 아랫줄: 날짜 */}
  <div style={{ fontSize: 12, color: "#acacac" }}>
    {formatDateTime(e.created_at)}
  </div>
</div>
                </div>

<div
  style={{
    flexShrink: 0,
    display: "flex",
flexWrap: "nowrap",
gap: 6,
    justifyContent: "flex-end",
    paddingRight: isMobile ? 0 : 6,
  }}
>
<button onClick={() => editEntry(e.id)} style={entryBtn}>
  수정
</button>
<button onClick={() => deleteEntry(e.id)} style={entryDelBtn}>
  삭제
</button>
</div>
              </div>

              {/* 본문 (패딩 추가) */}
<div
  style={{
    marginTop: 10,
    marginBottom: 8, // ✅ 추가
    paddingInline: sideIndent,
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
    fontSize: 15,
  }}
>
  {e.content}
</div>

{/* ✅ 여기부터 이미지 출력 */}
{e.image_url && (
  <div style={{ marginTop: 16, marginBottom: 14, paddingInline: sideIndent, display: "flex", gap: 10 }}>
<img
  src={e.image_url}
  loading="lazy"
  alt="첨부 이미지"
  onClick={() => setViewerUrl(e.image_url!)}
  style={{
    maxWidth: "100%",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    cursor: "zoom-in",
  }}
/>
  </div>
)}

              {/* 답글 목록 */}
              {e.replies?.length ? (
                <div style={{ marginTop: 14, paddingInline: sideIndent, display: "grid", gap: 8 }}>
                  {e.replies.map((r) => {
                    const isAdmin = Boolean(r.is_admin);
                    const isEditing = editingReplyId === r.id;
                    const canManageReply = isAdminMode || !!verifiedReplies[r.id];
                    const isDeleteOpen =
                      deleteReplyUi?.entryId === e.id && deleteReplyUi?.replyId === r.id;

                    // (요청1) 편집 중 강조 스타일
const cardStyle: React.CSSProperties = isEditing
  ? {
      padding: 10,
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#fff",
    }
  : {
      padding: 10,
      borderRadius: 12,
      border: "1px solid #e5e7eb",
      background: "#fafafa",
    };

                    return (
  <div key={r.id} style={cardStyle}>
    {/* ✅ 헤더: 모바일에서는 2줄로 깔끔하게 */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: isMobile ? "flex-start" : "center",
  }}
>
  {/* 왼쪽: 이름(윗줄) + 시간(아랫줄) */}
  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
    {/* 윗줄: 이름 + 관리자 뱃지 */}
    <div
      style={{
        display: "flex",
        gap: isMobile ? 6 : 8,
        alignItems: "center",
        minWidth: 0,
      }}
    >
<div
  style={{
    fontWeight: 650,
    fontSize: 14,            // ✅ 닉네임 1pt 업
    color: isAdmin ? "#ef4444" : "#111827",

    whiteSpace: "normal",    // ✅ 줄바꿈 허용
    overflow: "visible",
    textOverflow: "clip",
    wordBreak: "break-word", // ✅ 긴 닉네임 강제 줄바꿈
    lineHeight: 1.2,
  }}
  title={r.name}
>
  {r.name}
</div>

      {isAdmin && (
        <span
          style={{
            fontSize: 11,
            padding: "2px 6px",
            borderRadius: 999,
            background: "#ffffff",
            color: "#111827",
            fontWeight: 700,
            border: "1px solid #e5e7eb",
            whiteSpace: "nowrap",
          }}
        >
          관리자
        </span>
      )}
    </div>

    {/* 아랫줄: 시간 */}
    <div style={{ fontSize: 12, color: "#acacac", whiteSpace: "nowrap" }}>
      {formatDateTime(r.created_at)}
    </div>
  </div>

  {/* 오른쪽: 버튼 (줄바꿈 방지) */}
<div
  style={{
    flexShrink: 0,
    display: "flex",
    alignItems: isMobile ? "flex-start" : "center", // ✅ 위로 붙이기
    gap: isMobile ? 4 : 8,                          // ✅ gap 줄이기
    justifyContent: "flex-end",
    flexWrap: "nowrap",
    paddingTop: isMobile ? 2 : 0,                   // ✅ 미세 조정
  }}
>
{isEditing ? (
  <>
    <button type="button" onClick={() => saveReply(e.id, r.id)} style={entryBtn}>
      저장
    </button>
    <button type="button" onClick={cancelEditReply} style={entryBtn}>
      취소
    </button>
  </>
) : canManageReply ? (
  <>
    <button type="button" onClick={() => startEditReply(r)} style={entryBtn}>
      수정
    </button>
    <button type="button" onClick={() => openDeleteReply(e.id, r.id)} style={entryDelBtn}>
      삭제
    </button>
  </>
) : (
  <button
    type="button"
    onClick={() => {
      setVerifyReplyId(r.id);
      setVerifyPw("");
    }}
    style={entryBtn}
  >
    본인확인
  </button>
)}
</div>
</div>   {/* ✅ 헤더(이름/시간 + 버튼 줄) 닫기 */}

{/* ✅ 내용/편집 */}
{!isEditing ? (
  <>
    <div style={{ marginTop: 6, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>
      {r.content}
    </div>

    {r.image_url ? (
      <div style={{ marginTop: 10 }}>
        <img
          src={r.image_url}
          alt="답글 첨부 이미지"
          onClick={() => setViewerUrl(r.image_url!)}
          style={{
            maxWidth: "100%",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            display: "block",
            cursor: "zoom-in",
          }}
        />
      </div>
    ) : null}
  </>
) : (
  <>
        <textarea
          value={editingText}
          onChange={(ev) => setEditingText(ev.target.value)}
          style={{
            ...inputStyle,
            marginTop: 8,
            minHeight: 70,
            resize: "vertical" as any,
            background: "#fff",
            border: "1px solid #e5e7eb", // ✅ 검정 테두리 방지
            outline: "none",
          }}
        />

        {!isAdminMode ? (
          <div style={{ marginTop: 8 }}>
            <input
              type="password"
              value={editingPw}
              onChange={(ev) => setEditingPw(ev.target.value)}
              placeholder="비밀번호(4자 이상) 입력 후 저장"
              style={{ ...inputStyle, maxWidth: 280 }}
            />
          </div>
        ) : null}
      </>
    )}

    {/* ✅ 삭제 확인 UI (일반 유저) */}
    {isDeleteOpen && !isAdminMode ? (
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px dashed #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 12, color: "#6b7280" }}>답글 삭제하려면 비밀번호를 입력하세요</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="password"
            value={deleteReplyUi.pw}
            onChange={(ev) =>
              setDeleteReplyUi((prev) => (prev ? { ...prev, pw: ev.target.value } : prev))
            }
            placeholder="비밀번호"
            style={{ ...inputStyle, maxWidth: 180, padding: "8px 10px" }}
          />
          <button
            onClick={() => {
              const pw = deleteReplyUi.pw.trim();
              if (pw.length < 4) return alert("비밀번호는 4자 이상 입력하세요");
              deleteReply(e.id, r.id, pw);
            }}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ef4444",
              background: "#ef4444",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            삭제 확인
          </button>
          <button onClick={closeDeleteReply} style={{ ...linkBtn, fontSize: 12 }}>
            취소
          </button>
        </div>
      </div>
    ) : null}

{/* ✅ 본인확인 인라인 UI (일반유저) */}
{!isAdminMode && verifyReplyId === r.id && !canManageReply && !isEditing ? (
  <div
    style={{
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px dashed #e5e7eb",
      display: "flex",
      gap: isMobile ? 6 : 8,
      alignItems: "center",
      flexWrap: "wrap",
    }}
  >
    <input
      type="password"
      value={verifyPw}
      onChange={(ev) => setVerifyPw(ev.target.value)}
      placeholder="비밀번호(4자 이상)"
      style={{ ...inputStyle, maxWidth: 220, padding: "8px 10px" }}
    />
<button
  type="button"
  onClick={() => verifyReply(e.id, r.id)}
  style={{
    ...NO_TAP,
    padding: "8px 10px",
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
  }}
>
  확인
</button>

<button
  type="button"
  onClick={() => {
    setVerifyReplyId(null);
    setVerifyPw("");
  }}
  style={{ ...linkBtn, fontSize: 12 }}
>
  취소
</button>
  </div>
) : null}

  </div>
);
                  })}
                </div>
              ) : null}

{/* 답글 달기 버튼 */}
<div style={{ marginTop: 16, marginBottom: 10, paddingInline: sideIndent, display: "flex", gap: 10 }}>
  <button
    type="button"
    onClick={() => setOpenReplyFor(isReplyOpen ? null : e.id)}
style={{
    ...NO_TAP,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  color: "#111827",
  fontWeight: 500,
}}
  >
    {isReplyOpen ? "댓글 닫기" : "댓글 달기"}
  </button>
</div>

              {/* (요청3) 답글 입력 박스: 답글 목록 바로 아래에 붙고, 부드럽게 펼쳐짐 */}
              <div
                style={{
                  paddingInline: sideIndent,
                  overflow: "hidden",
                  maxHeight: isReplyOpen ? 320 : 0,
                  opacity: isReplyOpen ? 1 : 0,
                  transform: isReplyOpen ? "translateY(0)" : "translateY(-6px)",
                  transition: "max-height 220ms ease, opacity 180ms ease, transform 180ms ease",
                  paddingBottom: isReplyOpen ? 12 : 0,
                }}
              >
                <div style={{ paddingTop: isReplyOpen ? 12 : 0 }}>
                  {isReplyOpen ? (
<ReplyBox
  isMobile={isMobile}
onSubmit={async (r) => {
  const { file, ...payload } = r;
  const ok = await submitReply(e.id, payload, file ?? null);
  if (ok) setOpenReplyFor(null);
}}
  onCancel={() => setOpenReplyFor(null)}
/>
                  ) : null}
                </div>
              </div>
            </div>
          );
                })}
      </div>

            {/* ✅ 방명록 제일 하단 페이지네이션 */}
      <div style={{ marginTop: 24 }}>
        <Pagination page={page} totalPages={totalPages} onChange={goPage} isMobile={isMobile} />
      </div>

      {/* ✅ 이미지 확대 뷰어: Home() return 안에 있어야 함 */}
      {viewerUrl && (
        <div
          onClick={() => setViewerUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            cursor: "zoom-out",
          }}
        >
          <img
            src={viewerUrl}
            alt="확대 이미지"
            style={{
              maxWidth: "100%",
              maxHeight: "90vh",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.25)",
              display: "block",
            }}
            onClick={(ev) => ev.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function FilePicker({
  file,
  onChange,
  isMobile,
  label = "사진 첨부",
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  isMobile: boolean;
  label?: string;
}) {
  const id = React.useId();

  const H = isMobile ? CONTROL_H_M : CONTROL_H;

  return (
    <div
      style={{
        width: "100%",
        borderWidth: 1,                 // ✅ 무조건 1px
        borderStyle: "solid",
        borderColor: "#e5e7eb",         // ✅ 바깥 테두리는 회색 고정(두꺼워 보이는 착시 방지)
        borderRadius: 12,
        padding: 0,
        height: H,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#fff",
        boxSizing: "border-box",
        overflow: "hidden",             // ✅ 안쪽 요소가 밖으로 삐져나오며 테두리 두꺼워 보이는 것 방지
      }}
    >
      <input
        id={id}
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />

      <label
        htmlFor={id}
        style={{
          ...NO_TAP,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: H,                    // ✅ 세로 꽉 채우고
          padding: isMobile ? "0 10px" : "0 12px",
          borderRadius: 0,              // ✅ 컨테이너가 라운드라 버튼은 0이 더 깔끔
          border: "none",               // ✅ 라벨 테두리 제거(겹쳐 보여서 두꺼워 보이는 원인)
          background: ACCENT_SOFT,       // ✅ 버튼만 은은한 포인트
          color: ACCENT_TEXT,
          cursor: "pointer",
          fontSize: isMobile ? 12 : 13,
          fontWeight: 600,
          flexShrink: 0,
          userSelect: "none",
          lineHeight: 1,
        }}
      >
        {label}
      </label>

      <div
        style={{
          minWidth: 0,
          flex: 1,
          height: "100%",
          display: "flex",
          alignItems: "center",
          fontSize: isMobile ? 12 : 13,
          color: file ? "#374151" : "#9ca3af",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          paddingRight: 10,
        }}
        title={file?.name ?? ""}
      >
        {file ? file.name : "선택된 파일 없음"}
      </div>

      {file ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#6b7280",
            fontSize: isMobile ? 12 : 13,
            fontWeight: 700,
            padding: "0 10px",
            height: "100%",
            lineHeight: 1,
          }}
        >
          삭제
        </button>
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
  isMobile,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  isMobile: boolean;
}) {


  if (totalPages <= 1) return null;

  const windowSize = 5;
  const jump = 10;

  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - windowSize + 1);
  }

  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);

const btn: React.CSSProperties = {
  minWidth: isMobile ? 26 : 32,
  height: isMobile ? 30 : 30,
  padding: isMobile ? "0 8px" : "0 10px",
  borderRadius: isMobile ? 9 : 10,

  // border 경고도 같이 없애려고 분리해서 써줄게
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",

  background: "#fff",
  cursor: "pointer",
  fontSize: isMobile ? 11 : 12,
  color: "#374151",
  fontWeight: 700,
  outline: "none",
  fontFamily: "inherit",
};

const active: React.CSSProperties = {
  ...btn,
  background: ACCENT_SOFT,
  color: "#111827",
  fontWeight: 900,
  borderColor: ACCENT_LINE,
};

  const disabled: React.CSSProperties = {
    ...btn,
    opacity: 0.4,
    cursor: "not-allowed",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: isMobile ? 6 : 8,
        justifyContent: "center",
        marginTop: 16,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {/* 이전 (10페이지) */}
      <button
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - jump))}
        style={page <= 1 ? disabled : btn}
      >
        이전
      </button>

      {/* 앞쪽 */}
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} style={btn}>
            1
          </button>
          {start > 2 && <span style={{ color: "#9ca3af" }}>…</span>}
        </>
      )}

      {/* 가운데 */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={p === page ? active : btn}
        >
          {p}
        </button>
      ))}

      {/* 뒤쪽 */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: "#9ca3af" }}>…</span>}
          <button onClick={() => onChange(totalPages)} style={btn}>
            {totalPages}
          </button>
        </>
      )}

      {/* 다음 (10페이지) */}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(Math.min(totalPages, page + jump))}
        style={page >= totalPages ? disabled : btn}
      >
        다음
      </button>
    </div>
  );
}

function Field({
  label,
  children,
  narrow,
  isMobile,
}: {
  label: string;
  children: React.ReactNode;
  narrow?: boolean;
  isMobile: boolean;
}) {
  return (
    <div
      style={{
        flex: isMobile ? "1 1 100%" : 1,
        width: isMobile ? "100%" : undefined,
        minWidth: isMobile ? "100%" : narrow ? 180 : 220,
        maxWidth: isMobile ? "100%" : narrow ? 260 : undefined,
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function ReplyBox({
  onSubmit,
  onCancel,
  isMobile,
}: {
  onSubmit: (r: { name: string; password: string; content: string; file?: File | null }) => void;
  onCancel: () => void;
  isMobile: boolean;
}) {
  const [rn, setRn] = useState("");
  const [rp, setRp] = useState("");
  const [rc, setRc] = useState("");
  const [rf, setRf] = useState<File | null>(null);

  return (
    <div style={{ marginTop: 0 }}>
      <div
  style={{
    display: "grid",
    gap: 10,
    gridTemplateColumns: isMobile ? "1fr" : "1fr 220px",
    alignItems: "center",
  }}
>
        <input
          placeholder="댓글 닉네임"
          value={rn}
          onChange={(e) => setRn(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="댓글 비밀번호"
          type="password"
          value={rp}
          onChange={(e) => setRp(e.target.value)}
          style={inputStyle}
        />
      </div>

      <textarea
        placeholder="댓글 내용"
        value={rc}
        onChange={(e) => setRc(e.target.value)}
        style={{ ...inputStyle, marginTop: 8, minHeight: 70, resize: "vertical" as any }}
      />

<div style={{ marginTop: 8 }}>
  <FilePicker
    file={rf}
    onChange={(f) => setRf(f)}
    isMobile={isMobile}
    label="파일선택"
  />
</div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 8 }}>
        <button
          onClick={onCancel}
style={{
  ...NO_TAP,
  padding: isMobile ? "6px 10px" : "8px 12px",
  borderRadius: isMobile ? 10 : 12,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontSize: isMobile ? 12 : 13,
  fontWeight: isMobile ? 500 : 600,
  color: "#374151",
}}
        >
          취소
        </button>

        <button
          onClick={() => {
onSubmit({ name: rn, password: rp, content: rc, file: rf });
setRn("");
setRp("");
setRc("");
setRf(null);
          }}
style={{
  ...NO_TAP,
  padding: isMobile ? "6px 10px" : "8px 12px",
  borderRadius: isMobile ? 10 : 12,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: ACCENT_LINE,
  background: ACCENT_SOFT,
  color: ACCENT_TEXT,
  cursor: "pointer",
  fontSize: isMobile ? 12 : 13,
  fontWeight: isMobile ? 600 : 600,
}}
        >
          댓글 등록
        </button>
      </div>
    </div>
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
  fontFamily: "inherit",
  height: CONTROL_H,              // ✅ PC 기본 높이 통일
  lineHeight: "20px",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  WebkitAppearance: "none",
  appearance: "none",
  backgroundColor: "#fff",
  paddingRight: 36,
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 20 20%27 fill=%27none%27%3E%3Cpath d=%27M6 8l4 4 4-4%27 stroke=%27%239ca3af%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")',
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  backgroundSize: 16,
  WebkitTapHighlightColor: "transparent",
  outline: "none",
};
