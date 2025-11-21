FamilyQuiz Master - Projekt Prompt
Íme egy átfogó prompt a Claude Code számára:

Projekt név: FamilyQuiz Master (vagy magyarul: Családi Kvíz Mester)
Projekt leírás
Készíts egy többszereplős, valós idejű kvízjátékot családi összejövételekre, ahol a játékosok telefonjukról csatlakoznak QR kód segítségével, és egy közös TV képernyőn követhetik nyomon a játékot.
Funkcionális követelmények
1. Architektúra

WebSocket alapú valós idejű kommunikáció
Két fő felület:

Host képernyő (TV/projektor): teljes UI, kérdések, válaszok, élő eredményjelző
Játékos képernyő (telefon): csak a 4 válaszgomb, egyszerű design


QR kód generálás a csatlakozáshoz
Szoba/játék kód rendszer

2. Játékmenet

50 kérdés összesen:

4 témakör × 10 kérdés (normál pontok)
1 vegyes kategória × 10 kérdés (dupla pontok)


Minden kérdésnél:

4 válaszlehetőség (A, B, C, D)
15 másodperces időlimit
Visszaszámláló timer a képernyőn


Pontozás:

Gyorsasági alapú: első helyes válasz = legtöbb pont, második = kevesebb, stb.
Rossz vagy késői válasz = 0 pont
Vegyes kategóriában dupla pontok



3. Host képernyő elemei

Aktuális kérdés szövege nagy betűkkel
Mind a 4 válaszlehetőség
Visszaszámláló (15 másodperc)
Élő rangsor/eredményjelző a játékosokkal
Kategória és kérdésszám jelzése (pl. "Kategória 2/4 - Kérdés 13/50")
Szép, modern design animációkkal

4. Játékos képernyő elemei

Csak 4 nagy gomb (A, B, C, D színekkel)
Visszajelzés ha válaszoltak (gombok lezárása)
Egyszerű, mobil-optimalizált design
Saját pontszám megjelenítése

5. Technikai specifikáció

Node.js + Express backend
WebSocket (socket.io)
React vagy vanilla HTML/CSS/JS frontend
QR kód generálás (qrcode library)
Reszponzív design
Magyar nyelv minden szövegnél

6. Kérdések tárolása

JSON fájlban vagy egyszerű adatbázisban
Formátum:

json{
  "categories": [
    {
      "name": "Történelem",
      "questions": [
        {
          "question": "Mikor volt a mohácsi csata?",
          "answers": ["1456", "1526", "1552", "1686"],
          "correct": 1
        }
      ]
    }
  ]
}
7. Extra funkciók

Játékos nevek megadása csatlakozáskor
Admin felület a host számára (játék indítása, szüneteltetése)
Végső eredményjelző lista animált megjelenítéssel
Konfiguráció lehetőség (időlimit módosítása, pontszámok testreszabása)

Deliverable-ek

Működő backend szerver
Host UI (HTML/CSS/JS vagy React)
Játékos UI (mobilra optimalizálva)
Minta kérdések magyar nyelven (legalább 20 db különböző témákban)
README használati útmutatóval
QR kód generálás implementálva

Stílus és dizájn javaslatok

Modern, játékos design
Élénk színek a válaszgombokhoz
Smooth animációk a válaszok megjelenítésekor
-Confetti vagy hasonló effekt helyes válasznál
Dark mode friendly