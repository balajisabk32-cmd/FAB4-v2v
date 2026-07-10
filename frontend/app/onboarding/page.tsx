"use client";

import React, { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import UnifiedOnboardingChat from "@/components/UnifiedOnboardingChat";
import { Heartbeat, ArrowLeft } from "@phosphor-icons/react";
import { Card } from "@/components/kokonut";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const [profileLoading, setProfileLoading] = useState(true);

  // Check if they already have a profile cookie
  useEffect(() => {
    if (status === "authenticated") {
      const checkProfile = () => {
        try {
          const email = session?.user?.email ? session.user.email.replace(/[^a-zA-Z0-9]/g, '_') : '';
          const cookies = document.cookie.split(";");
          const hasHerProfile = cookies.some(c => c.trim().startsWith(`sakhi_her_profile_${email}=`));
          const hasMomProfile = cookies.some(c => c.trim().startsWith(`sakhi_preg_profile_${email}=`));

          if (hasMomProfile) {
            window.location.href = "/pregnancy-mode";
          } else if (hasHerProfile) {
            window.location.href = "/her-mode";
          } else {
            setProfileLoading(false);
          }
        } catch (e) {
          setProfileLoading(false);
        }
      };
      
      // Small timeout to allow auth cookies to settle
      setTimeout(checkProfile, 500);
    } else if (status === "unauthenticated") {
      signIn("google");
    }
  }, [status]);

  if (status === "loading" || profileLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-lavender-500 border-t-transparent" />
          <p className="text-sm font-medium text-plum-800">Checking profile...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12 bg-cream">
      {/* Breathing Orbs for depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="breathe absolute -top-20 left-[10%] h-80 w-80 rounded-full bg-lavender-200/40 blur-3xl" />
        <div className="breathe absolute bottom-10 right-[10%] h-80 w-80 rounded-full bg-blush-200/40 blur-3xl" style={{ animationDelay: "3s" }} />
      </div>

      <button 
        onClick={() => signOut({ callbackUrl: '/' })}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-ink-soft hover:text-plum-900 transition-colors"
      >
        <ArrowLeft size={16} weight="bold" /> Back
      </button>

      <div className="w-full max-w-2xl text-center mb-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white ring-1 ring-lavender-200/50 shadow-sm">
          <Heartbeat size={36} weight="fill" className="text-lavender-500" />
        </div>
        <h2 className="text-[2rem] font-semibold leading-tight tracking-tight text-plum-950">
          Welcome to <span className="display-serif text-plum-800 italic">Sakhi</span>
        </h2>
        <p className="mt-3 text-sm text-ink-soft">Let's set up your personalized health companion.</p>
      </div>

      <div className="w-full max-w-2xl px-2">
        <UnifiedOnboardingChat />
      </div>
    </section>
  );
}
