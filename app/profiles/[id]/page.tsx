"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, useSearchParams } from "next/navigation";

type UploadResult = { url?: string; error?: string };

type Post = {
  id: string;
  title: string;
  role: string | null;
  bio: string | null;
  cover_url: string | null;
  image_urls: string[] | null;
  created_at: string;
};

type Reply = {
  id: string;
  comment_id: string;
  name: string;
  avatar: string | null;
  content: string;
  is_admin?: boolean;
  created_at: string;
};

type Comment = {
  id: string;
  post_id: string;
  name: string;
  avatar?: string | null;
  content: string;
  image_urls: string[] | null;
  created_at: string;
  likes_count?: number | null; 
  // ✅ 답글 목록 추가
  replies?: Reply[];
};

export default function ProfileDetailPage() {
  const params = useParams();
const id = typeof (params as any)?.id === "string" ? (params as any).id : undefined;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string>("");

  // ✅ 관리자 모드 토글 + 키
  const [adminOn, setAdminOn] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const isAdmin = adminOn && adminKey.trim().length > 0;

  // 작성 폼
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🙂");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");

  // 첨부
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  // 업로드 상태
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressNow, setProgressNow] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [step, setStep] = useState("");

  // 뷰어
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState("");
  const viewerCloseBtnRef = useRef<HTMLButtonElement | null>(null);

  // ✅ 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editPw, setEditPw] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const router = useRouter();
const sp = useSearchParams();
const embed = sp.get("embed") === "1";

// ✅ (추가) 마지막으로 본 상세 id 저장 (F5 복귀용)
useEffect(() => {
  if (!id) return;
  try {
    localStorage.setItem("profiles_last_open", id);
  } catch {}
}, [id]);

  // ✅ 댓글 '달린 순서' 고정(처음 본 순서 그대로 유지)
const orderRef = useRef<string[]>([]);

    // =========================
  // ✅ 답글 상태
  // =========================
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null);

  // 댓글별 답글 목록 캐시
  const [repliesByComment, setRepliesByComment] = useState<Record<string, Reply[]>>({});

  // 답글 작성 폼
  const [rName, setRName] = useState("");
  const [rAvatar, setRAvatar] = useState("🙂");
  const [rPw, setRPw] = useState("");
  const [rContent, setRContent] = useState("");

  // 답글 본인확인(verify) 상태
  const [verifiedReplyIds, setVerifiedReplyIds] = useState<Record<string, boolean>>({});
  const [verifyReplyId, setVerifyReplyId] = useState<string | null>(null);
  const [verifyPw, setVerifyPw] = useState("");

  // 답글 수정 상태
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [editReplyPw, setEditReplyPw] = useState("");

  // 답글 삭제 UI
  const [deleteReplyUi, setDeleteReplyUi] = useState<{
    commentId: string;
    replyId: string;
    pw: string;
  } | null>(null);

  // ✅ 수정 이미지 편집(기존/추가)
  const [editKeepUrls, setEditKeepUrls] = useState<string[]>([]);
  const editFileRef = useRef<HTMLInputElement | null>(null);
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const editPreviews = useMemo(() => editFiles.map((f) => URL.createObjectURL(f)), [editFiles]);

  useEffect(() => {
  // 처음 로드/갱신 때, 기존 orderRef에 없는 id를 뒤에 붙임
  const seen = new Set(orderRef.current);
  const next = [...orderRef.current];

  for (const c of comments) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      next.push(c.id);
    }
  }

  // 삭제된 댓글 id는 제거(깔끔하게)
  const alive = new Set(comments.map((c) => c.id));
  orderRef.current = next.filter((id) => alive.has(id));
}, [comments]);

  useEffect(() => {
    const savedKey = localStorage.getItem("profiles_adminKey") || "";
    const savedOn = localStorage.getItem("profiles_adminOn") || "0";
    if (savedKey) setAdminKey(savedKey);
    setAdminOn(savedOn === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("profiles_adminKey", adminKey);
  }, [adminKey]);
  useEffect(() => {
    localStorage.setItem("profiles_adminOn", adminOn ? "1" : "0");
  }, [adminOn]);

  // objectURL 정리
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);
  useEffect(() => {
    return () => editPreviews.forEach((u) => URL.revokeObjectURL(u));
  }, [editPreviews]);

  // ESC 뷰어 닫기
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setViewerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen]);
  useEffect(() => {
    if (viewerOpen) setTimeout(() => viewerCloseBtnRef.current?.focus(), 0);
  }, [viewerOpen]);

  // ✅ 댓글 목록이 바뀌면(로드되면) 답글도 전부 미리 로드 → 답글 상시 노출
