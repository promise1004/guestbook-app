// app/profiles/[id]/admin/page.tsx
import AdminClient from "./AdminClient";
import type React from "react";

console.log("AdminClient typeof =", typeof AdminClient, AdminClient);

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminClient id={id} />;
}
