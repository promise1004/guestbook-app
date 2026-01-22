// app/api/profiles/[id]/comments/[commentId]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPw } from "@/lib/pw";
import { isAdminKey } from "@/lib/admin";

export const runtime = "nodejs";

/** public URL -> bucket/path */
function parseSupabasePublicUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "public");
    if (idx < 0) return null;

    const bucket = parts[idx + 1];
    const path = parts.slice(idx + 2).join("/");
    if (!bucket || !path) return null;

    return { bucket, path };
  } catch {
    return null;
  }
}

async function removeImagesFromStorage(urls: string[]) {
  const items = urls
    .map(parseSupabasePublicUrl)
    .filter(Boolean) as { bucket: string; path: string }[];

  if (!items.length) return;

  const byBucket = new Map<string, string[]>();
  for (const it of items) {
    if (!byBucket.has(it.bucket)) byBucket.set(it.bucket, []);
    byBucket.get(it.bucket)!.push(it.path);
  }

  for (const [bucket, paths] of byBucket.entries()) {
    await supabaseAdmin.storage.from(bucket).remove(paths);
  }
}

async function getComment(commentId: string) {
  const { data, error } = await supabaseAdmin
    .from("profile_comments")
    .select("id, post_id, pw_hash, image_urls")
    .eq("id", commentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as
    | { id: string; post_id: string; pw_hash: string | null; image_urls: string[] | null }
    | null;
}

function canEditOrDelete(opts: { adminKey: string; password: string; pw_hash: string | null }) {
  if (isAdminKey(opts.adminKey)) return true;
  if (!opts.pw_hash) return false;
  if (!opts.password) return false;
  return hashPw(opts.password) === opts.pw_hash;
}

// PATCH /api/profiles/[id]/comments/[commentId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;

    const body = await req.json().catch(() => ({} as any));
    const content = String(body?.content ?? "").trim();
    const adminKey = String(body?.adminKey ?? "").trim();
    const password = String(body?.password ?? "").trim();
    const image_urls = Array.isArray(body?.image_urls) ? body.image_urls : undefined;

    if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

    const c = await getComment(commentId);
    if (!c) return NextResponse.json({ error: "comment not found" }, { status: 404 });
    if (c.post_id !== id) return NextResponse.json({ error: "bad request" }, { status: 400 });

    const ok = canEditOrDelete({ adminKey, password, pw_hash: c.pw_hash });
    if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const payload: any = { content };
    if (image_urls !== undefined) payload.image_urls = image_urls;

    const { data, error } = await supabaseAdmin
      .from("profile_comments")
      .update(payload)
      .eq("id", commentId)
      .select("id,post_id,name,content,image_urls,created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comment: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}

// DELETE /api/profiles/[id]/comments/[commentId]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;

    const body = await req.json().catch(() => ({} as any));
    const adminKey = String(body?.adminKey ?? "").trim();
    const password = String(body?.password ?? "").trim();

    const c = await getComment(commentId);
    if (!c) return NextResponse.json({ error: "comment not found" }, { status: 404 });
    if (c.post_id !== id) return NextResponse.json({ error: "bad request" }, { status: 400 });

    const ok = canEditOrDelete({ adminKey, password, pw_hash: c.pw_hash });
    if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // 스토리지 이미지 삭제 (실패해도 진행)
    const urls = Array.isArray(c.image_urls) ? c.image_urls : [];
    if (urls.length) {
      try {
        await removeImagesFromStorage(urls);
      } catch {}
    }

    const { error } = await supabaseAdmin.from("profile_comments").delete().eq("id", commentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}