useEffect(() => {
  if (!id) return;
  if (!comments.length) return;

  (async () => {
    // 아직 캐시에 없는 댓글만 로드
    for (const c of comments) {
      if (!repliesByComment[c.id]) {
        await loadReplies(c.id);
      }
    }
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id, comments]);

  function openViewer(src: string) {
    setViewerSrc(src);
    setViewerOpen(true);
  }

  async function uploadOne(file: File, folder: string): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);

    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const text = await res.text();

    let json: UploadResult = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { error: text };
    }

    if (!res.ok) throw new Error(json?.error ?? "upload failed");
    if (!json.url) throw new Error("upload url missing");
    return json.url;
  }

  async function loadAll() {
    if (!id) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/profiles/${id}`, { cache: "no-store" }),
        fetch(`/api/profiles/${id}/comments`, { cache: "no-store" }),
      ]);

      if (!pRes.ok) {
        const t = await pRes.text().catch(() => "");
        throw new Error(`프로필 로딩 실패: ${t || pRes.status}`);
      }
      if (!cRes.ok) {
        const t = await cRes.text().catch(() => "");
        throw new Error(`댓글 로딩 실패: ${t || cRes.status}`);
      }

      const pJson = await pRes.json().catch(() => ({}));
      const cJson = await cRes.json().catch(() => ({}));

      setPost(pJson?.post ?? null);
      setComments(cJson?.comments ?? []);
    } catch (e: any) {
      setPost(null);
      setComments([]);
      setLoadError(e?.message ?? "로딩 중 오류");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const images = useMemo(() => {
    if (!post) return [];
    const arr = Array.isArray(post.image_urls) ? post.image_urls : [];
    const set = new Set<string>();
    const out: string[] = [];
    if (post.cover_url) {
      set.add(post.cover_url);
      out.push(post.cover_url);
    }
    for (const u of arr) {
      if (u && !set.has(u)) {
        set.add(u);
        out.push(u);
      }
    }
    return out;
  }, [post]);

function renderComment(c: Comment, keyPrefix = "") {
  const likes = c.likes_count ?? 0;
  const isBest = bestLikes >= 1 && likes === bestLikes;

  return (
    <div className={`item ${isBest ? "best" : ""} ${keyPrefix ? "featured" : ""}`} key={`${keyPrefix}${c.id}`}>
      <div className="headRow">
        <div className="left">
          <div className="avatar" aria-hidden="true">
            {c.avatar ?? "🙂"}
          </div>

          <div className="meta">
            <div className="nameLine">
              <span className="name">{c.name}</span>
              {isBest ? <span className="bestBadge">BEST</span> : null}
              <span className="time">{new Date(c.created_at).toLocaleString()}</span>
            </div>

            {editingId !== c.id ? <div className="cBody">{c.content}</div> : null}
          </div>
        </div>

        <div className="actions">
          <button
            className="aBtn like"
            type="button"
            onClick={() => likeComment(c.id)}
            disabled={busyId === c.id || uploading || submitting}
          >
            👍 <span className="likeNum">{likes}</span>
          </button>

          <button
            className="aBtn"
            type="button"
            onClick={() => setOpenReplyFor(openReplyFor === c.id ? null : c.id)}
          >
            {openReplyFor === c.id ? "답글닫기" : "답글달기"}
          </button>

          <button className="aBtn" type="button" onClick={() => startEdit(c)} disabled={busyId === c.id}>
            수정
          </button>

          <button className="aBtn danger" type="button" onClick={() => deleteComment(c.id)} disabled={busyId === c.id}>
            삭제
          </button>
        </div>
      </div>

      <div className="textWrap">
        {editingId === c.id ? (
          <>
            <textarea
              className="editTa"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="수정 내용을 입력하세요"
            />

            {editKeepUrls.length ? (
              <div className="editImgs">
                {editKeepUrls.map((u) => (
                  <button
                    type="button"
                    className="keep"
                    key={u}
                    onClick={() => removeKeepUrl(u)}
                    title="클릭하면 삭제(제외)"
                  >
                    <img src={u} alt="" />
                    <span className="keepX">×</span>
                  </button>
                ))}
                <div className="hint">유지할 이미지만 남기고, 삭제할 건 클릭해서 빼면 돼</div>
              </div>
            ) : null}

            <div className="editAdd">
              <input
                ref={editFileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => onPickEditFiles(e.target.files)}
                disabled={busyId === c.id || uploading}
              />
              <button
                type="button"
                className="btn ghost"
                onClick={() => editFileRef.current?.click()}
                disabled={busyId === c.id || uploading}
              >
                이미지 추가
              </button>

              {editPreviews.length ? (
                <div className="pickWrap">
                  {editPreviews.map((src, idx) => (
                    <div className="pick" key={`${src}-${idx}`}>
                      <img src={src} alt="" />
                      <button
                        type="button"
                        className="x"
                        onClick={() => removeEditFile(idx)}
                        aria-label="삭제"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="editBar">
              {!isAdmin ? (
                <input
                  className="pwIn"
                  value={editPw}
                  onChange={(e) => setEditPw(e.target.value)}
                  placeholder="작성자 비밀번호 (4자+)"
                  type="password"
                />
              ) : (
                <div className="adminChip">관리자</div>
              )}

              <div className="editBtns">
                <button className="btn" onClick={() => saveEdit(c.id)} disabled={busyId === c.id || uploading}>
                  저장
                </button>
                <button className="btn ghost" onClick={cancelEdit} disabled={busyId === c.id || uploading}>
                  취소
                </button>
              </div>
            </div>

            {uploading || (progressTotal > 0 && progressNow > 0) ? (
              <div className="prog">
                <div className="progTop">
                  <div className="progTxt">업로드 {progressNow}/{progressTotal}</div>
                  <div className="progTxt2">{step || "처리 중…"}</div>
                </div>
                <div className="bar">
                  <div className="barIn" style={{ width: `${progressRatio * 100}%` }} />
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {Array.isArray(c.image_urls) && c.image_urls.length ? (
        <div className="thumbGrid">
          {(() => {
            const urls = c.image_urls!;
            const MAX = 4;
            const hasMore = urls.length > MAX;
            const tileUrls = hasMore ? urls.slice(0, MAX) : urls.slice(0, Math.min(urls.length, MAX));
            const moreCount = hasMore ? urls.length - (MAX - 1) : 0;

            return tileUrls.map((u, i) => {
              const isMoreTile = hasMore && i === MAX - 1;
              return (
                <button
                  type="button"
                  className={`thumb ${isMoreTile ? "more" : ""}`}
                  key={`${u}-${i}`}
                  onClick={() => openViewer(u)}
                  aria-label="이미지 크게 보기"
                >
                  <img src={u} alt="" loading="lazy" />
                  {isMoreTile ? <span className="moreBadge">+{moreCount}</span> : null}
                </button>
              );
            });
          })()}
        </div>
      ) : null}

      <div className="replies">
        {(repliesByComment[c.id]?.length ?? 0) > 0 ? (
          <div className="replyList">
            {repliesByComment[c.id].map((r) => {
              const isEditing = editingReplyId === r.id;
              const canManage = isAdmin || !!verifiedReplyIds[r.id];
              const isDeleteOpen = deleteReplyUi?.commentId === c.id && deleteReplyUi?.replyId === r.id;

              return (
                <div className={`replyItem ${isEditing ? "editing" : ""}`} key={r.id}>
                  <div className="replyRow">
                    <div className="replyAvatar" aria-hidden="true">
                      {r.avatar ?? "🙂"}
                    </div>

                    <div className="replyMeta">
                      <div className="replyNameLine">
                        <span className="replyName">{r.name}</span>
                        <span className="replyTime">{new Date(r.created_at).toLocaleString()}</span>
                      </div>

                      {!isEditing ? (
                        <div className="replyText">{r.content}</div>
                      ) : (
                        <>
                          <textarea
                            className="replyEditTa"
                            value={editReplyText}
                            onChange={(e) => setEditReplyText(e.target.value)}
                            placeholder="수정 내용을 입력하세요"
                          />

                          {!isAdmin ? (
                            <input
                              className="replyPwIn"
                              value={editReplyPw}
                              onChange={(e) => setEditReplyPw(e.target.value)}
                              placeholder="비밀번호(4자+) 입력 후 저장"
                              type="password"
                            />
                          ) : (
                            <div className="adminChip">관리자</div>
                          )}

                          <div className="replyActions">
                            <button className="aBtn" type="button" onClick={() => saveReply(c.id, r.id)}>
                              저장
                            </button>
                            <button className="aBtn" type="button" onClick={cancelEditReply}>
                              취소
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="replyActions">
                        {canManage ? (
                          <>
                            <button className="aBtn" type="button" onClick={() => startEditReply(r)}>
                              수정
                            </button>
                            <button className="aBtn danger" type="button" onClick={() => openDeleteReply(c.id, r.id)}>
                              삭제
                            </button>
                          </>
                        ) : (
                          <button
                            className="aBtn"
                            type="button"
                            onClick={() => {
                              setVerifyReplyId(r.id);
                              setVerifyPw("");
                            }}
                          >
                            본인확인
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {!isAdmin && verifyReplyId === r.id && !canManage && !isEditing ? (
                    <div className="replyVerify">
                      <input
                        className="replyPwIn"
                        type="password"
                        value={verifyPw}
                        onChange={(e) => setVerifyPw(e.target.value)}
                        placeholder="비밀번호(4자+)"
                      />
                      <button className="btn primary" type="button" onClick={() => verifyReply(c.id, r.id)}>
                        확인
                      </button>
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() => {
                          setVerifyReplyId(null);
                          setVerifyPw("");
                        }}
                      >
                        취소
                      </button>
                    </div>
                  ) : null}

                  {isDeleteOpen && !isAdmin ? (
                    <div className="replyVerify">
                      <input
                        className="replyPwIn"
                        type="password"
                        value={deleteReplyUi?.pw ?? ""}
                        onChange={(e) =>
                          setDeleteReplyUi((prev) => (prev ? { ...prev, pw: e.target.value } : prev))
                        }
                        placeholder="비밀번호(4자+)"
                      />
                      <button
                        className="btn primary"
                        type="button"
                        onClick={() => deleteReply(c.id, r.id, deleteReplyUi?.pw ?? "")}
                      >
                        삭제 확인
                      </button>
                      <button className="btn ghost" type="button" onClick={closeDeleteReply}>
                        취소
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {openReplyFor === c.id ? (
          <div className="replyForm">
            <div className="rTop">
              <div className="fField">
                <label>답글 닉네임</label>
                <input className="in" value={rName} onChange={(e) => setRName(e.target.value)} placeholder="예) 약속" />
              </div>

              <div className="fField">
                <label>프로필</label>
                <select className="in" value={rAvatar} onChange={(e) => setRAvatar(e.target.value)}>
                  {["🙂", "😎", "🐰", "🐻", "🦊", "🐱", "✨"].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fField">
                <label>비밀번호 (수정/삭제)</label>
                <input
                  className="in"
                  value={rPw}
                  onChange={(e) => setRPw(e.target.value)}
                  placeholder="4자 이상"
                  type="password"
                  disabled={isAdmin}
                />
              </div>

              <div className="fField">
                <label>등록</label>
                <button className="btn primary" type="button" onClick={() => submitReply(c.id)}>
                  답글 등록
                </button>
              </div>
            </div>

            <div className="fField full">
              <label>내용</label>
              <textarea className="ta" value={rContent} onChange={(e) => setRContent(e.target.value)} placeholder="답글을 남겨주세요" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

  // ✅ 추천 API 호출
async function likeComment(commentId: string) {
  if (!id) return;

  // 즉시 UI +1
  setComments((prev) =>
    prev.map((c) =>
      c.id === commentId
        ? { ...c, likes_count: (c.likes_count ?? 0) + 1 }
        : c
    )
  );

  const res = await fetch(`/api/profiles/${id}/comments/${commentId}/like`, {
    method: "POST",
  });

  const t = await res.text();
  let j: any = {};
  try {
    j = t ? JSON.parse(t) : {};
  } catch {
    j = { error: t };
  }

  if (!res.ok) {
    // 실패 롤백
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likes_count: Math.max(0, (c.likes_count ?? 1) - 1) }
          : c
      )
    );
    alert(j?.error ?? "추천 실패");
    return;
  }

  // 서버값으로 동기화
  setComments((prev) =>
    prev.map((c) =>
      c.id === commentId ? { ...c, likes_count: j.likes_count ?? 0 } : c
    )
  );
}

  function onPickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const merged = [...files, ...picked].slice(0, 6);
    setFiles(merged);
    if (fileRef.current) fileRef.current.value = "";
  }
  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  // ✅ 수정용 파일 픽
  function onPickEditFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("image/"));
    const merged = [...editFiles, ...picked].slice(0, 6);
    setEditFiles(merged);
    if (editFileRef.current) editFileRef.current.value = "";
  }
  function removeEditFile(idx: number) {
    setEditFiles((prev) => prev.filter((_, i) => i !== idx));
  }
  function removeKeepUrl(url: string) {
    setEditKeepUrls((prev) => prev.filter((u) => u !== url));
  }

  async function submitComment() {
    if (!id) return;

    const n = name.trim();
    const pw = password.trim();
    const c = content.trim();

    if (!n) return alert("닉네임을 입력해줘!");
    if (!adminOn && pw.length < 4) return alert("비밀번호는 4자 이상 입력해줘!");
    if (!c) return alert("내용을 입력해줘!");

    setSubmitting(true);
    setUploading(false);
    setStep("");
    setProgressNow(0);
    setProgressTotal(0);

    try {
      let image_urls: string[] = [];

      if (files.length) {
        setUploading(true);
        setProgressTotal(files.length);
        setProgressNow(0);

        for (let i = 0; i < files.length; i++) {
          setStep(`사진 업로드 중… (${i + 1}/${files.length})`);
          const url = await uploadOne(files[i], "profile-comments");
          image_urls.push(url);
          setProgressNow(i + 1);
        }
        setUploading(false);
      }

      setStep("댓글 등록 중…");
      const res = await fetch(`/api/profiles/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          avatar,
          password: pw,
          content: c,
          image_urls,
          adminKey: adminOn ? adminKey.trim() : "",
        }),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = { error: text };
      }
      if (!res.ok) return alert(json?.error ?? "댓글 등록 실패");

      setContent("");
      setFiles([]);
      setStep("");
      setProgressNow(0);
      setProgressTotal(0);

      await loadAll();
    } catch (e: any) {
      alert(e?.message ?? "에러가 발생했어");
    } finally {
      setUploading(false);
      setSubmitting(false);
      setStep("");
    }
  }

    // =========================
  // ✅ 답글 API
  // =========================

  async function loadReplies(commentId: string) {
    if (!id) return;

    const res = await fetch(`/api/profiles/${id}/comments/${commentId}/replies`, {
      cache: "no-store",
    });
    const t = await res.text();

    let j: any = {};
    try {
      j = t ? JSON.parse(t) : {};
    } catch {
      j = { error: t };
    }

    if (!res.ok) {
      alert(j?.error ?? "답글 로딩 실패");
      return;
    }

    const list: Reply[] = j?.replies ?? [];
    setRepliesByComment((prev) => ({ ...prev, [commentId]: list }));
  }

  async function submitReply(commentId: string) {
    if (!id) return;

    const n = rName.trim();
    const pw = rPw.trim();
    const c = rContent.trim();

    if (!n) return alert("답글 닉네임을 입력해줘!");
    if (!isAdmin && pw.length < 4) return alert("답글 비밀번호는 4자 이상 입력해줘!");
    if (!c) return alert("답글 내용을 입력해줘!");

    const res = await fetch(`/api/profiles/${id}/comments/${commentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: n,
        avatar: rAvatar,
        password: pw,
        content: c,
        adminKey: isAdmin ? adminKey.trim() : "",
      }),
    });

    const t = await res.text();
    let j: any = {};
    try {
      j = t ? JSON.parse(t) : {};
    } catch {
      j = { error: t };
    }

    if (!res.ok) return alert(j?.error ?? "답글 등록 실패");

    // 폼 초기화
    setRName("");
    setRAvatar("🙂");
    setRPw("");
    setRContent("");

    // 목록 갱신
    await loadReplies(commentId);
  }

  function startEditReply(r: Reply) {
    setEditingReplyId(r.id);
    setEditReplyText(r.content ?? "");
    setEditReplyPw("");
    setDeleteReplyUi(null);
    setVerifyReplyId(null);
    setVerifyPw("");
  }

  function cancelEditReply() {
    setEditingReplyId(null);
    setEditReplyText("");
    setEditReplyPw("");
  }

  async function saveReply(commentId: string, replyId: string) {
    if (!id) return;

    const text = editReplyText.trim();
    if (!text) return alert("수정 내용을 입력해줘!");

    const k = isAdmin ? adminKey.trim() : "";
    const pw = editReplyPw.trim();

    // 관리자가 아니면: 본인확인 됐거나 비번 필요
    const verified = !!verifiedReplyIds[replyId];
    if (!k && !verified && pw.length < 4) {
      return alert("작성자 비밀번호(4자+) 또는 본인확인이 필요해!");
    }

    const res = await fetch(`/api/profiles/${id}/comments/${commentId}/replies/${replyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminKey: k,
        password: pw,
        content: text,
      }),
    });

    const t = await res.text();
    let j: any = {};
    try {
      j = t ? JSON.parse(t) : {};
    } catch {
      j = { error: t };
    }

    if (!res.ok) return alert(j?.error ?? "답글 수정 실패");

    cancelEditReply();
    await loadReplies(commentId);
  }

  function openDeleteReply(commentId: string, replyId: string) {
    cancelEditReply();
    setVerifyReplyId(null);
    setVerifyPw("");

    if (isAdmin) {
      // 관리자는 바로 삭제
      deleteReply(commentId, replyId, "");
      return;
    }

    setDeleteReplyUi({ commentId, replyId, pw: "" });
  }

  function closeDeleteReply() {
    setDeleteReplyUi(null);
  }

  async function deleteReply(commentId: string, replyId: string, pw: string) {
    if (!id) return;

    if (!confirm("이 답글을 삭제할까?")) return;

    const k = isAdmin ? adminKey.trim() : "";
    const password = (pw ?? "").trim();

    if (!k && password.length < 4) return alert("비밀번호(4자+)가 필요해!");

    const res = await fetch(`/api/profiles/${id}/comments/${commentId}/replies/${replyId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminKey: k, password }),
    });

    const t = await res.text();
    let j: any = {};
    try {
      j = t ? JSON.parse(t) : {};
    } catch {
      j = { error: t };
    }

    if (!res.ok) return alert(j?.error ?? "답글 삭제 실패");

    setDeleteReplyUi(null);
    await loadReplies(commentId);
  }

  async function verifyReply(commentId: string, replyId: string) {
    if (!id) return;

    const pw = verifyPw.trim();
    if (pw.length < 4) return alert("비밀번호(4자+)를 입력해줘!");

    const res = await fetch(
      `/api/profiles/${id}/comments/${commentId}/replies/${replyId}/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      }
    );

    const t = await res.text();
    let j: any = {};
    try {
      j = t ? JSON.parse(t) : {};
    } catch {
      j = { error: t };
    }

    if (!res.ok) return alert(j?.error ?? "본인확인 실패");

    setVerifiedReplyIds((prev) => ({ ...prev, [replyId]: true }));
    setVerifyReplyId(null);
    setVerifyPw("");
  }

  function startEdit(c: Comment) {
    setEditingId(c.id);
    setEditText(c.content ?? "");
    setEditPw("");
    setEditFiles([]);
    setEditKeepUrls(Array.isArray(c.image_urls) ? c.image_urls : []);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
    setEditPw("");
    setEditFiles([]);
    setEditKeepUrls([]);
  }

  // ✅ 수정 저장: (1) 새 파일 업로드 → (2) keepUrls + newUrls 합쳐 PATCH(image_urls 포함)
  async function saveEdit(commentId: string) {
    if (!id) return;

    const text = editText.trim();
    if (!text) return alert("내용이 비어있어!");

    const k = adminOn ? adminKey.trim() : "";
    const pw = editPw.trim();
    if (!k && pw.length < 4) return alert("작성자 비밀번호(4자+) 또는 관리자 키가 필요해!");

    setBusyId(commentId);
    setUploading(false);
    setProgressNow(0);
    setProgressTotal(0);
    setStep("");

    try {
      let newUrls: string[] = [];
      if (editFiles.length) {
        setUploading(true);
        setProgressTotal(editFiles.length);
        for (let i = 0; i < editFiles.length; i++) {
          setStep(`(수정) 사진 업로드… (${i + 1}/${editFiles.length})`);
          const url = await uploadOne(editFiles[i], "profile-comments");
          newUrls.push(url);
          setProgressNow(i + 1);
        }
        setUploading(false);
      }

      const finalUrls = [...editKeepUrls, ...newUrls].slice(0, 12); // 필요하면 제한

      const res = await fetch(`/api/profiles/${id}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminKey: k,
          password: pw,
          content: text,
          image_urls: finalUrls, // ✅ 여기!
        }),
      });

      const t = await res.text();
      let j: any = {};
      try {
        j = t ? JSON.parse(t) : {};
      } catch {
        j = { error: t };
      }
      if (!res.ok) return alert(j?.error ?? "수정 실패");

      cancelEdit();
      await loadAll();
    } finally {
      setBusyId(null);
      setUploading(false);
      setStep("");
    }
  }

  async function deleteComment(commentId: string) {
    if (!id) return;

    const k = adminOn ? adminKey.trim() : "";
    const pw = prompt("댓글 비밀번호를 입력해줘 (관리자는 빈 칸 가능)")?.trim() ?? "";

    if (!k && pw.length < 4) return alert("작성자 비밀번호(4자+) 또는 관리자 키가 필요해!");
    if (!confirm("이 댓글을 삭제할까? (첨부 사진도 같이 삭제돼요)")) return;

    setBusyId(commentId);
    try {
      const res = await fetch(`/api/profiles/${id}/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: k, password: pw }),
      });

      const t = await res.text();
      let j: any = {};
      try {
        j = t ? JSON.parse(t) : {};
      } catch {
        j = { error: t };
      }

      if (!res.ok) return alert(j?.error ?? "삭제 실패");
      await loadAll();
    } finally {
      setBusyId(null);
    }
  }

