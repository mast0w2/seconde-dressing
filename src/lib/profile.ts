// src/lib/profile.ts
// Shared helpers to determine whether a profile has all mandatory fields filled.

import type { Profile, Role } from "@/types/database";

export interface ProfileCompletenessResult {
  isComplete: boolean;
  missing: string[];
}

export const MANDATORY_PROFILE_FIELDS: Array<{
  key: keyof Profile;
  label: string;
}> = [
  { key: "first_name", label: "Prénom" },
  { key: "last_name", label: "Nom" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Téléphone" },
  { key: "street_address", label: "Adresse" },
];

export function getProfileMissingFields(
  profile: Partial<Profile> | null | undefined
): string[] {
  if (!profile) {
    return MANDATORY_PROFILE_FIELDS.map((f) => f.label);
  }

  return MANDATORY_PROFILE_FIELDS.filter((f) => {
    const value = profile[f.key];
    return value === null || value === undefined || String(value).trim() === "";
  }).map((f) => f.label);
}

export function isProfileComplete(
  profile: Partial<Profile> | null | undefined
): boolean {
  return getProfileMissingFields(profile).length === 0;
}

/** Single source of truth for "which dashboard does this role land on". */
export function dashboardPathForRole(role: Role): string {
  return role === "seller" ? "/dashboard/seller" : "/dashboard/client";
}
