"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-api";

export default function ProfileIndexPage() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? `/profile/${user.id}` : "/auth?mode=login");
  }, [isLoading, router, user]);

  return (
    <main className="min-h-screen bg-[var(--db-bg)] px-8 py-8">
      <p className="text-[18px] text-[var(--db-muted)]">Loading profile...</p>
    </main>
  );
}
