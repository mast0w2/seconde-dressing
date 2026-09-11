"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface BanFeature {
  label: string;
  name: string;
  postcode: string;
  city: string;
  context: string;
}

export interface AddressPicked {
  label: string;
  city: string;
  postcode: string;
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onPick?: (picked: AddressPicked) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function AddressInput({
  value,
  onChange,
  onPick,
  placeholder,
  disabled,
  id,
  className,
}: AddressInputProps) {
  const [features, setFeatures] = useState<BanFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const pickedRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pickedRef.current === value) {
      setFeatures([]);
      setIsOpen(false);
      return;
    }
    if (value.trim().length < 4) {
      setFeatures([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?limit=5&q=${encodeURIComponent(value)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const json = await res.json();
        const items: BanFeature[] = (json.features || []).map((f: any) => ({
          label: f.properties.label as string,
          name: f.properties.name as string,
          postcode: f.properties.postcode as string,
          city: (f.properties.city as string) || (f.properties.name as string),
          context: f.properties.context as string,
        }));
        setFeatures(items);
        setIsOpen(items.length > 0);
      } catch {
        /* requête annulée ou réseau indisponible : on n'affiche simplement rien */
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pick = (f: BanFeature) => {
    pickedRef.current = f.label;
    onChange(f.label);
    setFeatures([]);
    setIsOpen(false);
    onPick?.({ label: f.label, city: f.city, postcode: f.postcode });
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (isOpen && features.length > 0) {
              pick(features[0]);
            }
          }
          if (e.key === "Escape") setIsOpen(false);
        }}
        onFocus={() => {
          if (pickedRef.current !== value && features.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={className ?? "w-full"}
      />
      {isOpen && features.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 max-h-64 overflow-auto rounded-md shadow-lg">
          {features.map((f, i) => (
            <li key={`${f.label}-${i}`}>
              <button
                type="button"
                onClick={() => pick(f)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <span className="block text-sm text-gray-900">{f.label}</span>
                <span className="block text-xs text-gray-500">{f.context}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddressInput;
