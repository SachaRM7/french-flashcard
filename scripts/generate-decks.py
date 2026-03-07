#!/usr/bin/env python3
"""
Générateur de decks multilingues
- Lit les fichiers vocabulary/*.json
- Traduit automatiquement via GPT (optionnel)
- Génère data/decks/arabic.json et data/decks/french.json

Usage: python generate-decks.py [--translate]
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
VOCAB_DIR = BASE_DIR / "data" / "vocabulary"
CACHE_FILE = BASE_DIR / "data" / "translations_cache.json"
OUTPUT_DIR = BASE_DIR / "data" / "decks"

def remove_harakats(text):
    return re.sub(r'[\u064B-\u065F\u0670]', '', text)

def load_cache():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text(encoding='utf-8'))
    return {}

def save_cache(cache):
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')

def translate_batch(words, cache):
    new_words = [w for w in words if w not in cache]
    if not new_words:
        return cache

    print(f"[...] Traduction de {len(new_words)} nouveaux mots...")
    words_list = ", ".join(new_words)
    prompt = f"""Traduis ces mots français en anglais et arabe.
Réponds UNIQUEMENT avec un JSON array, sans markdown ni explication.
Format: [{{"fr":"mot","en":"word","ar":"كلمة","translit":"kalima"}}]

Mots: {words_list}"""

    try:
        import subprocess
        result = subprocess.run(
            ["oracle", "-q", "-e", "claude", prompt],
            capture_output=True, text=True, timeout=60
        )
        response = result.stdout.strip()
        start = response.find('[')
        end = response.rfind(']') + 1
        if start >= 0 and end > start:
            translations = json.loads(response[start:end])
            for t in translations:
                if "fr" in t:
                    cache[t["fr"]] = {
                        "en": t.get("en", t["fr"]),
                        "ar": t.get("ar", t["fr"]),
                        "translit": t.get("translit", "")
                    }
            save_cache(cache)
            print(f"[ok] {len(translations)} mots traduits et mis en cache")
    except Exception as e:
        print(f"[err] Erreur traduction: {e}")

    return cache

def generate_decks(do_translate=False):
    cache = load_cache()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    vocab_files = sorted(VOCAB_DIR.glob("**/*.json"))
    if not vocab_files:
        print("Aucun fichier vocabulary trouvé dans data/vocabulary/")
        return

    all_words = set()
    all_vocabs = []

    for vocab_file in vocab_files:
        vocab = json.loads(vocab_file.read_text(encoding='utf-8'))
        all_vocabs.append(vocab)
        for card in vocab["cards"]:
            all_words.add(card["fr"])

    if do_translate:
        cache = translate_batch(list(all_words), cache)

    missing = [w for w in all_words if w not in cache]
    if missing:
        print(f"[warn] {len(missing)} mots sans traduction (les premiers: {missing[:5]})")

    arabic_decks = []
    french_decks = []

    for vocab in all_vocabs:
        print(f"  {vocab['name']}")
        arabic_cards = []
        french_cards = []

        for index, card in enumerate(vocab["cards"]):
            word_fr = card["fr"]
            emoji = card.get("emoji", "")
            image = card.get("image", None)
            deck_id = vocab["id"]

            ar = card.get("ar")
            en = card.get("en")
            translit = card.get("ar_translit", "")

            if not ar or not en:
                trans = cache.get(word_fr, {})
                if not ar:
                    ar = trans.get("ar", word_fr)
                if not en:
                    en = trans.get("en", word_fr)
                if not translit:
                    translit = trans.get("translit", "")

            card_id = f"{deck_id}:{index}"

            arabic_cards.append({
                "id": card_id,
                "front": ar,
                "frontPlain": remove_harakats(ar) if ar else ar,
                "back": word_fr,
                "en": en,
                "translit": translit,
                "emoji": emoji,
                "image": image,
                "audio": None,
                "tags": []
            })

            french_cards.append({
                "id": card_id,
                "front": en,
                "frontPlain": en,
                "back": word_fr,
                "en": en,
                "translit": "",
                "emoji": emoji,
                "image": image,
                "audio": None,
                "tags": []
            })

        arabic_decks.append({
            "id": vocab["id"],
            "name": vocab["name"],
            "nameAr": vocab.get("nameAr", ""),
            "category": vocab.get("category", "Vocabulaire"),
            "tags": [],
            "cards": arabic_cards
        })

        french_decks.append({
            "id": vocab["id"],
            "name": vocab["name"],
            "nameAr": "",
            "category": vocab.get("category", "Vocabulaire"),
            "tags": [],
            "cards": french_cards
        })

    timestamp = datetime.utcnow().isoformat() + "Z"

    (OUTPUT_DIR / "arabic.json").write_text(
        json.dumps({"version": timestamp, "courseId": "arabic", "decks": arabic_decks},
                   ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    (OUTPUT_DIR / "french.json").write_text(
        json.dumps({"version": timestamp, "courseId": "french", "decks": french_decks},
                   ensure_ascii=False, indent=2),
        encoding='utf-8'
    )

    total_cards = sum(len(d["cards"]) for d in arabic_decks)
    print(f"\n[ok] Genere: {len(arabic_decks)} decks, {total_cards} cartes")
    print("   -> data/decks/arabic.json")
    print("   -> data/decks/french.json")

if __name__ == "__main__":
    do_translate = "--translate" in sys.argv
    generate_decks(do_translate)
