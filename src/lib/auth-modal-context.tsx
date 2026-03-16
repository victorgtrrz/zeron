"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type AuthModalView = "login" | "signup" | "forgot-password";

interface AuthModalState {
  isOpen: boolean;
  view: AuthModalView;
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  switchView: (view: AuthModalView) => void;
}

const AuthModalContext = createContext<AuthModalState>({
  isOpen: false,
  view: "login",
  openAuthModal: () => {},
  closeAuthModal: () => {},
  switchView: () => {},
});

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AuthModalView>("login");

  const openAuthModal = useCallback((v: AuthModalView = "login") => {
    setView(v);
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const switchView = useCallback((v: AuthModalView) => {
    setView(v);
  }, []);

  return (
    <AuthModalContext.Provider value={{ isOpen, view, openAuthModal, closeAuthModal, switchView }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
