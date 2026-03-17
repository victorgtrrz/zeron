"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Address } from "@/types";

const COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Belgium",
  "Australia",
  "Japan",
  "South Korea",
  "China",
  "Hong Kong",
  "Taiwan",
  "Brazil",
  "Argentina",
  "Colombia",
  "Chile",
  "Peru",
  "Portugal",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Switzerland",
  "Austria",
  "Ireland",
  "New Zealand",
  "Singapore",
  "India",
];

interface AddressFormProps {
  onSubmit: (address: Address) => void;
  initialAddress?: Partial<Address>;
}

export function AddressForm({ onSubmit, initialAddress }: AddressFormProps) {
  const t = useTranslations("checkout");

  const [recipientName, setRecipientName] = useState(
    initialAddress?.recipientName ?? ""
  );
  const [phone, setPhone] = useState(initialAddress?.phone ?? "");
  const [street, setStreet] = useState(initialAddress?.street ?? "");
  const [city, setCity] = useState(initialAddress?.city ?? "");
  const [state, setState] = useState(initialAddress?.state ?? "");
  const [country, setCountry] = useState(
    initialAddress?.country ?? "United States"
  );
  const [zip, setZip] = useState(initialAddress?.zip ?? "");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, boolean> = {};
    if (!recipientName.trim()) newErrors.recipientName = true;
    if (!phone.trim()) newErrors.phone = true;
    if (!street.trim()) newErrors.street = true;
    if (!city.trim()) newErrors.city = true;
    if (!state.trim()) newErrors.state = true;
    if (!country.trim()) newErrors.country = true;
    if (!zip.trim()) newErrors.zip = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      zip: zip.trim(),
    });
  };

  const inputClass = (field: string) =>
    `w-full bg-surface border ${
      errors[field] ? "border-destructive" : "border-border"
    } text-accent rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand outline-none text-sm`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-base font-semibold text-accent">
        {t("shippingAddress")}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted mb-1">
            {t("recipientName")} *
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className={inputClass("recipientName")}
            placeholder={t("recipientName")}
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">
            {t("phone")} *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass("phone")}
            placeholder={t("phone")}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">
          {t("street")} *
        </label>
        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          className={inputClass("street")}
          placeholder={t("street")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted mb-1">
            {t("city")} *
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass("city")}
            placeholder={t("city")}
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">
            {t("state")} *
          </label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={inputClass("state")}
            placeholder={t("state")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted mb-1">
            {t("country")} *
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass("country")}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">
            {t("zip")} *
          </label>
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className={inputClass("zip")}
            placeholder={t("zip")}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-accent text-background font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
      >
        {t("useThisAddress")}
      </button>
    </form>
  );
}
