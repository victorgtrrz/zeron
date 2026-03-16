"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CreditCard, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { SavedAddresses } from "@/components/checkout/saved-addresses";
import { AddressForm } from "@/components/checkout/address-form";
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { Address } from "@/types";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal } = useCart();
  const router = useRouter();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  // Redirect to login if not authed
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login" as never);
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-20 w-20 text-muted mb-6" />
        <h1 className="text-2xl font-bold text-accent mb-4">
          {tCart("empty")}
        </h1>
      </div>
    );
  }

  const handleAddressSelect = (address: Address | null) => {
    if (address) {
      setSelectedAddress(address);
      setUseNewAddress(false);
    } else {
      setSelectedAddress(null);
      setUseNewAddress(true);
    }
  };

  const handleNewAddress = async (
    address: Address,
    saveToProfile: boolean
  ) => {
    setSelectedAddress(address);
    setUseNewAddress(false);

    if (saveToProfile && user?.uid) {
      try {
        const db = getClientDb();
        await updateDoc(doc(db, "users", user.uid), {
          addresses: arrayUnion({
            ...address,
            isDefault: false,
          }),
          updatedAt: Timestamp.now(),
        });
      } catch (err) {
        console.error("Failed to save address:", err);
      }
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Please select or enter a shipping address");
      return;
    }

    setPlacing(true);
    setError("");

    try {
      // Get visitor ID from cookie
      const visitorId =
        document.cookie
          .split("; ")
          .find((c) => c.startsWith("visitorId="))
          ?.split("=")[1] ?? "";

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
          shippingAddress: {
            recipientName: selectedAddress.recipientName,
            phone: selectedAddress.phone,
            street: selectedAddress.street,
            city: selectedAddress.city,
            state: selectedAddress.state,
            country: selectedAddress.country,
            zip: selectedAddress.zip,
          },
          promotionCodes: [],
          visitorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create checkout session");
        setPlacing(false);
        return;
      }

      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        setError("No checkout URL returned");
        setPlacing(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-accent mb-8">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Address section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <SavedAddresses onSelect={handleAddressSelect} />

            {(useNewAddress || !selectedAddress) && (
              <div className="mt-6">
                <AddressForm onSubmit={handleNewAddress} />
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-xl p-6 sticky top-24 space-y-4">
            <h2 className="text-base font-semibold text-accent">
              {t("orderSummary")}
            </h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-accent truncate">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.size} &times; {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-accent whitespace-nowrap">
                    ${((item.unitPrice * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">{tCart("subtotal")}</span>
                <span className="text-accent">
                  ${(subtotal / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddress}
              className="w-full flex items-center justify-center gap-2 bg-accent text-background font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              {placing ? "Processing..." : t("placeOrder")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
