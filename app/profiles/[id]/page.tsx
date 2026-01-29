"use client";

import { useEffect, useMemo, useRef, useState, useId } from "react";
import { useParams } from "next/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { PAGE_BG, FONT_STACK } from "@/lib/pbTheme";

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

type ProfileListItem = Post & { comment_count?: number | null };

type Reply = {
  id: string;
  comment_id: string;
  name: string;
  avatar: string | null;
  content: string;
  is_admin?: boolean;
  created_at: string;
  image_urls?: string[] | null;
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

const CONTROL_H = 40;
const CONTROL_H_M = 38;

const ACCENT_SOFT = "#fff9e8";
const ACCENT_LINE = "#ffe6ad";
const ACCENT_TEXT = "#7a5200";

const NO_TAP: React.CSSProperties = {
  WebkitTapHighlightColor: "transparent",
  WebkitTouchCallout: "none",
  outline: "none",
};

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
  height: CONTROL_H,
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

function formatKTime(iso: string) {
  const d = new Date(iso);

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});

  return `${parts.year}.${parts.month}.${parts.day} · ${parts.hour}:${parts.minute}`;
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

/** ✅ 방명록 FilePicker랑 “똑같은 스타일”인데, 멀티 선택(여러장) 버전 */
function MultiFilePicker({
  files,
  onChange,
  isMobile,
  label = "파일선택",
}: {
  files: File[];
  onChange: (files: File[]) => void;
  isMobile: boolean;
  label?: string;
}) {
  const id = useId();
  const H = isMobile ? CONTROL_H_M : CONTROL_H;

  return (
    <div
      style={{
        width: "100%",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 0,
        height: H,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#fff",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const list = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
          const merged = [...files, ...list].slice(0, 6);
          onChange(merged);
          e.currentTarget.value = "";
        }}
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
          height: H,
          padding: isMobile ? "0 10px" : "0 12px",
          borderRadius: 0,
          border: "none",
          background: ACCENT_SOFT,
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
          color: files.length ? "#374151" : "#9ca3af",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          paddingRight: 10,
        }}
        title={files.map((f) => f.name).join(", ")}
      >
        {files.length ? `${files.length}장 선택됨` : "선택된 파일 없음"}
      </div>

      {files.length ? (
        <button
          type="button"
          onClick={() => onChange([])}
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

function LazyImg({
  src,
  alt = "",
  className,
  style,
  onClick,
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 이미 브라우저가 lazy 로드했더라도, decode/paint 타이밍을 더 안정적으로 잡기 위해
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { root: null, rootMargin: "600px 0px", threshold: 0.01 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <img
      ref={ref}
      src={show ? src : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="}
      data-src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      onClick={onClick}
    />
  );
}

export default function ProfileDetailPage() {
  const params = useParams();
const id = typeof (params as any)?.id === "string" ? (params as any).id : undefined;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string>("");

    // ✅ 아래 미리보기용 멤버 목록
  const [memberPreview, setMemberPreview] = useState<ProfileListItem[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);

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

const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const apply = () => setIsMobile(window.innerWidth <= 768);
  apply();
  window.addEventListener("resize", apply);
  return () => window.removeEventListener("resize", apply);
}, []);

// ✅ (추가) 마지막으로 본 상세 id 저장 (F5 복귀용)
useEffect(() => {
  if (!id) return;

  // ✅ 1) localStorage 시도
  try {
    localStorage.setItem("profiles_last_open", id);
  } catch {}

  // ✅ 2) sessionStorage도 시도 (localStorage 막히는 케이스 대비)
  try {
    sessionStorage.setItem("profiles_last_open", id);
  } catch {}

  // ✅ 3) 최후의 보루: window.name (iframe에서도 꽤 잘 살아남음)
  try {
    window.name = `profiles_last_open:${id}`;
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

// ✅ 답글 첨부(댓글과 동일 멀티)
const [rFiles, setRFiles] = useState<File[]>([]);
const rPreviews = useMemo(() => rFiles.map((f) => URL.createObjectURL(f)), [rFiles]);

  // 답글 본인확인(verify) 상태
  const [verifiedReplyIds, setVerifiedReplyIds] = useState<Record<string, boolean>>({});
  const [verifyReplyId, setVerifyReplyId] = useState<string | null>(null);
  const [verifyPw, setVerifyPw] = useState("");

  // ✅ 댓글 본인확인(verify) 상태
const [verifiedCommentIds, setVerifiedCommentIds] = useState<Record<string, boolean>>({});
const [verifyCommentId, setVerifyCommentId] = useState<string | null>(null);
const [verifyCommentPw, setVerifyCommentPw] = useState("");

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
  return () => rPreviews.forEach((u) => URL.revokeObjectURL(u));
}, [rPreviews]);

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

// ✅ 답글 "전부 선로딩" 제거 → 3개만 먼저, 나머지는 천천히(버벅임 크게 감소)
useEffect(() => {
  if (!id) return;
  if (!comments.length) return;

  let cancelled = false;

  const todo = comments
    .map((c) => c.id)
    .filter((cid) => !repliesByComment[cid]);

  const first = todo.slice(0, 3);
  const rest = todo.slice(3);

  (async () => {
    // 1) 우선 3개만
    for (const cid of first) {
      if (cancelled) return;
      await loadReplies(cid);
    }

    // 2) 나머지는 브라우저가 한가할 때 조금씩
    const run = async () => {
      for (const cid of rest) {
        if (cancelled) return;
        await loadReplies(cid);
        await new Promise((r) => setTimeout(r, 120)); // ✅ 작은 텀 (스크롤 버벅임 완화)
      }
    };

    const ric = (window as any).requestIdleCallback as undefined | ((cb: Function) => any);
    if (ric) {
      ric(() => run());
    } else {
      setTimeout(() => run(), 400);
    }
  })();

  return () => {
    cancelled = true;
  };
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

    async function loadMemberPreview() {
    setMemberLoading(true);
    try {
      const res = await fetch("/api/profiles", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      const all: ProfileListItem[] = json?.posts ?? [];

      // ✅ 현재 보고 있는 상세(id)는 제외하고 6개만
      const list = all.filter((p) => p.id !== id).slice(0, 6);
      setMemberPreview(list);
    } finally {
      setMemberLoading(false);
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
    loadMemberPreview();
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

function renderComment(c: Comment, keyPrefix = "") {
  const likes = c.likes_count ?? 0;
  const isBest = bestLikes >= 1 && likes === bestLikes;

const isFeatured = !!keyPrefix;
const isFeaturedInstance = !!keyPrefix;
const canManageComment = isAdmin || !!verifiedCommentIds[c.id];

return (
  <div
    className={`item ${isFeatured && isBest ? "bestFeatured" : ""} ${keyPrefix ? "featured" : ""}`}
    key={`${keyPrefix}${c.id}`}
  >
      <div className="headRow">
        <div className="left">
          <div className="avatar" aria-hidden="true">
            {c.avatar ?? "🙂"}
          </div>

          <div className="meta">
            <div className="nameLine">
<span className="name">{c.name}</span>

{/* ✅ Featured(상단 고정)에서는 기존 BEST 배지 유지 */}
{isFeatured && isBest ? <span className="bestBadge">BEST</span> : null}

{/* ✅ 원본댓글(리스트)에서는 아이콘만 닉 옆에 */}
{!isFeatured && isBest ? (
  <span className="bestIcon" title="베스트 댓글" aria-label="베스트 댓글">
    🏆
  </span>
) : null}
            </div>
            <div className="timeLine">{formatKTime(c.created_at)}</div>
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
    {openReplyFor === c.id ? "닫기" : "답글"}
  </button>

  {canManageComment ? (
    <>
      <button
        className="aBtn"
        type="button"
        onClick={() => startEdit(c)}
        disabled={busyId === c.id}
      >
        수정
      </button>

      <button
        className="aBtn danger"
        type="button"
        onClick={() => deleteComment(c.id)}
        disabled={busyId === c.id}
      >
        삭제
      </button>
    </>
  ) : (
    <button
      className="aBtn"
      type="button"
      onClick={() => {
        setVerifyCommentId(c.id);
        setVerifyCommentPw("");
      }}
    >
      본인확인
    </button>
  )}
</div>
      </div>

      {!isAdmin && verifyCommentId === c.id && !canManageComment ? (
  <div className="verifyInline">
    <input
      className="verifyPw"
      type="password"
      value={verifyCommentPw}
      onChange={(e) => setVerifyCommentPw(e.target.value)}
      placeholder="비밀번호(4자+)"
    />
    <button className="verifyBtn" type="button" onClick={() => verifyComment(c.id)}>
      확인
    </button>
    <button
      className="verifyBtn ghost"
      type="button"
      onClick={() => {
        setVerifyCommentId(null);
        setVerifyCommentPw("");
      }}
    >
      취소
    </button>
  </div>
) : null}

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
                  <LazyImg src={u} alt="" />
                  {isMoreTile ? <span className="moreBadge">+{moreCount}</span> : null}
                </button>
              );
            });
          })()}
        </div>
      ) : null}

      <div className="replies">
        {(repliesByComment[c.id]?.length ?? 0) > 0 ? (
          <div className={`replyList ${isFeaturedInstance ? "bestReply" : "normalReply"}`}>
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
  </div>
  <div className="replyTimeLine">{formatKTime(r.created_at)}</div>

{!isEditing ? (
  <>
    <div className="replyText">{r.content}</div>

    {Array.isArray(r.image_urls) && r.image_urls.length ? (
      <div className="replyThumbGrid">
        {(() => {
          const urls = r.image_urls!;
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
                <LazyImg src={u} alt="" />
                {isMoreTile ? <span className="moreBadge">+{moreCount}</span> : null}
              </button>
            );
          });
        })()}
      </div>
    ) : null}
    </>
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
  <div className="verifyInline">
    <input
      className="verifyPw"
      type="password"
      value={verifyPw}
      onChange={(e) => setVerifyPw(e.target.value)}
      placeholder="비밀번호(4자+)"
    />
    <button className="verifyBtn" type="button" onClick={() => verifyReply(c.id, r.id)}>
      확인
    </button>
    <button
      className="verifyBtn ghost"
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
                    <div className="replyVerify verifyBox">
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
                        className="gbSubmit"
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
  <div
    style={{
      marginTop: 12,
      marginLeft: 0, // ✅ 왼쪽 여백 제거(요청)
      border: "1px solid rgba(245,158,11,.22)",
      background: "rgba(245,158,11,.10)",
      borderRadius: 14,
      padding: 14,
    }}
  >
    {/* ✅ 1줄: 닉 / 프로필 / 비번 / 사진첨부 / 등록 */}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
      <Field label="닉네임" isMobile={isMobile}>
        <input
          value={rName}
          onChange={(e) => setRName(e.target.value)}
          placeholder="예) 아작님은아기자기해서아작인가요?"
          style={inputStyle}
          disabled={submitting || uploading}
        />
      </Field>

      {/* ✅ 프로필 폭 조금 줄임 */}
      <Field label="프로필" narrow isMobile={isMobile}>
        <select
          value={rAvatar}
          onChange={(e) => setRAvatar(e.target.value)}
          style={selectStyle}
          disabled={submitting || uploading}
        >
          {["🙂", "😎", "🐰", "🐻", "🦊", "🐱", "✨"].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>

      {/* ✅ 비번 폭 조금 줄임 (narrow + minWidth 조정은 Field가 해줌) */}
      <Field label="비밀번호 (수정/삭제)" narrow isMobile={isMobile}>
        <input
          type="password"
          value={rPw}
          onChange={(e) => setRPw(e.target.value)}
          placeholder="4자 이상"
          style={inputStyle}
          disabled={submitting || uploading || isAdmin}
        />
      </Field>

      {/* ✅ 사진첨부 추가 */}
      <Field label="사진 첨부" narrow isMobile={isMobile}>
        <MultiFilePicker
          files={rFiles}
          onChange={(next) => setRFiles(next)}
          isMobile={isMobile}
          label="파일선택"
        />
      </Field>

      {/* ✅ 등록 버튼을 같은 줄에 */}
      <div style={{ flex: isMobile ? "1 1 100%" : "0 0 auto" }}>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>등록</div>
        <div style={{ display: "flex", gap: 8 }}>

          <button
  type="button"
  onClick={() => submitReply(c.id)}
  disabled={submitting || uploading}
  style={{
    ...NO_TAP,
    height: isMobile ? CONTROL_H_M : CONTROL_H,
    padding: isMobile ? "0 12px" : "0 14px",   /* ✅ 모바일만 살짝 */
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: ACCENT_LINE,
    background: ACCENT_SOFT,
    color: ACCENT_TEXT,
    cursor: "pointer",
    fontSize: isMobile ? 12.5 : 13,            /* ✅ 모바일만 살짝 */
    fontWeight: isMobile ? 600 : 700,          /* ✅ 모바일만 살짝 */
    whiteSpace: "nowrap",
  }}
>
  답글 등록
</button>

<button
  type="button"
  onClick={() => setOpenReplyFor(null)}
  style={{
    ...NO_TAP,
    height: isMobile ? CONTROL_H_M : CONTROL_H,
    padding: isMobile ? "0 12px" : "0 14px",   /* ✅ 모바일만 살짝 */
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontSize: isMobile ? 12.5 : 13,            /* ✅ 모바일만 살짝 */
    fontWeight: isMobile ? 600 : 700,          /* ✅ 모바일만 살짝 */
    whiteSpace: "nowrap",
  }}
>
  취소
</button>
        </div>
      </div>
    </div>

    {/* 내용 */}
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>내용</div>
      <textarea
        value={rContent}
        onChange={(e) => setRContent(e.target.value)}
        placeholder="응원 한마디 남겨주세요 !"
        style={{ ...inputStyle, minHeight: 90, resize: "vertical" as any, height: "auto" as any }}
        disabled={submitting || uploading}
      />
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

  // ✅ 답글 이미지 업로드
  let image_urls: string[] = [];
  if (rFiles.length) {
    setUploading(true);
    setProgressTotal(rFiles.length);
    setProgressNow(0);
    for (let i = 0; i < rFiles.length; i++) {
      setStep(`(답글) 사진 업로드… (${i + 1}/${rFiles.length})`);
      const url = await uploadOne(rFiles[i], "profile-comments");
      image_urls.push(url);
      setProgressNow(i + 1);
    }
    setUploading(false);
  }

  const res = await fetch(`/api/profiles/${id}/comments/${commentId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: n,
      avatar: rAvatar,
      password: pw,
      content: c,
      image_urls, // ✅ 추가
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

  setRName("");
  setRAvatar("🙂");
  setRPw("");
  setRContent("");
  setRFiles([]); // ✅ 추가

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

  async function verifyComment(commentId: string) {
  if (!id) return;

  const pw = verifyCommentPw.trim();
  if (pw.length < 4) return alert("비밀번호(4자+)를 입력해줘!");

  const res = await fetch(`/api/profiles/${id}/comments/${commentId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pw }),
  });

  const t = await res.text();
  let j: any = {};
  try { j = t ? JSON.parse(t) : {}; } catch { j = { error: t }; }

  if (!res.ok) return alert(j?.error ?? "본인확인 실패");

  setVerifiedCommentIds((prev) => ({ ...prev, [commentId]: true }));
  setVerifyCommentId(null);
  setVerifyCommentPw("");
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

  const progressRatio =
    progressTotal > 0 ? Math.min(1, Math.max(0, progressNow / progressTotal)) : 0;

  const STYLE_TEXT = css;

return (
  <main className="bd" style={{ background: PAGE_BG, fontFamily: FONT_STACK }}>
      <div className="wrap">
        <div className="top">

<a className="link" href={embed ? "/profiles?embed=1&resume=0" : "/profiles"}>← 목록으로</a>

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
          <>
            <article className="box post">
              <header className="postHead">
                <div className="kicker">PROFILE</div>
<h1 className="title">
  {post.title}
  {post.role ? <span className="tag" style={{ marginLeft: 8 }}>{post.role}</span> : null}
</h1>

<div className="info">
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
    <LazyImg src={src} alt="" />
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

                <div style={{ margin: "60px 0", borderTop: "1px dashed #e5e7eb" }} />

                {/* ✅ 작성폼: 방명록과 1:1 동일(인라인 스타일 방식) */}
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
            placeholder="예) 약속"
            style={inputStyle}
            disabled={submitting || uploading}
          />
        </Field>

        <Field label="프로필" narrow isMobile={isMobile}>
          <select
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            style={selectStyle}
            disabled={submitting || uploading}
          >
            {["🙂", "😎", "🐰", "🐻", "🦊", "🐱", "✨"].map((a) => (
              <option key={a} value={a}>{a}</option>
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
            disabled={submitting || uploading || (adminOn && adminKey.trim().length > 0)}
          />
        </Field>

        <Field label="사진 첨부" narrow isMobile={isMobile}>
          <MultiFilePicker
            files={files}
            onChange={(next) => setFiles(next)}
            isMobile={isMobile}
            label="파일선택"
          />
        </Field>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>내용</div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="프로필을 작성해 주세요 !"
          style={{ ...inputStyle, minHeight: 100, resize: "vertical" as any, height: "auto" as any }}
          disabled={submitting || uploading}
        />
      </div>

      {/* ✅ 등록 버튼도 방명록과 동일 톤 */}
<div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
  <button
    type="button"
    onClick={submitComment}
    disabled={submitting || uploading}
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
      fontSize: isMobile ? 12.5 : 13,     /* ✅ 모바일 살짝 축소 */
      fontWeight: isMobile ? 550 : 600,   /* ✅ 모바일 살짝 얇게 */
    }}
  >
    {uploading ? "업로드 중…" : submitting ? "등록 중…" : "등록"}
  </button>
</div>
    </div>

              </section>
            </article>

            {/* ✅ 멤버 프로필 미리보기 (댓글 아래, 별도 섹션) */}
            <section className="mp">
              <div className="mpHead">
                <div>
                  <div className="mpKicker">PROMISE</div>
                  <h3 className="mpTitle">멤버 프로필 더 보기</h3>
                  <p className="mpSub">다른 멤버들도 둘러보세요 🙂</p>
                </div>

                <a className="mpAll" href={embed ? "/profiles?embed=1" : "/profiles"}>
                  전체 보기 →
                </a>
              </div>

              {memberLoading ? (
                <div className="mpState">불러오는 중…</div>
              ) : memberPreview.length === 0 ? (
                <div className="mpState">표시할 멤버가 없어요.</div>
              ) : (
                <div className="mpGrid">
                  {memberPreview.map((p) => (
                    <a
                      key={p.id}
                      className="mpCard"
                      href={embed ? `/profiles/${p.id}?embed=1` : `/profiles/${p.id}`}
                    >
                      <div className="mpThumb">
                        {p.cover_url ? <img src={p.cover_url} alt="" /> : <div className="mpPh">🙂</div>}
                      </div>

                      <div className="mpBody">
                        <div className="mpTop">
                          <div className="mpName">{p.title}</div>
                          {p.role ? <span className="mpBadge">{p.role}</span> : null}
                        </div>

                        <div className="mpBio">{p.bio ?? "소개가 비어있어요."}</div>

                        <div className="mpMeta">
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                          <span className="dot">·</span>
                          <span>댓글 {p.comment_count ?? 0}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </section>
          </>
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
      <style jsx global>{STYLE_TEXT}</style>
    </main>
  );
}

const css = `
/* =========================
   THEME
========================= */
:root{
  --pt:#f59e0b;                 /* 포인트 골드 */
  --ptSoft: rgba(245,158,11,.10);
  --ptSoft2: rgba(245,158,11,.06);  /* ✅ 베댓 배경(공지톤보다 더 연하게) */
  --ptLine: rgba(245,158,11,.22);

  --line: rgba(15,23,42,.08);
  --line2:#eef2f7;

  --text: rgba(17,24,39,.92);
  --muted: rgba(17,24,39,.55);
}

*, *:before, *:after { box-sizing: border-box; }

:global(html),
:global(body){
  background:#ffffff !important;
}

.bd{
  min-height:100vh;
  background:transparent;
  color:#111827;
  scrollbar-width:none;
}
.bd::-webkit-scrollbar{ width:0; height:0; }

.bd{
  -webkit-overflow-scrolling: touch;
}

.wrap{
  max-width:980px;
  margin:0 auto;
  padding:16px 16px 60px;
}
@media (max-width:560px){
  .wrap{ padding:0 12px 54px; }
}

/* =========================
   TOP BAR
========================= */
.top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-bottom:10px;
}
.topRight{
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
  justify-content:flex-end;
}

.link{
  color:#111827;
  text-decoration:none;
  font-weight:500;
  font-size:13px;
}
.link:hover{ text-decoration:underline; }

.btn:hover{ background:#f9fafb; }
.btn:disabled{ opacity:.6; cursor:default; }
.btn.ghost{ background:#fff; }
.btn.primary{ background:#111827; border-color:#111827; color:#fff; }

.aBtn{
  border:0;
  background:transparent;
  padding:0;
  font-size:13px;
  font-weight:400;              /* ✅ 500 -> 400 */
  color:rgba(17,24,39,.55);
  cursor:pointer;
  line-height:1.2;
  text-decoration:none;
}
.aBtn:hover{
  text-decoration:none;         /* ✅ 밑줄 제거 */
  opacity:.86;
}
.aBtn.danger{ color:rgba(239,68,68,.88); }

.swTxt{ font-size:12px; font-weight:600; color:#6b7280; } /* ✅ 700 -> 600 */

.btn{
  height:34px;
  padding:0 12px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  background:#fff;
  color:#111827;
  font-weight:700;
  font-size:13px;
  cursor:pointer;
  white-space:nowrap;
}

/* ✅ 모바일에서 버튼/입력 살짝만 컴팩트 */
@media (max-width:560px){
  .btn{
    height:32px;               /* ✅ 34 -> 32 */
    padding:0 10px;            /* ✅ 12 -> 10 */
    font-size:12.5px;          /* ✅ 13 -> 12.5 */
    font-weight:650;           /* ✅ 700 -> 650 */
  }
  .adminIn{
    height:32px;               /* ✅ 34 -> 32 */
    font-size:12.5px;
  }
  .aBtn{ font-size:12.5px; }   /* ✅ 13 -> 12.5 */
}

.switch{ display:flex; align-items:center; gap:8px; cursor:pointer; user-select:none; }
.switch input{ display:none; }
.slider{
  width:42px; height:24px; border-radius:999px;
  background:#e5e7eb; position:relative; flex:0 0 auto;
}
.slider:after{
  content:""; position:absolute; top:3px; left:3px;
  width:18px; height:18px; border-radius:999px; background:#fff;
  box-shadow:0 1px 4px rgba(0,0,0,.12);
  transition:all .18s ease;
}
.switch input:checked + .slider{ background:#111827; }
.switch input:checked + .slider:after{ left:21px; }

.adminIn{
  height:34px; width:170px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:0 10px;
  outline:none;
  font-size:13px;
  background:#fff;
}

/* =========================
   ✅ 전체 큰 박스(테두리/그림자 제거)
   - 구분선만 남기기
========================= */
.box{
  background:#fff;
  border:0;
  border-radius:0;
  box-shadow:none;
}

.state{
  padding:16px;
  text-align:center;
  color:#6b7280;
  font-size:13px;
}

/* =========================
   POST
========================= */
.post{ overflow:visible; }
.postHead{
  padding:18px 18px 12px;
  border-bottom:1px solid var(--line);
}
.kicker{ font-size:11px; letter-spacing:.22em; color:#9ca3af; }
.title{ margin:6px 0 0; font-size:18px; font-weight:700; letter-spacing:-.02em; }
.info{
  margin-top:10px;
  display:flex;
  align-items:center;
  gap:8px;
  font-size:12px;
  color:#6b7280;
}
.tag{
  display:inline-flex;
  align-items:center;
  height:22px;
  padding:0 8px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  font-weight:900;
  font-size:12px;
}
.sep{ color:#cbd5e1; }

.postBody{ padding:14px 18px 22px; }

.p{
  margin:0;
  font-size:14px;
  line-height:1.75;
  white-space:pre-wrap;
  word-break:break-word;
}
.muted{ color:#6b7280; }

.attach{
  margin-top:12px;
  display:grid;
  grid-template-columns:1fr;
  gap:10px;
}
.imgBtn{
  border:0;
  background:transparent;
  padding:0;
  cursor:zoom-in;
  display:flex;
  justify-content:center;
}
.imgBtn img{
  width:auto;
  height:auto;
  max-width:100%;
  max-height:720px;
  border-radius:12px;
  display:block;
  object-fit:contain;
}

/* =========================
   COMMENTS (방명록 톤)
========================= */
.cm{
  border-top:1px solid var(--line);
  padding:22px 18px 18px;
}
.cmHead{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
  margin-bottom:10px;
}
.cmTitle{ margin:0; font-size:14px; font-weight:700; }

.empty{
  border:1px dashed #d1d5db;
  background:#fafafa;
  padding:12px;
  border-radius:12px;
  color:#6b7280;
  font-size:13px;
  margin-bottom: 16px;
}

.list{
  background:transparent;
  border:0;
  border-radius:0;
  overflow:visible;
}

.featuredBox{
  margin-bottom: 10px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}
.item.featured{ margin-top:0; }

/* ✅ 댓글 간 간격(구분선 위/아래 여백 늘리기) */
.item{ padding:26px 0; }
.item + .item{ border-top:1px solid var(--line2); }

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
  width:40px;
  height:40px;
  border-radius:999px;
  border:1px solid rgba(15,23,42,.10);
  background:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:16px;
  flex:0 0 auto;
}
.meta{ min-width:0; }

.nameLine{
  display:flex;
  align-items:baseline;
  gap:10px;
  min-width:0;
}
.name{
  font-size:13.5px;
  font-weight:800;
  color:var(--text);
  white-space:nowrap;
}
.time{
  font-size:12px;
  color:rgba(17,24,39,.45);
  white-space:nowrap;
}

.timeLine{
  margin-top: 2px;
  font-size: 12px;
  color: rgba(17,24,39,.45);
  line-height: 1.25;
}

/* ✅ 닉 아래 본문 */
.cBody{
  margin-top:6px;
  font-size:13.5px;
  line-height:1.65;
  color:var(--text);
  white-space:pre-wrap;
  word-break:break-word;
}

/* ✅ 액션 영역 기준선 고정(정렬 더 안정적) */
.actions{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:12px;
  flex:0 0 auto;
  white-space:nowrap;
}

@media (max-width:560px){
  .actions{ flex-wrap:wrap; justify-content:flex-end; }
}

/* ✅ 추천 버튼 */
.aBtn.like{
  display:inline-flex;
  align-items:center;
  gap:6px;
  font-weight:500;
  color:rgba(17,24,39,.55);
}
.likeNum{
  font-weight:600;
  color:rgba(17,24,39,.55);
}

/* ✅ BEST 배지 */
.bestBadge{
  margin-left:8px;
  display:inline-flex;
  align-items:center;
  height:20px;
  padding:0 8px;
  border-radius:999px;
  border:1px solid rgba(245,158,11,.25);
  background:rgba(245,158,11,.10);
  color:rgba(120,53,15,.92);
  font-size:12px;
  font-weight:700;
  letter-spacing:.02em;
}

/* ✅ Featured(상단 고정) 베댓만 하이라이트 유지 */
.item.bestFeatured{
  background: #fffcf1;
  border: 1px solid rgb(255, 236, 174);
  border-radius: 16px;
  padding: 14px 14px;
  margin: 10px 0;
}

/* ✅ 베댓 원본댓글(리스트)은 일반댓글과 동일하게 → 추가 배경 없음 */
.bestIcon{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size: 12px;
  line-height: 1;
  transform: translateY(-1px);
  opacity: .9;
}

/* ✅ 상단 Featured 박스와 일반 댓글 리스트 사이 구분선(있어 보이게) */
.featuredBox{
  border: 0;
  padding: 0;
  margin: 0 0 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line2);
}

/* =========================
   COMMENT IMAGES
========================= */
.thumbGrid{
  margin-top:10px;
  padding-left:52px;
  display:grid;
  grid-template-columns:repeat(4, minmax(0, 86px));
  gap:8px;
}
@media (max-width:720px){
  .thumbGrid{ grid-template-columns:repeat(3, minmax(0, 86px)); }
}
@media (max-width:420px){
  .thumbGrid{ grid-template-columns:repeat(2, minmax(0, 86px)); }
}
.thumb{
  width:86px; height:86px;
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
  position:absolute; inset:0;
  display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size:14px;
  color:#fff; background:rgba(17,24,39,.55);
}

/* =========================
   EDIT UI
========================= */
.textWrap{ margin-top:0; }

.editTa{
  width:100%;
  min-height:90px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:12px;
  outline:none;
  font-size:13px;
  line-height:1.6;
  resize:vertical;
  background:#fff;
}

.editImgs{ margin-top:10px; display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end; }
.keep{
  position:relative;
  width:74px; height:74px;
  border-radius:12px;
  overflow:hidden;
  border:0; padding:0;
  cursor:pointer;
  background:#eef2f7;
}
.keep img{ width:100%; height:100%; object-fit:cover; display:block; }
.keepX{
  position:absolute; top:6px; right:6px;
  width:22px; height:22px;
  border-radius:999px;
  background:rgba(0,0,0,.55);
  color:#fff;
  display:flex; align-items:center; justify-content:center;
  font-weight:700;
}
.hint{ font-size:12px; color:#9ca3af; padding-bottom:2px; }

.editAdd{ margin-top:10px; }
.editBar{
  margin-top:10px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
}
.pwIn{
  height:34px; width:220px;
  border-radius:12px;
  border:1px solid #e5e7eb;
  padding:0 10px;
  outline:none;
  background:#fff;
}
.adminChip{
  height:34px;
  display:inline-flex;
  align-items:center;
  padding:0 10px;
  border-radius:999px;
  border:1px solid #e5e7eb;
  background:#f9fafb;
  font-size:12px;
  font-weight:900;
}
.editBtns{ display:flex; gap:8px; }

.pick img{ width:100%; height:100%; object-fit:cover; display:block; }

/* =========================
   UPLOAD PROGRESS
========================= */
.prog{
  margin-top:10px;
  padding:12px;
  border-radius:12px;
  background:#fff;
  border:1px solid rgba(15,23,42,.08);
}
.progTop{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:10px;
  flex-wrap:wrap;
  margin-bottom:8px;
}
.progTxt{ font-size:12px; font-weight:900; }
.progTxt2{ font-size:12px; color:#6b7280; }
.bar{ width:100%; height:8px; border-radius:999px; background:#e5e7eb; overflow:hidden; }
.barIn{ height:100%; border-radius:999px; background:#111827; }

/* =========================
   VIEWER
========================= */
.viewer{
  position:fixed;
  inset:0;
  background:rgba(17,24,39,.70);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:16px;
  z-index:9999;
}
.viewerInner{
  width:min(980px,96vw);
  max-height:90vh;
  background:#fff;
  border-radius:14px;
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.viewerClose{
  height:46px;
  padding:0 14px;
  border:0;
  border-bottom:1px solid var(--line2);
  background:#fff;
  cursor:pointer;
  font-weight:700;
  font-size:13px;
  text-align:left;
}
.viewerImg{ padding:12px; overflow:auto; text-align:center; }
.viewerImg img{
  width:auto;
  height:auto;
  max-width:100%;
  max-height:76vh;
  object-fit:contain;
  display:inline-block;
}

/* =========================
   REPLIES (답글) - 더 진하게/확실히 구분
========================= */
.replies{
  margin-top:12px;
  padding-left:0;
  padding-right:0;
}

@media (max-width:560px){
  .replies{ padding-left:0; padding-right:0; }
}

.replyItem{
  border:0;
  background:transparent;
  padding:0;
}

/* ✅ 답글 영역: 연회색 톤 + 좌우 패딩 동일 + 여백 줄이기 */
.replyList{
  margin-top:10px;
  padding: 10px 12px;
  border-radius: 14px;

  /* ✅ 공통 배경 제거 */
  background: transparent;

  display:grid;
  gap:0;
}

/* ✅ 답글 줄도 박스 안에서 균등하게 */
.replyRow{
  display:flex;
  gap:10px;
  align-items:flex-start;

  padding:10px 0;
  border-top:1px solid rgba(15,23,42,.08);
}
.replyItem:first-child .replyRow{ border-top:0; }

/* 기본 답글 (일반 댓글) */
.replyList.normalReply{
  background:#f6f7f9;
  border:1px solid #f5f5f5;
}

.replyList.bestReply{
  background: rgba(255, 243, 214, 0.73);
  border: 1px solid rgba(255, 245, 219, 0.81);
}

.replyAvatar{
  width:34px;
  height:34px;
  border-radius:999px;
  border:1px solid rgba(15,23,42,.10);
  background:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:14px;
  flex:0 0 auto;
}

.replyMeta{ flex:1 1 auto; min-width:0; }

.replyNameLine{
  display:flex;
  align-items:baseline;
  gap:10px;
}
.replyName{ font-weight:700; font-size:13.5px; color:rgba(17,24,39,.92); }

.replyTime{
  font-size:12px;
  color:rgba(17,24,39,.45);
  line-height:1.25;
  font-weight:400;
}

.replyTimeLine{
  margin-top: 2px;
  font-size: 12px;
  color: rgba(17,24,39,.45);
  line-height: 1.25;
}

.replyText{
  margin-top:6px;
  font-size:13.5px;
  line-height:1.65;
  white-space:pre-wrap;
  word-break:break-word;
  color:rgba(17,24,39,.92);
}

.replyActions{
  display:flex;
  gap:8px;
  align-items:center;
  flex:0 0 auto;
  margin-left:auto;
}

.replyEditTa{
  width:100%;
  min-height:70px;
  margin-top:8px;
  border-radius:12px;
  border:1px solid rgba(15,23,42,.10);
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
  border:1px solid rgba(15,23,42,.10);
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

.replyThumbGrid{
  margin-top:10px;
  display:grid;
  grid-template-columns:repeat(4, minmax(0, 86px));
  gap:8px;
}
@media (max-width:720px){
  .replyThumbGrid{ grid-template-columns:repeat(3, minmax(0, 86px)); }
}
@media (max-width:420px){
  .replyThumbGrid{ grid-template-columns:repeat(2, minmax(0, 86px)); }
}

/* 댓글 thumb 스타일 재사용 + 답글은 살짝 더 작게 */
.replyThumbGrid .thumb{
  width:76px;
  height:76px;
}

/* =========================
   MEMBER PREVIEW (mp) - 그림자 제거/깔끔
========================= */
.mp{
  margin-top:34px;
  padding:28px 18px;
  border-top:1px solid var(--line);
  background:#fff;
  border-radius:0;
  box-shadow:none;
}

.mpHead{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  margin-bottom:16px;
  flex-wrap:wrap;
}

.mpKicker{
  font-size:11px;
  letter-spacing:.26em;
  font-weight:700;
  color:rgba(15,23,42,.45);
}
.mpTitle{
  margin:6px 0 0;
  font-size:17px;
  font-weight:850;
  letter-spacing:-0.03em;
  color:#0f172a;
}
.mpSub{
  margin:6px 0 0;
  font-size:13px;
  color:rgba(15,23,42,.60);
}

.mpAll{
  text-decoration:none;
  font-weight:700;
  font-size:12px;
  color:rgba(120,53,15,.95);
  padding:9px 14px;
  border-radius:999px;
  border:1px solid rgba(245,158,11,.22);
  background:rgba(245,158,11,.10);
  transition:transform .15s ease, background .15s ease;
}
.mpAll:hover{
  background:rgba(245,158,11,.14);
  transform:translateY(-1px);
}

.mpState{
  border:1px solid rgba(15,23,42,.10);
  border-radius:16px;
  padding:14px;
  background:#fff;
  color:rgba(15,23,42,.62);
  font-size:13px;
}

.mpGrid{
  display:grid;
  grid-template-columns:repeat(3, minmax(0, 1fr));
  gap:12px;
}
@media (max-width:860px){
  .mpGrid{ grid-template-columns:repeat(2, minmax(0, 1fr)); }
}
@media (max-width:520px){
  .mpGrid{ grid-template-columns:1fr; }
}

.mpCard{
  position:relative;
  display:flex;
  gap:12px;
  padding:12px;
  border-radius:16px;
  border:1px solid rgba(15,23,42,.10);
  background:#fff;
  box-shadow:none;                /* ✅ 그림자 제거 */
  text-decoration:none;
  color:inherit;
  overflow:hidden;
  transition:transform .16s ease, border-color .16s ease;
}
.mpCard:hover{
  transform:translateY(-1px);
  border-color:rgba(245,158,11,.22);
}

.mpThumb{
  flex:0 0 90px;
  height:74px;
  border-radius:14px;
  overflow:hidden;
  border:1px solid rgba(15,23,42,.10);
  background:rgba(15,23,42,.04);
  display:flex;
  align-items:center;
  justify-content:center;
}
.mpThumb img{ width:100%; height:100%; object-fit:cover; display:block; }
.mpPh{ font-size:22px; color:rgba(15,23,42,.55); }

.mpBody{
  min-width:0;
  flex:1;
  display:flex;
  flex-direction:column;
  gap:7px;
}
.mpTop{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  min-width:0;
}
.mpName{
  font-size:14px;
  font-weight:850;
  letter-spacing:-0.02em;
  overflow:hidden;
  white-space:nowrap;
  text-overflow:ellipsis;
  color:#0f172a;
}
.mpBadge{
  font-size:11px;
  padding:4px 10px;
  border-radius:999px;
  border:1px solid rgba(245,158,11,.22);
  background:rgba(245,158,11,.10);
  color:rgba(120,53,15,.95);
  font-weight:800;
  white-space:nowrap;
}
.mpBio{
  font-size:12.8px;
  color:rgba(15,23,42,.72);
  line-height:1.55;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}
.mpMeta{
  margin-top:2px;
  font-size:11.5px;
  color:rgba(15,23,42,.55);
  display:flex;
  align-items:center;
  gap:8px;
}
.mpMeta .dot{ color:rgba(15,23,42,.22); }

/* =========================
   MOBILE: 좌우 여백 정리
========================= */
@media (max-width:560px){
  .postHead,
  .postBody,
  .cm,
  .mp{
    padding-left:0;
    padding-right:0;
  }

  .thumbGrid,
  .replies{
    padding-left:0;
  }
}

/* ✅ 답글 폼은 방명록 폼 그대로 + 살짝만 컴팩트 */
.gbFormReply{
  margin-top:12px;
  padding-left:52px;  /* 답글 리스트랑 시작선 맞추기 */
}

.gbFormReply .gbForm{
  /* (혹시 gbFormReply를 div.gbForm로 쓰는 구조면 이 줄은 필요 없음) */
}

@media (max-width:560px){
  .gbFormReply{ padding-left:0, marginLeft: isMobile ? 0 : 52; }
}

/* =========================
   ✅ VERIFY UI - 투명 / 미니멀
========================= */

/* 전체 래퍼: 완전 투명 */
.verifyBox{
  padding: 0;
  border: 0;
  background: transparent;
}

/* 가로 정렬만 담당 */
.replyVerify{
  margin-top: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

/* 🔐 비밀번호 입력창만 살짝 강조 */
.replyVerify .replyPwIn{
  height: 34px;
  min-width: 200px;
  border-radius: 10px;
  border: 1px solid rgba(15,23,42,.12);
  background: #fff;
  padding: 0 12px;
  font-size: 13px;
  outline: none;
}

.replyVerify .replyPwIn::placeholder{
  color: rgba(15,23,42,.45);
}

.replyVerify .replyPwIn:focus{
  border-color: rgba(255,182,0,.45);
  box-shadow: 0 0 0 3px rgba(255,182,0,.14);
}

/* 확인 버튼 – 포인트 컬러만 */
.replyVerify .gbSubmit{
  height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,182,0,.35);
  background: rgba(255,182,0,.14);
  color: rgba(120,53,15,.95);
  font-size: 12.5px;
  font-weight: 650;
  cursor: pointer;
}

/* 취소 버튼 – 완전 뉴트럴 */
.replyVerify .btn.ghost{
  height: 32px;
  padding: 0 10px;
  border-radius: 10px;
  border: 0;
  background: transparent;
  color: rgba(15,23,42,.55);
  font-size: 12.5px;
  cursor: pointer;
}

.replyVerify .btn.ghost:hover{
  text-decoration: underline;
}

/* 모바일 */
@media (max-width:560px){
  .replyVerify .replyPwIn{
    width: 100%;
  }
}

.verifyPw{ margin-top:-1px; } /* 너무 과하면 -0.5px은 안돼서 0으로 */

/* ✅ 본인확인: 오른쪽 아래로 붙는 인라인 */
.verifyInline{
  margin-top: 2px;              /* ✅ 위쪽 여백 줄임 */
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;     /* ✅ 오른쪽 정렬 */
  width: 100%;                   /* ✅ full width로 오른쪽 끝까지 */
  flex-wrap: wrap;
}

/* 입력 */
.verifyPw{
  height: 34px;
  width: 220px;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(15,23,42,.12);
  background: #fff;
  padding: 0 12px;
  font-size: 13px;
  outline: none;
}
.verifyPw:focus{
  border-color: rgba(255,182,0,.45);
  box-shadow: 0 0 0 3px rgba(255,182,0,.14);
}

/* 확인/취소 버튼형 */
.verifyBtn{
  height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,182,0,.35);
  background: rgba(255,182,0,.14);
  color: rgba(120,53,15,.95);
  font-size: 12.5px;
  font-weight: 650;
  cursor: pointer;
}
.verifyBtn.ghost{
  border: 1px solid rgba(15,23,42,.12);
  background: #fff;
  color: rgba(15,23,42,.62);
}

`;
