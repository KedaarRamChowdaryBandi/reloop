import json
import re

from engine.llm_client import ask_ai

MATERIAL_TYPES = ["wood", "plastic", "paper", "fabric", "metal"]

# Prompt modified to ask for material shelf-life/lifetime in days
ANALYSIS_PROMPT = """You are analyzing a waste material listing for a circular economy marketplace.

Listing: "{listing_text}"

Read the listing and respond with ONLY a JSON object (no markdown, no extra text) in this exact format:
{{
  "material_type": one of {material_types},
  "quantity": a number (just the numeric value, no units),
  "unit": the unit mentioned, e.g. "kg", "tons", "units",
  "condition": one of ["excellent", "good", "fair", "poor"],
  "lifetime_days": a number representing the estimated remaining shelf-life or lifetime in days (e.g. 5 for fresh organic scraps, 30 for textile piles, 90 for dry wood, 180 for non-perishable plastics or metals. Default to 30 if not mentioned or unclear),
  "summary": a short one-sentence summary of the listing
}}

If the quantity, unit, or condition isn't stated, make a reasonable estimate. Pick the closest material_type even if it isn't an exact match."""


def analyze_listing(listing_text):

    prompt = ANALYSIS_PROMPT.format(listing_text=listing_text, material_types=MATERIAL_TYPES)

    raw_response = ask_ai(prompt)

    cleaned = re.sub(r"```json|```", "", raw_response).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        data = fallback_analysis(listing_text)

    return data


def fallback_analysis(listing_text):

    text = listing_text.lower()

    material_type = "wood"
    for material in MATERIAL_TYPES:
        if material in text:
            material_type = material
            break

    quantity_match = re.search(r"(\d+(\.\d+)?)", text)
    quantity = float(quantity_match.group(1)) if quantity_match else 1

    return {
        "material_type": material_type,
        "quantity": quantity,
        "unit": "kg",
        "condition": "good",
        "lifetime_days": 30,
        "summary": listing_text[:100]
    }