"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Check } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Address } from "@/types";

interface SavedAddressesProps {
  onSelect: (address: Address | null) => void;
  refreshKey?: number;
}

export function SavedAddresses({ onSelect, refreshKey = 0 }: SavedAddressesProps) {
  const t = useTranslations("checkout");
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [useNew, setUseNew] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAddresses() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const db = getClientDb();
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const addrs: Address[] = userData?.addresses ?? [];
        setAddresses(addrs);

        // Pre-select default address
        const defaultIdx = addrs.findIndex((a) => a.isDefault);
        if (defaultIdx >= 0) {
          setSelectedIndex(defaultIdx);
          onSelect(addrs[defaultIdx]);
        } else if (addrs.length > 0) {
          setSelectedIndex(0);
          onSelect(addrs[0]);
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
      }
      setLoading(false);
    }

    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, refreshKey]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    setUseNew(false);
    onSelect(addresses[index]);
  };

  const handleUseNew = () => {
    setSelectedIndex(null);
    setUseNew(true);
    onSelect(null);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-surface rounded-lg" />
        <div className="h-20 bg-surface rounded-lg" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-accent">
        {t("savedAddresses")}
      </h3>

      <div className="space-y-3">
        {addresses.map((addr, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className={`w-full text-left rounded-xl border p-4 transition-colors ${
              selectedIndex === idx && !useNew
                ? "border-brand bg-brand/5"
                : "border-border bg-surface hover:border-muted"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${
                  selectedIndex === idx && !useNew
                    ? "border-brand bg-brand"
                    : "border-muted"
                }`}
              >
                {selectedIndex === idx && !useNew && (
                  <Check className="h-3 w-3 text-background" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted" />
                  <span className="text-sm font-medium text-accent">
                    {addr.recipientName}
                  </span>
                  {addr.isDefault && (
                    <span className="text-xs text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {addr.street}, {addr.city}, {addr.state} {addr.zip}
                </p>
                <p className="text-sm text-muted">
                  {addr.country} &middot; {addr.phone}
                </p>
              </div>
            </div>
          </button>
        ))}

        {/* Use new address option */}
        <button
          onClick={handleUseNew}
          className={`w-full text-left rounded-xl border p-4 transition-colors ${
            useNew
              ? "border-brand bg-brand/5"
              : "border-border bg-surface hover:border-muted"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                useNew ? "border-brand bg-brand" : "border-muted"
              }`}
            >
              {useNew && <Check className="h-3 w-3 text-background" />}
            </div>
            <span className="text-sm font-medium text-accent">
              {t("newAddress")}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
