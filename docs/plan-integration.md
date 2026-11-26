# Plan: stad, väder och rekommendation

## 1. Händelse
Användaren byter stad i listan (eller trycker på knappen i formuläret). Då startar `laddaVader()`.
Sidan startar också med `laddaMenyn()` och `laddaVader()`.

## 2. Hämtning
1. `hittaStad(stadVal.value)` ger namn, lat och lon.
2. Tillståndet sätts till "laddar" och knappen stängs av.
3. `hamtaVaderSenaste(stad)` anropar väder-API:et. Den är inpackad i `senasteVinner`, så om användaren hinner byta stad igen räknas bara det sista svaret.
4. Är svaret gammalt gör vi ingenting. Annars blir tillståndet "klar". Kastas ett fel blir det "fel" med knappen *Försök igen*.
5. Menyn hämtas för sig med `laddaMenyn()`. Kommer vädret före menyn räknas rekommendationen om när menyn är klar.

## 3. Uppdatering
- `visaVader` skriver ut stad och väder.
- `tillampaRekommendation(vader)` kör `rekommendera(vader, meny)`, sparar resultatet i `aktuellRekommendation`, visar rubriken och markerar rätterna.
- `ritaMeny()` markerar rätterna igen varje gång menyn ritas om, så markeringen finns kvar när man byter filter.

## Flöde
```
byt stad -> laddaVader -> "Laddar..." -> hamtaVaderSenaste
   -> gammalt svar?  ja: gör inget
                     nej: visaVader -> rekommendera -> rubrik + markerade rätter
   -> fel? felruta med Försök igen
```

## Testnoteringar
(fylls i efter steg 7)
