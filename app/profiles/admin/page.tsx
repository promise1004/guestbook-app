"use client";

import { useMemo, useState } from "react";

type UploadResult = { url?: string; error?: string };

export default function ProfilesAdmin() {
  const [adminKey, setAdminKey] = useState("");

  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("");

  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : ""), [coverFile]);
  const extraPreviews = useMemo(() => extraFiles.map((f) => URL.createObjectURL(f)), [extraFiles]);

  function onPickCover(list: FileList | null) {
    if (!list?.[0]) return;
    setCoverFile(list[0]);
  }

  function onPickExtras(list: FileList | null) {
    if (!list) return;
    setExtraFiles((prev) => [...prev, ...Array.from(list)]);
  }

  function removeExtra(idx: number) {
    setExtraFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadOne(file: File, folder: string): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);

    const res = await fetch("/api/uploads", { method: "POST", body: fd });

    // 응답이 비었을 때 대비
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

  async function createPost() {
    const k = adminKey.trim();
    const t = title.trim();

    if (!k) return alert("관리자 키(ADMIN_KEY)를 입력해줘!");
    if (!t) return alert("이름(제목)을 입력해줘!");
    if (!coverFile) return alert("대표 사진(필수)을 먼저 선택해줘!");

    setUploading(true);
    setSaving(true);
    setStep("이미지 업로드 준비…");

    try {
      // 1) 업로드 (대표 먼저)
      setStep("대표 사진 업로드 중…");
      const coverUrl = await uploadOne(coverFile, "profiles");

      const imageUrls: string[] = [coverUrl];

      if (extraFiles.length) {
        for (let i = 0; i < extraFiles.length; i++) {
          setStep(`추가 사진 업로드 중… (${i + 1}/${extraFiles.length})`);
          const u = await uploadOne(extraFiles[i], "profiles");
          imageUrls.push(u);
        }
      }

      // 2) 글 등록
      setStep("프로필 등록 중…");
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminKey: k,
          title: t,
          role: role.trim() || null,
          bio: bio.trim() || null,
          cover_url: coverUrl,
          image_urls: imageUrls,
        }),
      });

      const rText = await res.text();
      let rJson: any = {};
      try {
        rJson = rText ? JSON.parse(rText) : {};
      } catch {
        rJson = { error: rText };
      }

      if (!res.ok) return alert(rJson?.error ?? "등록 실패");

      alert("등록 완료!");
      location.href = "/profiles";
    } catch (e: any) {
      alert(e?.message ?? "에러가 발생했어");
    } finally {
      setStep("");
      setUploading(false);
      setSaving(false);
    }
  }

  return (
    <main className="ad">
      <div className="ad-wrap">
        <header className="ad-head">
          <div>
            <div className="ad-brand">PROMISE</div>
            <h1 className="ad-title">프로필 등록 (공사중)</h1>
            <p className="ad-sub">관리자만 등록 / 누구나 열람+댓글</p>
          </div>
          <a className="ad-back" href="/profiles">← 목록으로</a>
        </header>

        <section className="ad-card">
          <div className="ad-grid">
            <div className="ad-field">
              <label>관리자 키 (ADMIN_KEY)</label>
              <input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="비밀번호" />
            </div>

            <div className="ad-field">
              <label>이름(제목)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />
            </div>

            <div className="ad-field">
              <label>역할</label>
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="공사중입니다" />
            </div>

            <div className="ad-field ad-full">
              <label>소개</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="짧은 소개를 적어줘 🙂" />
            </div>
          </div>

          <div className="ad-split">
            <div className="ad-u">
              <div className="ad-u-title">대표 사진 (필수)</div>

              <label className="ad-pick">
                {coverFile ? "대표 사진 변경" : "대표 사진 선택"}
                <input type="file" accept="image/*" onChange={(e) => onPickCover(e.target.files)} />
              </label>

              {coverPreview ? (
                <div className="ad-cover">
                  <img src={coverPreview} alt="대표 미리보기" />
                </div>
              ) : (
                <div className="ad-cover ad-cover-empty">대표 사진이 아직 없어요.</div>
              )}
            </div>

            <div className="ad-u">
              <div className="ad-u-title">추가 사진 (선택)</div>

              <label className="ad-pick ad-pick-ghost">
                추가 사진 여러 장 선택
                <input type="file" accept="image/*" multiple onChange={(e) => onPickExtras(e.target.files)} />
              </label>

              {extraPreviews.length ? (
                <div className="ad-thumbs">
                  {extraPreviews.map((src, idx) => (
                    <div className="ad-thumb" key={`${src}-${idx}`}>
                      <img src={src} alt="추가 미리보기" />
                      <button type="button" onClick={() => removeExtra(idx)} aria-label="삭제">×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ad-hint">추가 사진이 있으면 앨범이 더 예뻐져 🙂</div>
              )}
            </div>
          </div>

          <div className="ad-foot">
            <button className="ad-btn" onClick={createPost} disabled={uploading || saving}>
              {uploading || saving ? "처리 중…" : "프로필 등록"}
            </button>
            {step ? <div className="ad-step">{step}</div> : null}
          </div>
        </section>
      </div>

      <style jsx>{css}</style>
    </main>
  );
}

const css = `
.ad{
  min-height:100vh;
  background:
    radial-gradient(1100px 520px at 50% 0%, rgba(245,158,11,.10), transparent 60%),
    radial-gradient(900px 460px at 90% 10%, rgba(59,130,246,.06), transparent 60%),
    linear-gradient(180deg, rgba(255,250,242,.92), rgba(255,255,255,.98));
}
.ad-wrap{
  max-width: 980px;
  margin: 0 auto;
  padding: 34px 18px 86px;
}
@media (max-width: 560px){
  .ad-wrap{ padding: 26px 12px 70px; }
}
.ad-head{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.ad-brand{
  font-size:11px;
  letter-spacing:.22em;
  color: rgba(15,23,42,.55);
}
.ad-title{
  margin: 6px 0 0;
  font-size: 22px;
  letter-spacing: -0.02em;
  color: rgba(15,23,42,.92);
}
.ad-sub{
  margin: 8px 0 0;
  font-size: 13px;
  color: rgba(15,23,42,.62);
}
.ad-back{
  text-decoration:none;
  color: rgba(15,23,42,.72);
  font-weight: 800;
  font-size: 13px;
}
.ad-card{
  border-radius: 20px;
  border: 1px solid rgba(15,23,42,.10);
  background: rgba(255,255,255,.72);
  box-shadow: 0 18px 70px rgba(15,23,42,.08);
  padding: 14px;
}
.ad-grid{
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
@media (max-width: 860px){
  .ad-grid{ grid-template-columns: 1fr; }
}
.ad-full{ grid-column: 1 / -1; }

.ad-field label{
  display:block;
  font-size: 11px;
  font-weight: 900;
  color: rgba(15,23,42,.56);
  margin: 0 0 6px;
}
.ad-field input, .ad-field textarea{
  width:100%;
  border-radius: 14px;
  border: 1px solid rgba(15,23,42,.10);
  background: rgba(255,255,255,.86);
  padding: 10px 12px;
  outline:none;
  font-size: 13px;
  color: rgba(15,23,42,.86);
}
.ad-field textarea{
  min-height: 110px;
  resize: vertical;
  line-height: 1.55;
}
.ad-field input:focus, .ad-field textarea:focus{
  border-color: rgba(245,158,11,.40);
  box-shadow: 0 10px 30px rgba(245,158,11,.10);
}
.ad-split{
  margin-top: 12px;
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 860px){
  .ad-split{ grid-template-columns: 1fr; }
}
.ad-u{
  border-radius: 18px;
  border: 1px solid rgba(15,23,42,.08);
  background: rgba(255,255,255,.66);
  padding: 12px;
}
.ad-u-title{
  font-size: 12px;
  font-weight: 900;
  color: rgba(15,23,42,.78);
  margin-bottom: 10px;
}
.ad-pick{
  position: relative;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(245,158,11,.26);
  background: rgba(245,158,11,.12);
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: 900;
  font-size: 13px;
  color: rgba(120,53,15,.95);
  cursor:pointer;
  user-select:none;
}
.ad-pick-ghost{
  border-color: rgba(15,23,42,.12);
  background: rgba(255,255,255,.72);
  color: rgba(15,23,42,.78);
}
.ad-pick input{
  position:absolute;
  inset:0;
  opacity:0;
  cursor:pointer;
}
.ad-cover{
  margin-top: 10px;
  border-radius: 16px;
  overflow:hidden;
  border: 1px solid rgba(15,23,42,.08);
  background: rgba(15,23,42,.03);
  aspect-ratio: 4/3;
  display:flex;
  align-items:center;
  justify-content:center;
}
.ad-cover img{
  width:100%;
  height:100%;
  object-fit: cover;
  display:block;
}
.ad-cover-empty{
  color: rgba(15,23,42,.55);
  font-size: 12px;
}
.ad-thumbs{
  margin-top: 10px;
  display:flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ad-thumb{
  position: relative;
  width: 74px;
  height: 74px;
  border-radius: 14px;
  overflow:hidden;
  border: 1px solid rgba(15,23,42,.10);
  background: rgba(15,23,42,.03);
}
.ad-thumb img{
  width:100%;
  height:100%;
  object-fit: cover;
  display:block;
}
.ad-thumb button{
  position:absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(15,23,42,.12);
  background: rgba(255,255,255,.80);
  cursor:pointer;
  font-weight: 900;
  line-height: 20px;
}
.ad-hint{
  margin-top: 10px;
  font-size: 12px;
  color: rgba(15,23,42,.56);
}
.ad-foot{
  margin-top: 12px;
  display:flex;
  align-items:center;
  gap: 10px;
  flex-wrap: wrap;
}
.ad-btn{
  height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(245,158,11,.28);
  background: rgba(245,158,11,.14);
  color: rgba(120,53,15,.95);
  font-weight: 900;
  font-size: 13px;
  cursor:pointer;
  box-shadow: 0 12px 30px rgba(245,158,11,.10);
}
.ad-btn:disabled{ opacity:.6; cursor:default; }
.ad-step{
  font-size: 12px;
  color: rgba(15,23,42,.60);
}
`;
