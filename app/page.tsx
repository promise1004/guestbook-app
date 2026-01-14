"use client";

import { useEffect, useMemo, useState } from "react";

type Reply = {
  id: string;
  entry_id: string;
  name: string;
  content: string;
  created_at: string;
  is_admin?: boolean;
};

type Entry = {
  id: string;
  name: string;
  avatar: string;
  content: string;
  created_at: string;
  replies: Reply[];
};

const INDENT = 54;

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

  // ✅ 답글 본인 인증된 replyId 저장
const [verifiedReplies, setVerifiedReplies] = useState<Record<string, boolean>>({});

// ✅ 어떤 답글을 인증 중인지
const [verifyReplyId, setVerifyReplyId] = useState<string | null>(null);
const [verifyPw, setVerifyPw] = useState("");

  // ✅ 관리자 키
  const [adminKey, setAdminKey] = useState("");
  const isAdminMode = useMemo(() => Boolean(adminKey), [adminKey]);

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

useEffect(() => {
  // iframe 안에서 열렸는지 확인
  setIsEmbedded(window.self !== window.top);
}, []);

  function formatDateTime(dateString: string) {
  const d = new Date(dateString);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${yyyy}. ${mm}. ${dd}. ${hh}:${mi}`;
}

  async function verifyReply(entryId: string, replyId: string) {
  const pw = verifyPw.trim();

  const res = await fetch(`/api/guestbook/${entryId}/replies/${replyId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pw, adminKey }),
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
    const k = prompt("관리자 키를 입력하세요");
    if (!k) return;
    setAdminKey(k);
    localStorage.setItem("ADMIN_KEY", k);
  }

  function clearAdmin() {
    setAdminKey("");
    localStorage.removeItem("ADMIN_KEY");
  }

  async function submitEntry() {
    const res = await fetch("/api/guestbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatar, password, content, adminKey }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "등록 실패");
    setName("");
    setAvatar("🙂");
    setPassword("");
    setContent("");
    load(page);
  }

  async function submitReply(entryId: string, r: { name: string; password: string; content: string }) {
    const res = await fetch(`/api/guestbook/${entryId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...r, adminKey }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "답글 실패");
    load(page);
  }

  async function editEntry(entryId: string) {
    const next = prompt("수정할 내용을 입력하세요");
    if (!next) return;

    const pw = isAdminMode ? "" : prompt("비밀번호를 입력하세요");
    if (!isAdminMode && !pw) return;

    const res = await fetch(`/api/guestbook/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, content: next, adminKey }),
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
      body: JSON.stringify({ password: pw, adminKey }),
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
      body: JSON.stringify({ password: pw, content: next, adminKey }),
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
      body: JSON.stringify({ password: pw, adminKey }),
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
    maxWidth: isEmbedded ? 1320 : 920,
    margin: "40px auto",
    padding: "0 16px",
  }}
