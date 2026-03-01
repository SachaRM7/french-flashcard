#!/usr/bin/env python3
"""
Générateur de decks multilingues
- Lit les fichiers vocabulary/*.json (mots en français)
- Traduit automatiquement en anglais et arabe via GPT
- Génère les fichiers decks.js pour chaque cours

Usage: python3 generate-decks.py [--translate]
  Sans --translate : utilise le cache existant
  Avec --translate : traduit les nouveaux mots
"""

import json
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
VOCAB_DIR = BASE_DIR / "data" / "vocabulary"
CACHE_FILE = BASE_DIR / "data" / "translations_cache.json"

def load_cache():
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {}

def save_cache(cache):
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=2))

def translate_batch(words, cache):
    """Traduit un batch de mots via subprocess oracle"""
    new_words = [w for w in words if w not in cache]
    
    if not new_words:
        return cache
    
    print(f"🔄 Traduction de {len(new_words)} nouveaux mots...")
    
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
        
        # Chercher le JSON array
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
            print(f"✅ {len(translations)} mots traduits et mis en cache")
    except Exception as e:
        print(f"⚠️ Erreur traduction: {e}")
        print("💡 Utilise le cache manuel ou ajoute les traductions dans translations_cache.json")
    
    return cache

def generate_decks(do_translate=False):
    cache = load_cache()
    
    vocab_files = list(VOCAB_DIR.glob("*.json"))
    if not vocab_files:
        print("Aucun fichier vocabulary trouvé dans data/vocabulary/")
        return
    
    # Collecter tous les mots
    all_words = set()
    all_vocabs = []
    
    for vocab_file in vocab_files:
        vocab = json.loads(vocab_file.read_text())
        all_vocabs.append(vocab)
        for card in vocab["cards"]:
            all_words.add(card["fr"])
    
    # Traduire si demandé
    if do_translate:
        cache = translate_batch(list(all_words), cache)
    
    # Vérifier les mots manquants
    missing = [w for w in all_words if w not in cache]
    if missing:
        print(f"⚠️ {len(missing)} mots sans traduction: {missing[:5]}...")
        print("💡 Lance avec --translate ou ajoute-les dans translations_cache.json")
    
    # Générer les decks
    arabic_decks = []
    french_decks = []
    
    for vocab in all_vocabs:
        print(f"📚 {vocab['name']}")
        
        arabic_cards = []
        french_cards = []
        
        for card in vocab["cards"]:
            word_fr = card["fr"]
            emoji = card.get("emoji", "")
            trans = cache.get(word_fr, {"en": word_fr, "ar": word_fr, "translit": ""})
            
            arabic_cards.append({
                "front": trans["ar"],
                "back": word_fr,
                "translit": trans.get("translit", ""),
                "emoji": emoji
            })
            
            french_cards.append({
                "front": trans["en"],
                "back": word_fr,
                "emoji": emoji
            })
        
        arabic_decks.append({
            "id": vocab["id"],
            "name": vocab["name"],
            "category": vocab.get("category", "Vocabulaire"),
            "cards": arabic_cards
        })
        
        french_decks.append({
            "id": vocab["id"],
            "name": vocab["name"],
            "category": vocab.get("category", "Vocabulaire"),
            "cards": french_cards
        })
    
    # Écrire les fichiers avec timestamp cache-buster
    from datetime import datetime
    timestamp = datetime.utcnow().isoformat()
    
    (BASE_DIR / "data" / "arabic" / "decks.js").write_text(
        f"// Auto-generated decks - {timestamp}\nwindow.DECKS_VERSION = '{timestamp}';\nwindow.DECKS_DATA = {json.dumps(arabic_decks, ensure_ascii=False, indent=2)};"
    )
    (BASE_DIR / "data" / "french" / "decks.js").write_text(
        f"// Auto-generated decks - {timestamp}\nwindow.DECKS_VERSION = '{timestamp}';\nwindow.DECKS_DATA = {json.dumps(french_decks, ensure_ascii=False, indent=2)};"
    )
    
    print(f"\n✅ Généré: {len(arabic_decks)} decks Arabe, {len(french_decks)} decks Français")

if __name__ == "__main__":
    do_translate = "--translate" in sys.argv
    generate_decks(do_translate)
