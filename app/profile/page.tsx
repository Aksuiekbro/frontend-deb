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
    <main className="min-h-screen bg-[#F1F1F1] px-8 py-8 font-hikasami">
      <p className="text-[18px] text-[#0D1321]/70">Loading profile...</p>
    </main>
  );
}
