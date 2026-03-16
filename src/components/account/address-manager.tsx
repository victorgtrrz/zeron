"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Loader2, Check, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUser, updateUser } from "@/lib/firebase/firestore";
import type { Address, User } from "@/types";

const emptyAddress: Address = {
  recipientName: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: "",
  zip: "",
  isDefault: false,
};

export function AddressManager() {
  const t = useTranslations("account");
  const tCheckout = useTranslations("checkout");
  const tCommon = useTranslations("common");
  const { user, loading: authLoading } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Address>(emptyAddress);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchAddresses() {
      try {
        const data = await getUser(user!.uid);
        if (data) {
          setAddresses(data.addresses || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchAddresses();
  }, [user, authLoading]);

  async function saveAddresses(newAddresses: Address[]) {
    if (!user) return;
    setSaving(true);
    try {
      await updateUser(user.uid, { addresses: newAddresses });
      setAddresses(newAddresses);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  function startEdit(index: number) {
    setEditingIndex(index);
    setFormData({ ...addresses[index] });
    setIsAdding(false);
    setDeleteConfirmIndex(null);
  }

  function startAdd() {
    setIsAdding(true);
    setEditingIndex(null);
    setFormData({ ...emptyAddress });
    setDeleteConfirmIndex(null);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setIsAdding(false);
    setFormData(emptyAddress);
  }

  async function handleSave() {
    let newAddresses: Address[];

    if (isAdding) {
      // If this is the first address or marked default, ensure isDefault
      if (addresses.length === 0) {
        formData.isDefault = true;
      }
      if (formData.isDefault) {
        newAddresses = addresses.map((a) => ({ ...a, isDefault: false }));
        newAddresses.push({ ...formData });
      } else {
        newAddresses = [...addresses, { ...formData }];
      }
    } else if (editingIndex !== null) {
      newAddresses = [...addresses];
      if (formData.isDefault) {
        newAddresses = newAddresses.map((a) => ({ ...a, isDefault: false }));
      }
      newAddresses[editingIndex] = { ...formData };
    } else {
      return;
    }

    await saveAddresses(newAddresses);
    cancelEdit();
  }

  async function handleDelete(index: number) {
    const newAddresses = addresses.filter((_, i) => i !== index);
    // If we deleted the default and there are still addresses, make the first one default
    if (addresses[index].isDefault && newAddresses.length > 0) {
      newAddresses[0].isDefault = true;
    }
    await saveAddresses(newAddresses);
    setDeleteConfirmIndex(null);
  }

  async function handleSetDefault(index: number) {
    const newAddresses = addresses.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }));
    await saveAddresses(newAddresses);
  }

  function updateFormField(field: keyof Address, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  const isEditing = isAdding || editingIndex !== null;

  return (
    <div>
      {/* Address list */}
      {addresses.length > 0 && !isEditing && (
        <div className="mb-4 space-y-3">
          {addresses.map((address, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-accent">
                    {address.recipientName}
                    {address.isDefault && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                        <Star className="h-3 w-3" />
                        {t("defaultAddress")}
                      </span>
                    )}
                  </p>
                  <p className="text-muted">{address.street}</p>
                  <p className="text-muted">
                    {address.city}, {address.state} {address.zip}
                  </p>
                  <p className="text-muted">{address.country}</p>
                  {address.phone && (
                    <p className="text-muted">{address.phone}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(index)}
                      className="rounded-lg bg-surface border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:bg-border hover:text-accent"
                      disabled={saving}
                    >
                      {t("setDefault")}
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(index)}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-border hover:text-accent"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {deleteConfirmIndex === index ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(index)}
                        className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/20"
                        disabled={saving}
                      >
                        {tCommon("delete")}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmIndex(null)}
                        className="rounded-lg px-3 py-1.5 text-xs text-muted transition-colors hover:text-accent"
                      >
                        {tCommon("cancel")}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmIndex(index)}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address form */}
      {isEditing && (
        <div className="mb-4 rounded-xl border border-border bg-surface p-6">
          <h4 className="mb-4 font-heading text-lg font-bold">
            {isAdding ? t("addAddress") : t("editAddress")}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-muted">
                {tCheckout("recipientName")}
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => updateFormField("recipientName", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-accent outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-muted">
                {tCheckout("street")}
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => updateFormField("street", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-accent outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                {tCheckout("city")}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateFormField("city", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-accent outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                {tCheckout("state")}
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => updateFormField("state", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-accent outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                {tCheckout("zip")}
              </label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => updateFormField("zip", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-accent outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                {tCheckout("country")}
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => updateFormField("country", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-accent outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-muted">
                {tCheckout("phone")}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormField("phone", e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-accent outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={formData.isDefault || false}
                  onChange={(e) => updateFormField("isDefault", e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                {t("setDefault")}
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {tCommon("save")}
                </>
              )}
            </button>
            <button
              onClick={cancelEdit}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-accent transition-colors hover:bg-border"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Add new address button */}
      {!isEditing && (
        <button
          onClick={startAdd}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-accent transition-colors hover:bg-border"
        >
          <Plus className="h-4 w-4" />
          {t("addAddress")}
        </button>
      )}
    </div>
  );
}
