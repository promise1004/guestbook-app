// app/profiles/page.tsx
import { Suspense } from "react";
import ProfilesClient from "./ProfilesClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProfilesClient />
    </Suspense>
  );
}
