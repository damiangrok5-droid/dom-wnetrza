# Strona: wybór stylu wnętrz

Statyczna strona (HTML + CSS + JS, bez build stepu). GitHub Pages: ustaw źródło na katalog z tą stroną
(np. przenieś zawartość `site/` do roota repo lub do `/docs`). Nie dodawaj `.nojekyll` – dzięki temu `img/_raw` nie jest publikowany.

- `index.html`, `assets/app.css`, `assets/app.js` – aplikacja (zakładki: Style · Pokoje · Zakupy · Porównanie, routing po `#`)
- `data/` – generowane: `python3 narzedzia/build_site_data.py` (z `analiza/pomieszczenia-v2.json`, `style/style.json`, `zakupy/*.csv`, `zakupy/podsumowanie.md`)
- `plany/` – rzuty pomieszczeń (kopiowane przez skrypt powyżej)
- `img/<styl>/` – wizualizacje, opis konwencji w `img/README.md`

Podgląd lokalny: `cd site && python3 -m http.server 8000` → http://localhost:8000