>
      {/* 제목 + 관리자 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 22, marginBottom: 14 }}>방명록</h1>

        {!adminKey ? (
          <button onClick={setAdmin} style={{ ...linkBtn, fontSize: 12 }}>
            관리자 모드
          </button>
        ) : (
          <button onClick={clearAdmin} style={{ ...linkBtn, fontSize: 12 }}>
            관리자 해제
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
          <Field label="닉네임">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예) 아작님은아기자기해서아작인가요?"
              style={inputStyle}
            />
          </Field>

          <Field label="프로필" narrow>
            <select value={avatar} onChange={(e) => setAvatar(e.target.value)} style={inputStyle}>
              {["🙂", "😎", "🐰", "🐻", "🦊", "🐱", "✨"].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>

          <Field label="비밀번호 (수정/삭제)" narrow>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="4자 이상"
              style={inputStyle}
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
              padding: "10px 14px",
              borderRadius: 12,
              border: "none",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
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
    border: "1px dashed #e5e7eb",
    background: "#fffbeb",
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.6,
    textAlign: "center",
  }}
>
  <div style={{ fontWeight: 700, marginBottom: 6 }}>📌 공지</div>
  <div>
    이 방명록은 자유롭게 작성하실 수 있습니다.<br />
    비밀번호는 <b>수정·삭제 시 꼭 필요</b>하니 잊지 말아주세요 🙂
  </div>
</div>

<div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
  <button
    onClick={() => setPage((p) => Math.max(1, p - 1))}
    disabled={page <= 1}
    style={{
      padding: "8px 12px",
      borderRadius: 10,
      border: "1px solid #e5e7eb",
      background: page <= 1 ? "#f3f4f6" : "#fff",
      cursor: page <= 1 ? "not-allowed" : "pointer",
      fontSize: 13,
    }}
  >
    이전
  </button>

  <div style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center" }}>
    {page} / {totalPages}
  </div>

  <button
    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
    disabled={page >= totalPages}
    style={{
      padding: "8px 12px",
      borderRadius: 10,
      border: "1px solid #e5e7eb",
      background: page >= totalPages ? "#f3f4f6" : "#fff",
      cursor: page >= totalPages ? "not-allowed" : "pointer",
      fontSize: 13,
    }}
  >
    다음
  </button>
</div>

      {/* 리스트 카드 */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          overflow: "hidden",
          background: "#fff",
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
                padding: 16,
                borderTop: idx === 0 ? "none" : "1px solid #e5e7eb",
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

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <div style={{ fontWeight: 700 }}>{e.name}</div>
  <div style={{ fontSize: 12, color: "#acacac" }}>
    {formatDateTime(e.created_at)}
  </div>
</div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button onClick={() => editEntry(e.id)} style={linkBtn}>
                    수정
                  </button>
                  <button onClick={() => deleteEntry(e.id)} style={{ ...linkBtn, color: "#ef4444" }}>
                    삭제
                  </button>
                </div>
              </div>

              {/* 본문 (패딩 추가) */}
              <div
                style={{
                  marginTop: 10,
                  paddingLeft: INDENT,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontSize: 15,
                }}
              >
                {e.content}
              </div>

              {/* 답글 목록 */}
              {e.replies?.length ? (
                <div style={{ marginTop: 12, paddingLeft: INDENT, display: "grid", gap: 8 }}>
                  {e.replies.map((r) => {
                    const isAdmin = Boolean(r.is_admin);
                    const isEditing = editingReplyId === r.id;
                    const canManageReply = !!adminKey || !!verifiedReplies[r.id];
                    const isDeleteOpen =
                      deleteReplyUi?.entryId === e.id && deleteReplyUi?.replyId === r.id;

                    // (요청1) 편집 중 강조 스타일
                    const cardStyle: React.CSSProperties = isEditing
                      ? {
                          padding: 10,
                          borderRadius: 12,
                          border: "none",
                          background: "#fff",
                          boxShadow: "0 6px 16px rgba(17,24,39,0.08)",
                        }
                      : {
                          padding: 10,
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          background: "#fafafa",
                        };

                    return (
  <div key={r.id} style={cardStyle}>
    {/* ✅ 헤더: (닉네임/뱃지) + (버튼 1세트) */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div
          style={{
            fontWeight: 650,
            fontSize: 13,
            color: isAdmin ? "#ef4444" : "#111827",
          }}
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
            }}
          >
            관리자
          </span>
        )}

          {/* ✅ 답글 작성시간 */}
  <div style={{ fontSize: 12, color: "#acacac" }}>
    {formatDateTime(r.created_at)}
  </div>
</div>

      {/* ✅ 버튼은 여기 1세트만 */}
      {isEditing ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => saveReply(e.id, r.id)}
            style={{ ...linkBtn, fontSize: 12, color: "#111827", fontWeight: 700 }}
          >
            저장
          </button>
          <button onClick={cancelEditReply} style={{ ...linkBtn, fontSize: 12 }}>
            취소
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {canManageReply ? (
            <>
              <button onClick={() => startEditReply(r)} style={{ ...linkBtn, fontSize: 12 }}>
                수정
              </button>
              <button
                onClick={() => openDeleteReply(e.id, r.id)}
                style={{ ...linkBtn, fontSize: 12, color: "#ef4444" }}
              >
                삭제
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setVerifyReplyId(r.id);
                setVerifyPw("");
              }}
              style={{ ...linkBtn, fontSize: 12 }}
            >
              본인확인
            </button>
          )}
        </div>
      )}
    </div>

    {/* ✅ 내용/편집 */}
    {!isEditing ? (
      <div style={{ marginTop: 6, whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>
        {r.content}
      </div>
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

    {/* ✅ 본인확인 인라인 UI */}
    {!isAdminMode && verifyReplyId === r.id && !canManageReply && !isEditing ? (
      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px dashed #e5e7eb",
          display: "flex",
          gap: 8,
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
          onClick={() => verifyReply(e.id, r.id)}
          style={{
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
  </div>
);

                    {/* ✅ 본인확인 인라인 UI (일반유저) */}
{!isAdminMode && verifyReplyId === r.id && !canManageReply && !isEditing ? (
  <div
    style={{
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px dashed #e5e7eb",
      display: "flex",
      gap: 8,
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
      onClick={() => verifyReply(e.id, r.id)}
      style={{
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
                  })}
                </div>
              ) : null}

              {/* 답글 달기 버튼 */}
              <div style={{ marginTop: 12, paddingLeft: INDENT, display: "flex", gap: 10 }}>
                <button
                  onClick={() => setOpenReplyFor(isReplyOpen ? null : e.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  답글 달기
                </button>
              </div>

              {/* (요청3) 답글 입력 박스: 답글 목록 바로 아래에 붙고, 부드럽게 펼쳐짐 */}
              <div
                style={{
                  paddingLeft: INDENT,
                  overflow: "hidden",
                  maxHeight: isReplyOpen ? 320 : 0,
                  opacity: isReplyOpen ? 1 : 0,
                  transform: isReplyOpen ? "translateY(0)" : "translateY(-6px)",
                  transition: "max-height 220ms ease, opacity 180ms ease, transform 180ms ease",
                }}
              >
                <div style={{ paddingTop: isReplyOpen ? 12 : 0 }}>
                  {isReplyOpen ? (
                    <ReplyBox
                      onSubmit={async (r) => {
                        await submitReply(e.id, r);
                        setOpenReplyFor(null);
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
    </div>
  );
}

function Field({
  label,
  children,
  narrow,
}: {
  label: string;
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <div style={{ flex: 1, minWidth: narrow ? 180 : 220, maxWidth: narrow ? 260 : undefined }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function ReplyBox({
  onSubmit,
  onCancel,
}: {
  onSubmit: (r: { name: string; password: string; content: string }) => void;
  onCancel: () => void;
}) {
  const [rn, setRn] = useState("");
  const [rp, setRp] = useState("");
  const [rc, setRc] = useState("");

  return (
    <div style={{ marginTop: 0 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="답글 닉네임"
          value={rn}
          onChange={(e) => setRn(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="답글 비밀번호"
          type="password"
          value={rp}
          onChange={(e) => setRp(e.target.value)}
          style={{ ...inputStyle, maxWidth: 220 }}
        />
      </div>

      <textarea
        placeholder="답글 내용"
        value={rc}
        onChange={(e) => setRc(e.target.value)}
        style={{ ...inputStyle, marginTop: 8, minHeight: 70, resize: "vertical" as any }}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          취소
        </button>

        <button
          onClick={() => {
            onSubmit({ name: rn, password: rp, content: rc });
            setRn("");
            setRp("");
            setRc("");
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: "none",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          답글 등록
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
};

const linkBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#6b7280",
  padding: 0,
  fontSize: 13,
};
