BeleidsBibliotheek — bezoekteller (first-party, geen cookies)

Waar zie je het?
- Op de homepage (index.html), onderaan in de footer: tweede regel onder Versie / Compliance / Disclaimer.
- Alleen zichtbaar op beleidsbibliotheekwassenaar.nl (en www); lokaal en acceptatie tonen deze regel niet.

Werking
- stats/ping.php telt één weergave per paginalading en geeft JSON met totalen terug.
- Bezoeker-identiteit: SHA-256 van (geheim zout + IP + User-Agent); bestanden data/.salt en data/stats.sqlite.
- Geen cookies, geen third-party scripts.

Deploy (Argeweb)
- Upload de map stats/ (inclusief data/.htaccess). PHP moet aan staan.
- Eerste request maakt data/.salt en data/stats.sqlite aan; map data/ moet schrijfbaar zijn voor de webserver (bijv. chmod 775).

Controle
- Open: https://beleidsbibliotheekwassenaar.nl/stats/ping.php — verwacht JSON met "ok": true