// ✅ 원본 리스트는 '작성시간' 기준으로 고정 (좋아요로 순서 바뀌지 않게)
const orderedComments = useMemo(() => {
  return [...(comments ?? [])].sort((a, b) => {
    // ✅ 오래된 댓글이 위로 (오름차순)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}, [comments]);

const bestLikes = useMemo(() => {
  let mx = 0;
  for (const c of orderedComments) mx = Math.max(mx, c.likes_count ?? 0);
  return mx;
}, [orderedComments]);

const featuredComments = useMemo(() => {
  const mx = bestLikes;
  if (mx < 1) return [];
  return orderedComments.filter((c) => (c.likes_count ?? 0) === mx);
}, [orderedComments, bestLikes]);

  const progressRatio =
    progressTotal > 0 ? Math.min(1, Math.max(0, progressNow / progressTotal)) : 0;

  return (
    <main className="bd">
      <div className="wrap">
        <div className="top">

<a className="link" href={embed ? "/profiles?embed=1" : "/profiles"}>← 목록으로</a>

          <div className="topRight">
            <label className="switch">
              <input
                type="checkbox"
                checked={adminOn}
                onChange={(e) => setAdminOn(e.target.checked)}
              />
              <span className="slider" />
              <span className="swTxt">관리자 모드</span>
            </label>

            {adminOn ? (
              <input
                className="adminIn"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="관리자 키"
              />
            ) : null}

            <button className="btn" onClick={refresh} disabled={refreshing || submitting || uploading}>
              {refreshing ? "새로고침…" : "새로고침"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="box state">불러오는 중…</div>
        ) : loadError ? (
          <div className="box state">⚠️ {loadError}</div>
        ) : !post ? (
          <div className="box state">존재하지 않는 프로필이에요.</div>
        ) : (
          <article className="box post">
            <header className="postHead">
              <div className="kicker">PROFILE</div>
              <h1 className="title">{post.title}</h1>
              <div className="info">
                {post.role ? <span className="tag">{post.role}</span> : null}
                <span className="sep">·</span>
                <span className="date">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </header>

            <section className="postBody">
              <div className="content">
                {post.bio ? <p className="p">{post.bio}</p> : <p className="p muted">소개가 비어있어요.</p>}
              </div>

              {images.length ? (
                <div className="attach">
                  {images.map((src, idx) => (
                    <button type="button" className="imgBtn" key={`${src}-${idx}`} onClick={() => openViewer(src)}>
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="cm">
              <div className="cmHead">
                <h2 className="cmTitle">댓글</h2>
              </div>

              {comments.length === 0 ? (
  <div className="empty">아직 댓글이 없어요.</div>
) : (

<div className="list">
  {featuredComments.length ? (
    <div className="featuredBox">
      {featuredComments.map((c) => renderComment(c, "featured-"))}
    </div>
  ) : null}

  {orderedComments.map((c) => renderComment(c))}
</div>
)}
              {/* 작성폼 */}
              <div className="form">
                <div className="fTop">
                  <div className="fField">
                    <label>닉네임</label>
                    <input className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 약속" disabled={submitting || uploading} />
                  </div>

                  <div className="fField">
  <label>프로필</label>
  <select
    className="in"
    value={avatar}
    onChange={(e) => setAvatar(e.target.value)}
    disabled={submitting || uploading}
  >
    {["🙂", "😎", "🐰", "🐻", "🦊", "🐱", "✨"].map((a) => (
      <option key={a} value={a}>{a}</option>
    ))}
  </select>
</div>

                  <div className="fField">
                    <label>비밀번호 (수정/삭제)</label>
                    <input
                      className="in"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="4자 이상"
                      type="password"
                      disabled={submitting || uploading || (adminOn && adminKey.trim().length > 0)}
                    />
                  </div>

                  <div className="fField">
                    <label>사진 첨부</label>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: "none" }}
                      onChange={(e) => onPickFiles(e.target.files)}
                      disabled={submitting || uploading}
                    />
                    <button className="btn ghost" type="button" onClick={() => fileRef.current?.click()} disabled={submitting || uploading}>
                      사진첨부
                    </button>
                  </div>
                </div>

                {previews.length ? (
                  <div className="pickWrap">
                    {previews.map((src, idx) => (
                      <div className="pick" key={`${src}-${idx}`}>
                        <img src={src} alt="" />
                        <button type="button" className="x" onClick={() => removeFile(idx)} aria-label="삭제" disabled={submitting || uploading}>
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="pickHint">최대 6장</div>
                  </div>
                ) : null}

                <div className="fField full">
                  <label>내용</label>
                  <textarea className="ta" value={content} onChange={(e) => setContent(e.target.value)} placeholder="테스트" disabled={submitting || uploading} />
                </div>

                {(uploading || (progressTotal > 0 && progressNow > 0)) ? (
                  <div className="prog">
                    <div className="progTop">
                      <div className="progTxt">업로드 {progressNow}/{progressTotal}</div>
                      <div className="progTxt2">{step || "처리 중…"}</div>
                    </div>
                    <div className="bar">
                      <div className="barIn" style={{ width: `${progressRatio * 100}%` }} />
                    </div>
                  </div>
                ) : null}

                <div className="fBottom">
                  <button className="btn primary" onClick={submitComment} disabled={submitting || uploading}>
                    {uploading ? "업로드 중…" : submitting ? "등록 중…" : "등록"}
                  </button>
                </div>
              </div>
            </section>
          </article>
        )}
      </div>

      {viewerOpen ? (
        <div className="viewer" role="dialog" aria-modal="true" onClick={() => setViewerOpen(false)}>
          <div className="viewerInner" onClick={(e) => e.stopPropagation()}>
            <button ref={viewerCloseBtnRef} className="viewerClose" type="button" onClick={() => setViewerOpen(false)} aria-label="닫기">
              닫기
            </button>
            <div className="viewerImg">
              <img src={viewerSrc} alt="" />
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{css}</style>
    </main>
  );
}

const css = `

.featuredBox{ border:0; padding:0; margin:0; }
.item.featured{ margin-top:0; }

:root{
  --pt:#f59e0b;          /* 포인트 골드 */
  --pt2:#fff7ed;         /* 연한 포인트 배경 */
  --ptLine: rgba(245,158,11,.35);
}

/* ✅ 추천 버튼 */
.aBtn.like{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:0;
  color:#111827;
  font-weight:800;
}
.likeNum{
  font-weight:900;
  color: #6b7280;
}

/* ✅ 베스트 강조 */
.item.best{
  position:relative;
  padding-top:22px; /* 배지 공간 */
}

.item.best::before{
  content:"";
  position:absolute;
  left:0;
  right:0;
  top:10px;
  bottom:10px;
  border-radius:14px;
  background: linear-gradient(180deg, var(--pt2), #fff);
  border:1px solid var(--ptLine);
  pointer-events:none;
}

/* item 내부 내용이 ::before 위로 오도록 */
.item.best > *{
  position:relative;
  z-index:1;
}

/* BEST 배지 */
.bestBadge{
  margin-left:8px;
  font-size:11px;
  font-weight:900;
  padding:4px 8px;
  border-radius:999px;
  background: rgba(245,158,11,.16);
  border:1px solid rgba(245,158,11,.35);
  color:#92400e;
  letter-spacing:.02em;
}

*, *:before, *:after { box-sizing: border-box; }
.bd{ min-height:100vh; background:#fff; color:#111827; }
.wrap{ max-width:980px; margin:0 auto; padding:16px 16px 60px; }
@media (max-width:560px){ .wrap{ padding:12px 12px 54px; } }

.top{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; }
.topRight{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
.link{ color:#111827; text-decoration:none; font-weight:500; font-size:13px; }
.link:hover{ text-decoration:underline; }

.btn{
  height:34px; padding:0 12px; border-radius:12px; border:1px solid #e5e7eb;
  background:#fff; color:#111827; font-weight:700; font-size:13px; cursor:pointer; white-space:nowrap;
}
.btn:hover{ background:#f9fafb; }
.btn:disabled{ opacity:.6; cursor:default; }
.btn.ghost{ background:#fff; }
.btn.primary{ background:#111827; border-color:#111827; color:#fff; }

.switch{ display:flex; align-items:center; gap:8px; cursor:pointer; user-select:none; }
.switch input{ display:none; }
.slider{
  width:42px; height:24px; border-radius:999px; background:#e5e7eb; position:relative; flex:0 0 auto;
}
.slider:after{
  content:""; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:999px; background:#fff;
  box-shadow:0 1px 4px rgba(0,0,0,.12); transition: all .18s ease;
}
.switch input:checked + .slider{ background:#111827; }
.switch input:checked + .slider:after{ left:21px; }
.swTxt{ font-size:12px; font-weight:700; color:#6b7280; }

.adminIn{
  height:34px; width:170px; border-radius:12px; border:1px solid #e5e7eb; padding:0 10px; outline:none;
  font-size:13px; background:#fff;
}

.box{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; }
.state{ padding:16px; text-align:center; color:#6b7280; font-size:13px; }

.post{ overflow:hidden; }
.postHead{ padding:18px 18px 12px; border-bottom:1px solid #eef2f7; }
.kicker{ font-size:11px; letter-spacing:.22em; color:#9ca3af; }
.title{ margin:6px 0 0; font-size:18px; font-weight:700; letter-spacing:-.02em; }
.info{ margin-top:10px; display:flex; align-items:center; gap:8px; font-size:12px; color:#6b7280; }
.tag{ display:inline-flex; align-items:center; height:22px; padding:0 8px; border-radius:999px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:900; font-size:12px; }
.sep{ color:#cbd5e1; }

.postBody{ padding:14px 18px 100px; }

.p{ margin:0; font-size:14px; line-height:1.75; white-space:pre-wrap; word-break:break-word; }
.muted{ color:#6b7280; }
.attach{ margin-top:12px; display:grid; grid-template-columns:1fr; gap:10px; }
.imgBtn{ border:0; background:transparent; padding:0; cursor:zoom-in; }

/* ✅ 원본 크기 유지 + 화면/게시글 폭보다 크면 자동 축소 */
.imgBtn{
  border:0;
  background:transparent;
  padding:0;
  cursor:zoom-in;
  display:flex;
  justify-content:center; /* ✅ 작은 이미지는 가운데 */
}

.imgBtn img{
  width:auto;            /* ✅ 강제 확대 금지 */
  height:auto;
  max-width:100%;        /* ✅ 게시글 폭 넘으면 자동 축소 */
  max-height:720px;      /* ✅ 너무 큰 세로도 제한 */
  border-radius:12px;
  display:block;
  object-fit:contain;
}

.cm{
  border-top:1px solid #eef2f7;
  padding:24px 18px 18px;   /* ✅ 위쪽만 넉넉하게 */
}
.cmHead{ display:flex; align-items:flex-end; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:10px; }

.cmTitle{ margin:0; font-size:14px; font-weight:700; }

.cmHint{ font-size:12px; color:#6b7280; }
.empty{ border:1px dashed #d1d5db; background:#fafafa; padding:12px; border-radius:12px; color:#6b7280; font-size:13px; }

.list{
  border:0;
  border-radius:0;
  overflow:visible;
  background:transparent;
}

.item{
  padding:20px 0;
}

.item + .item{
  border-top:1px solid #eef2f7;
  margin-top:2px;   /* ✅ 댓글 사이 간격 */
}


.name{ font-weight:700; font-size:14px; }
.time{ font-size:12px; color:#9ca3af; white-space:nowrap; }

.aBtn{ border:0; background:transparent; padding:0; font-size:12px; font-weight:500; color:#6b7280; cursor:pointer; }
.aBtn:hover{ text-decoration:underline; }
.aBtn.danger{ color:#ef4444; }

/* ✅ 댓글 헤더(두번째 사진처럼) */
.headRow{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
}

.left{
  display:flex;
  align-items:flex-start;
  gap:12px;
  min-width:0;
}

.avatar{
  width:42px;
  height:42px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:16px;
  flex:0 0 auto;
}

.meta{ min-width:0; }

/* ✅ 닉네임 바로 아래 본문 */
.cBody{
  margin-top:4px;      /* 여기 숫자로 간격 조절 (2~6 추천) */
  font-size:13.5px;
  line-height:1.6;
  white-space:pre-wrap;
  word-break:break-word;
}

.nameLine{
  display:flex;
  align-items:baseline;
  gap:10px;
  min-width:0;
}

.name{
  font-weight:700;
  font-size:13px;
  white-space:nowrap;
}

.time{
  font-size:12px;
  color:#9ca3af;
  white-space:nowrap;
}

.actions{
  display:flex;
  gap:10px;
  align-items:center;
  flex:0 0 auto;
}

.text{
  margin:0;            /* ✅ 혹시 p/기본 margin 있으면 제거 */
  padding:0;
  font-size:14px;
  line-height:1.6;
  white-space:pre-wrap;
  word-break:break-word;
}

.text p{ margin:0; }

.editTa{
  width:100%; min-height:90px; border-radius:12px; border:1px solid #e5e7eb; padding:12px; outline:none;
  font-size:13px; line-height:1.6; resize:vertical;
}
.editBar{ margin-top:10px; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.pwIn{ height:34px; width:220px; border-radius:12px; border:1px solid #e5e7eb; padding:0 10px; outline:none; }
.adminChip{ height:34px; display:inline-flex; align-items:center; padding:0 10px; border-radius:999px; border:1px solid #e5e7eb; background:#f9fafb; font-size:12px; font-weight:900; }
.editBtns{ display:flex; gap:8px; }

.editImgs{ margin-top:10px; display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end; }
.keep{
  position:relative; width:74px; height:74px; border-radius:12px; overflow:hidden; border:0; padding:0; cursor:pointer;
  background:#eef2f7;
}
.keep img{ width:100%; height:100%; object-fit:cover; display:block; }
.keepX{
  position:absolute; top:6px; right:6px; width:22px; height:22px; border-radius:999px;
  background:rgba(0,0,0,.55); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;
}
.hint{ font-size:12px; color:#9ca3af; padding-bottom:2px; }

.editAdd{ margin-top:10px; }

.thumbGrid{
  margin-top:10px;
  padding-left:54px;

  display:grid;
  grid-template-columns: repeat(4, minmax(0, 86px)); /* ✅ 작게 */
  gap:8px;
}
@media (max-width:720px){
  .thumbGrid{ grid-template-columns: repeat(3, minmax(0, 86px)); }
}
@media (max-width:420px){
  .thumbGrid{ grid-template-columns: repeat(2, minmax(0, 86px)); }
}

.thumb{
  width:86px;             /* ✅ 작게 고정 */
  height:86px;
  aspect-ratio:auto;
  border:1px solid rgba(15,23,42,.06);
  padding:0;
  border-radius:12px;
  overflow:hidden;
  background:#f3f4f6;
  cursor:pointer;
}

.thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
.thumb.more{ position:relative; }
.moreBadge{
  position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px;
  color:#fff; background:rgba(17,24,39,.55);
}

.form{ margin-top:14px; border:1px solid #eef2f7; background:#fff; border-radius:14px; padding:14px; }

.fTop{
  display:grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 180px) minmax(0, 1fr) auto; /* ✅ 4칸 */
  gap:12px;
  align-items:end;
}

/* 화면 좁으면 1열로 */
@media (max-width:860px){
  .fTop{ grid-template-columns: 1fr; }
}

/* ✅ 겹침 방지 핵심: grid item은 min-width:0 이어야 안 튀어나감 */
.fField{ min-width:0; }

/* 마지막(사진첨부)은 버튼만 있으니 그대로 */
.fField:last-child{ min-width:auto; }

.in{
  width:100%;
  min-width:0;              /* ✅ 겹침 방지 */
  height:38px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:0 12px;
  outline:none;
  font-size:13px;
  box-sizing:border-box;    /* 안전 */
}

.fField label{ display:block; font-size:12px; font-weight:700; color:#6b7280; margin-bottom:6px; }
.fField.full{ margin-top:12px; }

.ta{ width:100%; min-height:120px; border-radius:12px; border:1px solid #e5e7eb; padding:12px; outline:none; font-size:13px; line-height:1.7; resize:vertical; }
.fBottom{ margin-top:12px; display:flex; justify-content:flex-end; }

.pickWrap{ margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end; }
.pick{ position:relative; width:74px; height:74px; border-radius:12px; overflow:hidden; background:#eef2f7; }
.pick img{ width:100%; height:100%; object-fit:cover; display:block; }
.x{ position:absolute; top:6px; right:6px; width:24px; height:24px; border-radius:999px; border:1px solid #e5e7eb; background:rgba(255,255,255,.95); cursor:pointer; font-weight:900; line-height:22px; }
.pickHint{ font-size:12px; color:#9ca3af; padding-bottom:2px; }

.prog{ margin-top:10px; padding:12px; border-radius:12px; background:#fafafa; border:1px solid #eef2f7; }
.progTop{ display:flex; align-items:flex-end; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
.progTxt{ font-size:12px; font-weight:900; }
.progTxt2{ font-size:12px; color:#6b7280; }
.bar{ width:100%; height:8px; border-radius:999px; background:#e5e7eb; overflow:hidden; }
.barIn{ height:100%; border-radius:999px; background:#111827; }

.viewer{ position:fixed; inset:0; background:rgba(17,24,39,.70); display:flex; align-items:center; justify-content:center; padding:16px; z-index:9999; }
.viewerInner{ width:min(980px,96vw); max-height:90vh; background:#fff; border-radius:14px; overflow:hidden; display:flex; flex-direction:column; }
.viewerClose{ height:46px; padding:0 14px; border:0; border-bottom:1px solid #eef2f7; background:#fff; cursor:pointer; font-weight:700; font-size:13px; text-align:left; }
.viewerImg{ padding:12px; overflow:auto; }

.viewerImg{ padding:12px; overflow:auto; text-align:center; }

.viewerImg img{
  width:auto;           /* ✅ 뷰어에서도 강제 확대 금지 */
  height:auto;
  max-width:100%;
  max-height:76vh;
  object-fit:contain;
  display:inline-block;
}

/* =========================
   ✅ 답글 UI
========================= */
.replies{ margin-top:12px; padding-left:44px; padding-top:0; border-top:0; }

.replyTop{
  display:flex;
  gap:8px;
  justify-content:flex-end;
  flex-wrap:wrap;
}

.replyBtn{
  height:30px;
  padding:0 10px;
  border-radius:10px;
  border:1px solid #e5e7eb;
  background:#fff;
  font-weight:300;
  font-size:12px;
  cursor:pointer;
}
.replyBtn.ghost{ background:#fff; color:#6b7280; }

.replyList{
  margin-top:10px;
  display:grid;
  gap:8px;
}

.replyItem{
  border:0;
  background:transparent;
  border-radius:0;
  padding:0;
}

.replyItem.editing{
  background:#fff;
  box-shadow:0 6px 16px rgba(17,24,39,0.08);
  border-color:#e5e7eb;
}

.replyRow{
  display:flex;          /* ✅ 추가 */
  align-items:flex-start;
  gap:10px;

  padding:10px 12px;
  border:1px solid rgba(15,23,42,.06);
  border-radius:14px;
  background:#f9fafb;
}

.replyAvatar{
  width:34px;
  height:34px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:14px;
  flex:0 0 auto;
}

.replyMeta{
  flex:1 1 auto;
  min-width:0;
}


.replyName{ font-weight:700; font-size:13px; }

.replyNameLine{
  display:flex;
  align-items:baseline;
  gap:10px;
}

.replyTime{
  font-size:12px;      /* ✅ 댓글이랑 동일 */
  color:#9ca3af;       /* ✅ 댓글이랑 동일 */
  white-space:nowrap;
  font-weight:400;     /* ✅ 커 보이는 느낌 방지 */
  margin-left:auto;
}

.replyText{
  margin-top:6px;
  font-size:13.5px;
  line-height:1.65;
  white-space:pre-wrap;
  word-break:break-word;
}

.replyActions{
  display:flex;
  gap:8px;
  align-items:center;
  flex:0 0 auto;
}

.replyEditTa{
  width:100%;
  min-height:70px;
  margin-top:8px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:10px 12px;
  outline:none;
  font-size:13px;
  line-height:1.6;
  resize:vertical;
  background:#fff;
}

.replyPwIn{
  height:34px;
  width:220px;
  max-width:100%;
  margin-top:8px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:0 10px;
  outline:none;
  background:#fff;
  font-size:13px;
}

.replyVerify{
  margin-top:10px;
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  align-items:center;
}

.replyEmpty{
  margin-top:10px;
  font-size:13px;
  color:#9ca3af;
  padding:6px 0;
}

/* 답글 작성 폼: 4칸 */
.replyForm{
  margin-top:12px;
  border:1px solid #eef2f7;
  background:#fff;
  border-radius:14px;
  padding:12px;
}
.rTop{
  display:grid;
  grid-template-columns: 1.2fr 180px 1fr 140px;
  gap:12px;
  align-items:end;
}
@media (max-width:860px){
  .rTop{ grid-template-columns: 1fr; }
}

`;
