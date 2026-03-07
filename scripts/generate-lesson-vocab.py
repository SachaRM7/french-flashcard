#!/usr/bin/env python3
# scripts/generate-lesson-vocab.py
# Lie les mots des lecons aux cartes des decks thematiques via arPlain/frontPlain

import json
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(SCRIPT_DIR, '..')
LESSONS_DIR = os.path.join(ROOT, 'data', 'lessons')
DECKS_FILE = os.path.join(ROOT, 'data', 'decks', 'arabic.json')

def remove_harakats(text):
    return re.sub(r'[\u064B-\u065F\u0670]', '', text or '')

def normalize(text):
    t = remove_harakats(text)
    # Remove punctuation
    t = re.sub(r'[!?.،؟]', '', t)
    return t.strip()

def main():
    # Load decks
    print('[load] Reading decks...')
    try:
        with open(DECKS_FILE, encoding='utf-8') as f:
            decks_data = json.load(f)
    except Exception as e:
        print('[err] Cannot read decks: ' + str(e))
        sys.exit(1)

    # Build lookup: frontPlain -> list of cardIds
    front_map = {}
    for deck in decks_data.get('decks', []):
        for card in deck.get('cards', []):
            fp = normalize(card.get('frontPlain', ''))
            if fp:
                if fp not in front_map:
                    front_map[fp] = []
                front_map[fp].append(card['id'])

    print('[ok] Loaded ' + str(len(front_map)) + ' unique frontPlain values from decks')

    # Process each lesson file
    lesson_files = [
        f for f in os.listdir(LESSONS_DIR)
        if f.endswith('.json') and f != 'index.json'
    ]

    total_vocab = 0
    total_linked = 0

    for fname in sorted(lesson_files):
        fpath = os.path.join(LESSONS_DIR, fname)
        try:
            with open(fpath, encoding='utf-8') as f:
                lesson = json.load(f)
        except Exception as e:
            print('[warn] ' + fname + ': ' + str(e))
            continue

        vocab = lesson.get('vocabulary', [])
        if not vocab:
            continue

        modified = False
        for word in vocab:
            total_vocab += 1
            ar_plain = normalize(word.get('arPlain', ''))

            matches = []
            # Exact match
            if ar_plain in front_map:
                matches = front_map[ar_plain]
            else:
                # Partial: deck card frontPlain is a substring of the lesson word
                for fp, card_ids in front_map.items():
                    if fp and (fp in ar_plain or ar_plain in fp):
                        matches.extend(card_ids)

            if matches:
                old_linked = word.get('linkedCards', [])
                new_linked = list(dict.fromkeys(old_linked + matches))
                if new_linked != old_linked:
                    word['linkedCards'] = new_linked
                    modified = True
                    total_linked += len(matches)

        if modified:
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(lesson, f, ensure_ascii=False, indent=2)
            link_count = sum(len(w.get('linkedCards', [])) for w in vocab)
            print('[ok] ' + fname + ': updated ' + str(link_count) + ' links')
        else:
            print('[--] ' + fname + ': no changes')

    print('')
    print('[done] ' + str(total_linked) + ' links created across ' + str(total_vocab) + ' vocabulary words')

if __name__ == '__main__':
    main()
