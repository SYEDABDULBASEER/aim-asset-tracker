import type { Asset, AssetCategory } from "@/lib/models";

export type Book1ProfileFamily = "desktop" | "monitor" | "laptop" | "accessory";

export type Book1Profile = {
  key: string;
  label: string;
  family: Book1ProfileFamily;
  category: AssetCategory;
  defaultName: string;
  specifications: string;
  upgrades: string;
  quantity: number;
};

export const BOOK1_DESKTOP_PROFILES: Book1Profile[] = [
  {
    key: "AIM_A",
    label: "AIM-A",
    family: "desktop",
    category: "Desktop",
    defaultName: "AIM-A",
    specifications:
      "Ram-64GB; SSD-1TB; HDD-/; Processor-I9-12th gen; GPU-8 GB RTX 3060 TI",
    upgrades: "Up graded from 32 to 64 gb ram",
    quantity: 5,
  },
  {
    key: "AIM_B",
    label: "AIM-B",
    family: "desktop",
    category: "Desktop",
    defaultName: "AIM-B",
    specifications:
      "Ram-32GB; SSD-500GB; HDD-1TB; Processor- AMD RYZEN 5; GPU-8 GB RTX 3060 TI",
    upgrades: "",
    quantity: 2,
  },
  {
    key: "AIM_C",
    label: "AIM-C",
    family: "desktop",
    category: "Desktop",
    defaultName: "AIM-C",
    specifications:
      "Ram-16GB; SSD-1TB; HDD-/; Processor- AMD RYZEN 5; GPU-8 GB AMD RADION RX 6600",
    upgrades: "10PCS  Up graded from 16 to 32 gb ram",
    quantity: 32,
  },
  {
    key: "AIM_D",
    label: "AIM-D",
    family: "desktop",
    category: "Desktop",
    defaultName: "AIM-D",
    specifications:
      "Ram-48GB; SSD-1TB; HDD-/; Processor-AMD RYZEN 7; GPU-8GB RADION RX 580 2048 SP",
    upgrades: "",
    quantity: 2,
  },
  {
    key: "AIM_E",
    label: "AIM-E",
    family: "desktop",
    category: "Desktop",
    defaultName: "AIM-E",
    specifications:
      "Ram-48GB; SSD-1TB; HDD-/; Processor-AMD RYZEN 7; GPU-4GB RTX 730",
    upgrades: "",
    quantity: 2,
  },
  {
    key: "AIM_F",
    label: "AIM-F",
    family: "desktop",
    category: "Desktop",
    defaultName: "AIM-F",
    specifications: "Ram-16GB; SSD-500GB; HDD-/; Processor- I5; GPU-4 GB RTX 730",
    upgrades: "",
    quantity: 2,
  },
];

export const BOOK1_MONITOR_PROFILES: Book1Profile[] = [
  {
    key: "MON_LENOVO",
    label: "Lenovo",
    family: "monitor",
    category: "Monitor",
    defaultName: "Lenovo monitor",
    specifications: "",
    upgrades: "",
    quantity: 1,
  },
  {
    key: "MON_THINKCENTRE",
    label: "ThinkCentre",
    family: "monitor",
    category: "Monitor",
    defaultName: "ThinkCentre monitor",
    specifications: "",
    upgrades: "",
    quantity: 1,
  },
  {
    key: "MON_AOC",
    label: "AOC",
    family: "monitor",
    category: "Monitor",
    defaultName: "AOC monitor",
    specifications: "",
    upgrades: "",
    quantity: 1,
  },
  {
    key: "MON_SAMSUNG",
    label: "Samsung",
    family: "monitor",
    category: "Monitor",
    defaultName: "Samsung monitor",
    specifications: "",
    upgrades: "",
    quantity: 1,
  },
];

export const BOOK1_LAPTOP_PROFILES: Book1Profile[] = [
  {
    key: "LAP_01",
    label: "LAP-01",
    family: "laptop",
    category: "Laptop",
    defaultName: "Laptop workstation",
    specifications:
      "Ram-32GB; SSD-1TB; HDD-/; Processor-I7 12th gen; GPU-8 GB RTX 3070 TI",
    upgrades: "",
    quantity: 1,
  },
];

export const BOOK1_ACCESSORY_PROFILES: Book1Profile[] = [
  {
    key: "ACC_MOUSE",
    label: "Mouse",
    family: "accessory",
    category: "Accessory",
    defaultName: "Mouse",
    specifications: "",
    upgrades: "",
    quantity: 1,
  },
  {
    key: "ACC_KEYBOARD",
    label: "Keyboard",
    family: "accessory",
    category: "Accessory",
    defaultName: "Keyboard",
    specifications: "",
    upgrades: "",
    quantity: 1,
  },
  {
    key: "ACC_HEADSET",
    label: "Headset",
    family: "accessory",
    category: "Accessory",
    defaultName: "Headset",
    specifications: "",
    upgrades: "",
    quantity: 1,
  },
];

export const BOOK1_PROFILES: Book1Profile[] = [
  ...BOOK1_DESKTOP_PROFILES,
  ...BOOK1_MONITOR_PROFILES,
  ...BOOK1_LAPTOP_PROFILES,
  ...BOOK1_ACCESSORY_PROFILES,
];

const PROFILE_BY_KEY = new Map(BOOK1_PROFILES.map((profile) => [profile.key, profile]));
const PROFILE_BY_LABEL = new Map(
  BOOK1_PROFILES.filter((profile) => profile.label).map((profile) => [profile.label, profile]),
);

export function getBook1Profile(key: string | null | undefined): Book1Profile | undefined {
  if (!key) return undefined;
  return PROFILE_BY_KEY.get(key);
}

export function getBook1ProfileByName(name: string | null | undefined): Book1Profile | undefined {
  if (!name) return undefined;
  const trimmed = name.trim();
  return PROFILE_BY_LABEL.get(trimmed) ?? BOOK1_PROFILES.find((profile) => profile.defaultName === trimmed);
}

export function parseBook1Specifications(specifications: string): string[] {
  return specifications
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getAssetSpecificationLines(asset: Pick<Asset, "name" | "specifications">): string[] {
  if (asset.specifications?.trim()) {
    return parseBook1Specifications(asset.specifications);
  }
  const profile = getBook1ProfileByName(asset.name);
  return profile ? parseBook1Specifications(profile.specifications) : [];
}

export function book1ProfilesForCategory(category: AssetCategory): Book1Profile[] {
  return BOOK1_PROFILES.filter((profile) => profile.category === category);
}

export function formatBook1ProfileName(profile: Book1Profile): string {
  if (profile.family === "desktop") return profile.label;
  return profile.defaultName;
}

export function book1ProfileFamilyLabel(profile: Book1Profile): string {
  if (profile.family === "desktop") return "AIM profile";
  if (profile.family === "monitor") return "Monitor brand";
  if (profile.family === "laptop") return "Laptop profile";
  return "Accessory type";
}
