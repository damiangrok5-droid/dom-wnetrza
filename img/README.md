# Wizualizacje – konwencja dla projektantów

Katalog: `img/<slug-stylu>/` (modern-organic, japandi, skandynawski-jasny, cieply-minimalizm, industrialny-loft, nowoczesna-klasyka).

## Najprościej – bez manifestu
Plik nazwany numerem pomieszczenia: `1-02.jpg`, kolejne ujęcia `1-02_b.jpg`, `1-02_c.jpg` … (do `_e`).
Strona sama je znajdzie. Brak pliku = karta „W przygotowaniu”.

## Z manifestem (opcjonalnie, `img/<slug>/manifest.json`)
Pozwala dodać podpisy, okładkę i dowolne nazwy plików. Akceptowane formy (dowolna):

```json
{"cover":"1-02.jpg",
 "images":[{"room":"1/02","file":"1-02.jpg","caption":"salon z narożnikiem, widok na HST"},
           {"room":"1/02","file":"1-02_b.jpg","caption":"jadalnia i kominek"}]}
```
```json
{"rooms":{"1/02":["1-02.jpg","1-02_b.jpg"],"2-02":[{"file":"2-02.jpg","caption":"okno szczytowe"}]}}
```
```json
["1-02.jpg","1-02_b.jpg","2-02.jpg"]
```
- pokój: `room`/`room_id`/`id` w formacie `1/02` lub `1-02`; jeśli brak – brany z początku nazwy pliku,
- plik: `file`/`src`/`path`; ścieżka względna do `img/<slug>/` (lub zaczynająca się od `img/`),
- pozycje z `"rejected":true`, `"ok":false` lub `status` zawierającym „odrzu”, oraz pliki `*_rej.*` są pomijane,
- pomieszczenia nieobecne w manifeście są dalej szukane wg konwencji nazw.

Po dodaniu plików uruchom kompresję (max 1600 px, q80, oryginały → `wizualizacje/_oryginaly_site/`):
`python3 narzedzia/optimize_images.py`

Katalogi zaczynające się od `_` (np. `_raw`) GitHub Pages (Jekyll) pomija – nie trafią na stronę.
