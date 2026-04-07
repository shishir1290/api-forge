"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, user } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    setIsMounting(false);
  }, []);

  useEffect(() => {
    if (isMounting) return;

    const isAuthPage = pathname === "/login" || pathname === "/signup";

    if (!token || !user) {
      if (!isAuthPage) {
        router.push("/login");
      }
    } else if (pathname === "/login") {
      // If already logged in, don't show login page
      router.push("/");
    }
    // Note: We allow /signup even if token exists to allow creating new accounts
    // without forcing a logout first if they navigated there explicitly.
  }, [token, user, pathname, router, isMounting]);

  // Prevent flash of content or loading state during hydrate
  if (isMounting) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0d1117]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (!token && !isAuthPage) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
