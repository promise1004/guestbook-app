import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// POST /api/profiles/[id]/comments/[commentId]/like
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
    }
    if (!commentId || commentId === "undefined") {
      return NextResponse.json({ error: "Missing comment id" }, { status: 400 });
    }

    // (선택) 안전: 해당 댓글이 이 프로필(post_id)에 속하는지 확인
    const { data: exists, error: e0 } = await supabaseAdmin
      .from("profile_comments")
      .select("id")
      .eq("id", commentId)
      .eq("post_id", id)
      .maybeSingle();

    if (e0) return NextResponse.json({ error: e0.message }, { status: 500 });
    if (!exists) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    // ✅ likes_count +1 (RPC)
    const { data, error } = await supabaseAdmin.rpc("increment_profile_comment_like", {
      p_comment_id: commentId,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // data = 새 likes_count
    return NextResponse.json({ ok: true, likes_count: data ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "server error" }, { status: 500 });
  }
}
