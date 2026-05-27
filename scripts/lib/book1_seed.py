"""Pure helpers for Book1.xlsx seed export."""
from __future__ import annotations

from typing import Optional


def display_name(name: str, variant: Optional[str]) -> str:
    if variant and variant.startswith("AIM_"):
        return variant.replace("_", "-")
    return name
