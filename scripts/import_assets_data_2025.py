#!/usr/bin/env python3
"""
Import "PCs and Specifications" sheet from Assets Data 2025.xlsx.

Column mapping (sheet → Asset model):
  S No         → serial
  Name         → name (id = PC-{Name code}, e.g. PC-A01)
  Accessories  → specifications (Accessories: …)
  Softwares    → specifications (Softwares: …)
  Desk         → location
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "Assets Data 2025.xlsx"
SHEET_NAME = "PCs and Specifications"
TARGET = ROOT / "src" / "utils" / "seed.assets-data-2025.ts"

HEADERS = ("S No", "Name", "Accessories", "Softwares", "Desk")


def normalize_id(name: str) -> str:
    base = re.match(r"^([A-Z]\d+)", name.strip(), re.I)
    if base:
        return f"PC-{base.group(1).upper()}"
    slug = re.sub(r"[^A-Za-z0-9]+", "-", name.strip()).strip("-").upper()
    return f"PC-{slug[:24]}"


def format_sno(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value == int(value):
        return str(int(value))
    return str(value).strip()


def is_pc_name(name) -> bool:
    if not name:
        return False
    label = str(name).strip()
    if label.upper() in ("RAM", "GRAPHICS CARD", "PROCESSOR", "CATEGORY", "COMPONENTS"):
        return False
    return bool(re.match(r"^[A-Z]\d+", label, re.I))


def build_specifications(accessories: list[str], softwares: list[str]) -> str:
    parts: list[str] = []
    if accessories:
        parts.append("Accessories: " + ", ".join(accessories))
    if softwares:
        parts.append("Softwares: " + ", ".join(softwares))
    return "; ".join(parts)


def parse_sheet(ws) -> list[dict]:
    def cell(row: int, col: int):
        return ws.cell(row, col).value

    def desk_for_row(row: int):
        for merged in ws.merged_cells.ranges:
            if merged.min_col <= 5 <= merged.max_col and merged.min_row <= row <= merged.max_row:
                return cell(merged.min_row, 5)
        return cell(row, 5)

    assets: list[dict] = []
    row = 2
    while row <= ws.max_row:
        sno = cell(row, 1)
        name = cell(row, 2)
        if sno is not None and is_pc_name(name):
            label = str(name).strip()
            accessories: list[str] = []
            softwares: list[str] = []
            desk_val = desk_for_row(row)
            acc = cell(row, 3)
            sw = cell(row, 4)
            if acc and str(acc).strip():
                accessories.append(str(acc).strip())
            if sw and str(sw).strip():
                softwares.append(str(sw).strip())

            next_row = row + 1
            while next_row <= ws.max_row:
                next_sno, next_name = cell(next_row, 1), cell(next_row, 2)
                if next_sno is not None and is_pc_name(next_name):
                    break
                if next_sno == "Category":
                    break
                a, s = cell(next_row, 3), cell(next_row, 4)
                if a and str(a).strip():
                    accessories.append(str(a).strip())
                if s and str(s).strip():
                    softwares.append(str(s).strip())
                d = desk_for_row(next_row)
                if d and str(d).strip():
                    desk_val = d
                next_row += 1

            desk_str = str(desk_val).strip() if desk_val else ""
            assets.append(
                {
                    "id": normalize_id(label),
                    "name": label,
                    "serial": format_sno(sno),
                    "location": desk_str,
                    "accessories": accessories,
                    "softwares": softwares,
                }
            )
            row = next_row
        else:
            row += 1

    used: set[str] = set()
    for asset in assets:
        base = asset["id"]
        candidate = base
        n = 2
        while candidate in used:
            candidate = f"{base}-{n}"
            n += 1
        asset["id"] = candidate
        used.add(candidate)

    return [a for a in assets if a["location"]]


def main() -> None:
    if not WORKBOOK.is_file():
        raise SystemExit(f"Workbook not found: {WORKBOOK}")

    wb = load_workbook(WORKBOOK, data_only=True)
    if SHEET_NAME not in wb.sheetnames:
        raise SystemExit(f'Missing "{SHEET_NAME}". Sheets: {wb.sheetnames}')

    ws = wb[SHEET_NAME]
    row1 = [ws.cell(1, c).value for c in range(1, 6)]
    if [str(h).strip() if h else "" for h in row1] != list(HEADERS):
        raise SystemExit(f"Unexpected headers in row 1: {row1}\nExpected: {HEADERS}")

    assets = parse_sheet(ws)
    wb.close()

    lines = [
        'import type { Asset } from "@/lib/models";',
        "",
        "/**",
        f' * Sheet "{SHEET_NAME}" from {WORKBOOK.name}',
        " * Columns: S No → serial, Name → name, Desk → location,",
        " * Accessories + Softwares → specifications.",
        " * Regenerate: npm run import:assets-2025",
        " */",
        "export function buildAssetsData2025(): Asset[] {",
        "  return [",
    ]

    for asset in assets:
        specs = build_specifications(asset["accessories"], asset["softwares"])
        lines.extend(
            [
                "    {",
                f'      id: {json.dumps(asset["id"])},',
                f"      name: {json.dumps(asset['name'])},",
                '      category: "Desktop",',
                "      assignedTo: null,",
                "      department: null,",
                '      status: "Active",',
                "      warrantyUntil: null,",
                "      lastServiceAt: null,",
                f"      serial: {json.dumps(asset['serial'] or None)},",
                f"      location: {json.dumps(asset['location'])},",
                "      purchaseDate: null,",
                f"      specifications: {json.dumps(specs or None)},",
                "    },",
            ]
        )

    lines.extend(["  ];", "}"])
    TARGET.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(assets)} assets ({', '.join(HEADERS)}) → {TARGET}")


if __name__ == "__main__":
    main()
