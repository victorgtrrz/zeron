"use client";

import { useEffect, useRef, Suspense } from "react";
import { X } from "lucide-react";
import { useAuthModal } from "@/lib/auth-modal-context";
import LoginForm from "./login-form";
import SignupForm from "./signup-form";
import ForgotPasswordForm from "./forgot-password-form";

export function AuthModal() {
  const { isOpen, view, closeAuthModal, switchView } = useAuthModal();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll & ESC to close
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAuthModal();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeAuthModal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 backdrop-overlay animate-fade-in"
        onClick={closeAuthModal}
      />

      {/* Modal panel */}
      <div
        ref={panelRef}
        className="relative z-10 flex w-full flex-col overflow-hidden border-border bg-surface shadow-2xl
          max-h-[90dvh] rounded-t-2xl border-t border-x sm:max-w-md sm:rounded-2xl sm:border"
      >
        {/* Decorative top line */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border sm:hidden" />

        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-3 top-3 z-10 rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-accent"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain p-6 pt-8 sm:p-8">
          <div className="animate-fade-in" key={view}>
            {view === "login" && (
              <Suspense fallback={<ModalSpinner />}>
                <LoginForm
                  onSwitchToSignup={() => switchView("signup")}
                  onSwitchToForgot={() => switchView("forgot-password")}
                  onSuccess={closeAuthModal}
                />
              </Suspense>
            )}
            {view === "signup" && (
              <SignupForm
                onSwitchToLogin={() => switchView("login")}
                onSuccess={closeAuthModal}
              />
            )}
            {view === "forgot-password" && (
              <ForgotPasswordForm
                onSwitchToLogin={() => switchView("login")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}
