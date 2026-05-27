export const DEPARTMENT_OPTIONS = ["HR", "BIM", "Digital Marketing", "operations"] as const;

export type Department = (typeof DEPARTMENT_OPTIONS)[number];

const NORMALIZED_BY_LOWER: Record<string, Department> = {
  hr: "HR",
  bim: "BIM",
  "digital marketing": "Digital Marketing",
  operations: "operations",
};

/**
 * Normalize user/seed input to the canonical department strings we allow.
 * Returns `null` if the value isn't one of the allowed departments.
 */
export function normalizeDepartment(value: string): Department | null {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  return NORMALIZED_BY_LOWER[normalized] ?? null;
}
