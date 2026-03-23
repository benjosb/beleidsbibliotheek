# Denkstuk Schrijf-Wijzer — Diepere reflectie

**Opdracht:** Dieper nadenken over het concept.  
**Datum:** Maart 2026

---

## 1. Wat hebben we nu?

- Tweetraps: portefeuille vooraf, subthema's per sectie
- Knoppen in het document — beleid verschijnt inline
- Geen copy-paste
- JSON-export voor toekomstige agent
- Menu-item Schrijfwijzer (beta)

---

## 2. Wat ontbreekt nog? (conceptueel)

### 2.1 De "eerste keer"-ervaring

Een beleidsmedewerker die voor het eerst de Schrijfwijzer opent:
- Ziet eerst alleen portefeuille-knoppen
- Moet begrijpen: "ik kies mijn domein, dan krijg ik een formulier"
- **Vraag:** Is dat duidelijk genoeg? Een korte intro-tekst ("Kies je portefeuille om te starten") kan helpen.

### 2.2 Relatie met het echte collegevoorstel

Het formulier is een *concept* — de medewerker schrijft hier, maar het echte collegevoorstel gaat vaak via Word of een DMS (iBabs, etc.).

- **Optie A:** Schrijfwijzer blijft concept-tool; export naar Word/PDF voor verdere afhandeling
- **Optie B:** Integratie met DMS — als Wassenaar een systeem heeft waar collegevoorstellen worden ingediend, zou de Schrijfwijzer daarop kunnen aansluiten
- **Optie C:** Schrijfwijzer als "beleids-check" vóór het echte voorstel — je doorloopt de stappen, haalt beleid op, en neemt dat mee naar Word

**Advies:** Start met A/C. B is een groter traject.

### 2.3 Meerdere portefeuilles in één voorstel?

Sommige voorstellen raken meerdere portefeuilles (bijv. een subsidie die zowel Cultuur als Financiën raakt). Nu is de keuze: één portefeuille.

- **Nu:** Eén portefeuille — eenvoudig, sluit aan bij "een medewerker werkt binnen één domein"
- **Later:** Multi-portefeuille als optie? Dan worden de subthema-knoppen een combinatie van beide. Complexer.

**Advies:** Houd één portefeuille. Als een voorstel meerdere domeinen raakt, kies het primaire. De subthema's zijn flexibel genoeg.

### 2.4 Actualiteit van de beleidssamenvattingen

De samenvattingen komen uit `SAMENVATTING_PER_THEMA` — die worden handmatig of semi-automatisch bijgewerkt. Als er nieuwe raadsbesluiten of collegebesluiten bijkomen, moet die data worden geüpdatet.

- **Vraag:** Hoe vaak? Per kwartaal? Na elke merge van data.js?
- **Mogelijkheid:** Een "Laatst bijgewerkt: [datum]" in de Schrijfwijzer, gekoppeld aan de data-bron.

---

## 3. Agent-toekomst — verdieping

### 3.1 Wat kan een agent doen?

| Functie | Complexiteit | Waarde |
|---------|--------------|--------|
| **Volledigheid check** | Laag | Hoog — "Aanleiding is leeg", "Financiële consequenties ontbreken" |
| **Beleidsconsistentie** | Medium | Hoog — "De tekst verwijst niet naar het geselecteerde beleid" |
| **Suggesties voor tekst** | Hoog | Zeer hoog — "Op basis van Jeugdhulp-beleid: [voorstel]" |
| **Tone-of-voice** | Medium | Medium — "Formuleer zakelijker" |
| **Juridische check** | Hoog | Hoog — vereist juridische kennis |

**Advies:** Begin met volledigheid + beleidsconsistentie. Dat is haalbaar en direct nuttig.

### 3.2 Prompt-architectuur

De agent krijgt:
1. **Context:** Portefeuille, geselecteerde subthemas per sectie, beleidssamenvattingen
2. **Input:** De door de gebruiker geschreven tekst per sectie
3. **Opdracht:** Bijv. "Controleer of de aanleiding voldoende onderbouwd is met het geselecteerde beleid. Geef max. 3 verbetersuggesties."

De JSON-export is al geschikt als input. Een volgende stap: een "Controleer met AI"-knop die de JSON naar een API stuurt en het resultaat toont.

### 3.3 Privacy en vertrouwelijkheid

Collegevoorstellen kunnen vertrouwelijk zijn. De Schrijfwijzer draait nu lokaal (localStorage). Als we een agent gebruiken:
- **Optie 1:** Agent draait lokaal (bijv. Ollama, lokale LLM) — geen data naar buiten
- **Optie 2:** Agent via API — dan moet de data mogelijk geanonimiseerd of binnen de firewall blijven

**Advies:** Voor een pilot: bespreek met opdrachtgever. Wassenaar heeft mogelijk richtlijnen voor AI-gebruik.

---

## 4. UX-verfijningen (voor later)

- **Snel subthema's overnemen:** "Gebruik dezelfde selectie als vorige sectie" — als Aanleiding en Gevraagde beslissing dezelfde beleidscontext hebben
- **Zoekfunctie in beleid:** Bij lange samenvattingen: Ctrl+F of een zoekveld
- **Uitklapbare beleidspanels:** Nu altijd zichtbaar; op mobiel kan dat veel ruimte innemen. Een "Toon/verberg beleid"-toggle per sectie
- **Voorbeeld-voorstel:** Een ingevuld voorbeeld (anoniem) om te laten zien hoe het werkt

---

## 5. Wat te doen morgen?

1. **Demo voor opdrachtgever** — Laat de tweetraps zien, de knoppen in het document, de flow
2. **Vraag feedback** — Wat mist? Wat is verwarrend? Wat zou handig zijn?
3. **Prioriteer** — Op basis van feedback: wat is de volgende stap? (Agent? Export naar Word? UX-verfijning?)

---

Welterusten. Tot morgen.
