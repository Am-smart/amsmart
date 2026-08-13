import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AppContext";
import { useRouter, useSearchParams } from "@/lib/next-compat";
import { Hero } from "@/components/layout/Hero";
import { LandingSections } from "@/components/layout/LandingSections";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { InviteErrorNotice } from "@/components/auth/InviteErrorNotice";
import { INVITE_ERROR_PARAM, toInviteErrorCode, type InviteErrorCode } from "@/lib/auth/invite-errors";

export const Route = createFileRoute("/")({
  // Landing uses AppContext which reads from IndexedDB / localStorage on mount.
  ssr: false,
  head: () => ({
    meta: [
      { title: "SmartLMS - Modern Learning Platform" },
      { name: "description", content: "Empower your education with our all-in-one learning management system." },
      { property: "og:title", content: "SmartLMS - Modern Learning Platform" },
      { property: "og:description", content: "Empower your education with our all-in-one learning management system." },
    ],
  }),
  component: HomePage,
});

type AuthView = "login" | "signup" | "reset";
type AuthRole = "student" | "teacher" | "admin";

function HomePage() {
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [selectedRole, setSelectedRole] = useState<AuthRole>("student");
  const [inviteError, setInviteError] = useState<InviteErrorCode | null>(null);
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("signup") === "true") {
      setAuthView("signup");
      setShowAuth(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      return;
    }
    const code = toInviteErrorCode(searchParams.get(INVITE_ERROR_PARAM));
    if (code) {
      setInviteError(code);
      setShowAuth(false);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && user && role) {
      if (window.location.search.includes("signup=true")) return;
      if (inviteError || window.location.search.includes(INVITE_ERROR_PARAM)) return;
      router.push(`/${role}`);
    }
  }, [user, role, isLoading, router, inviteError]);

  const toggleAuth = useCallback((view: AuthView = "login", initialRole?: AuthRole) => {
    setAuthView(view);
    if (initialRole) setSelectedRole(initialRole);
    setShowAuth(true);
  }, []);

  return (
    <div className="landing-page">
      <LandingHeader
        onSignIn={() => toggleAuth("login")}
        onGetStarted={() => toggleAuth("signup")}
      />
      <main>
        <Hero onRoleSelect={(r) => toggleAuth("signup", r)} />
        <LandingSections />
      </main>
      <LandingFooter onRoleSelect={(r) => toggleAuth("signup", r)} />

      {showAuth && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full py-4 sm:py-8">
            {authView === "login" && (
              <LoginForm
                onClose={() => setShowAuth(false)}
                onShowSignup={() => setAuthView("signup")}
                onShowReset={() => setAuthView("reset")}
              />
            )}
            {authView === "signup" && (
              <SignupForm
                key={selectedRole}
                initialRole={selectedRole}
                onClose={() => setShowAuth(false)}
                onShowLogin={() => setAuthView("login")}
              />
            )}
            {authView === "reset" && (
              <ResetPasswordForm
                onClose={() => setShowAuth(false)}
                onShowLogin={() => setAuthView("login")}
              />
            )}
          </div>
        </div>
      )}

      {inviteError && (
        <InviteErrorNotice
          code={inviteError}
          onClose={() => setInviteError(null)}
          onSignIn={() => {
            setInviteError(null);
            toggleAuth("login");
          }}
        />
      )}
    </div>
  );
}
