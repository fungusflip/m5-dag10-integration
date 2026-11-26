// Dag 10: koppla ihop allt: stad -> väder -> rekommendation -> markering på menyn.
// Menyn, filtret och beställningen är färdiga från tidigare dagar. Läs hela filen först.
// Gör sedan TODO 1 till 4 i ordning och testa i webbläsaren efter varje.
import { visaMeny, uppdateraRubrik, markeraDagensRatt, visaOrder } from './ui'
import { billigast } from './meny'
import { filtreraMeny } from './filter'
import { kopplaFilter, kopplaLaggTill } from './events'
import { laggTillIOrder, rensaOrder } from './order'
import { hamtaMeny, hamtaVader } from './api'
import { laddaMeny, laddaData } from './tillstand'
import { visaTillstand, visaVader } from './tillstand-ui'
import { hittaStad } from './stader'
import { rekommendera } from './rekommendera'
import { markeraRekommenderade, visaRekommendation } from './rek-ui'
import { senasteVinner } from './senaste'
import { hamta } from './dom'
import type {
    Ratt,
    Filter,
    OrderRad,
    KlarMeny,
    FetchFn,
    Vader,
    Rekommendation,
    Stad,
    DataTillstand
} from './typer'

// Det vi visar för vädret: stadens namn och själva vädret.
interface VaderData {
    stad: string
    vader: Vader
}

// Sätt till true om väder-API:et inte fungerar (till exempel på skolans nät).
const ANVAND_RESERVDATA = false

const lista = hamta('#meny-lista')
const rubrik = hamta('#meny-rubrik')
const filterGrupp = hamta('#filter')
const vaderForm = hamta('#vader-form')
const stadVal = hamta<HTMLSelectElement>('#stad')
const vaderKnapp = hamta<HTMLButtonElement>('#vader-form button[type=submit]')
const vaderResultat = hamta('#vader-resultat')

let meny: Ratt[] = []
let aktivtFilter: Filter = 'alla'
let aktuellRekommendation: Rekommendation | null = null // { rubrik, ratter } eller null

// ---- Menyn ----
function ritaMeny(): void {
    const ratter = filtreraMeny(meny, aktivtFilter)
    visaMeny(lista, ratter)
    uppdateraRubrik(rubrik, ratter.length)
    const lunch = ratter.filter((ratt) => ratt.kategori === 'lunch')
    if (lunch.length > 0) {
        const dagens = billigast(lunch)
        if (dagens) {
            markeraDagensRatt(lista, dagens.id)
        }
    }
    // Rekommendationen ska överleva att menyn ritas om (filter, ny hämtning).
    if (aktuellRekommendation) {
        markeraRekommenderade(
            lista,
            aktuellRekommendation.ratter.map((r) => r.id)
        )
    }
}

function laddaMenyn(): void {
    laddaMeny(
        () => hamtaMeny(),
        (tillstand) => {
            visaTillstand(lista, tillstand, {
                vidForsokIgen: laddaMenyn,
                visaKlar: (_container, t: KlarMeny) => {
                    meny = t.ratter
                    ritaMeny()
                    visaOrder(orderRef, order, meny)
                    // Kom vädret före menyn? Räkna om rekommendationen nu när menyn finns.
                    if (senastVader) {
                        tillampaRekommendation(senastVader)
                    }
                }
            })
        }
    )
}

kopplaFilter(filterGrupp, (filter) => {
    aktivtFilter = filter
    if (meny.length > 0) {
        ritaMeny()
    }
})

// ---- Beställningen ----
let order: OrderRad[] = []
const orderRef = {
    lista: hamta('#order-lista'),
    summa: hamta('#order-summa'),
    tom: hamta('#order-tom')
}
kopplaLaggTill(lista, (id) => {
    order = laggTillIOrder(order, id)
    visaOrder(orderRef, order, meny)
})
hamta('#rensa-order').addEventListener('click', () => {
    order = rensaOrder()
    visaOrder(orderRef, order, meny)
})

// ---- Vädret och rekommendationen ----
const vaderFetch: FetchFn = ANVAND_RESERVDATA
    ? () => fetch('data/vader-stockholm.json')
    : fetch
// TODO 1: Den här raden är redan skriven. Läs den och förklara för dig själv vad den gör.
//   senasteVinner tar en funktion och ger tillbaka en ny version som ignorerar gamla svar.
//   Den fungerar först när du har gjort senasteVinner i src/senaste.ts (steg 5).
const hamtaVaderSenaste = senasteVinner((stad: Stad) =>
    hamtaVader(stad.lat, stad.lon, vaderFetch)
)
let senastVader: Vader | null = null

// TODO 2: Skriv tillampaRekommendation(vader).
//   - Spara resultatet av rekommendera(vader, meny) i aktuellRekommendation.
//   - Visa rubriken med visaRekommendation(vaderResultat, ...).
//   - Markera rätterna med markeraRekommenderade(lista, ...). Skicka in en lista med id:n (ratter.map(...)).
function tillampaRekommendation(vader: Vader): void {
    // sparar resultatet så ritaMeny kan markera igen efter filterbyte
    aktuellRekommendation = rekommendera(vader, meny)
    visaRekommendation(vaderResultat, aktuellRekommendation.rubrik)
    markeraRekommenderade(
        lista,
        aktuellRekommendation.ratter.map((r) => r.id)
    )
}

// TODO 3: Skriv laddaVader(). Den ska:
//   1. Hämta staden: hittaStad(stadVal.value).
//   2. Definiera en hjälpfunktion tillstand(t: DataTillstand<VaderData>) som:
//        - stänger av knappen medan det laddar: vaderKnapp.disabled = t.typ === "laddar"
//        - anropar visaTillstand(vaderResultat, t, { vidForsokIgen: laddaVader, visaKlar })
//        - i visaKlar: spara vädret i senastVader, anropa visaVader(container, stad, vader)
//          och sedan tillampaRekommendation(...)
//   3. Anropa tillstand({ typ: "laddar" }).
//   4. try: await hamtaVaderSenaste(stad). Är svaret gammalt (svar.gammal) ska du bara avsluta (return).
//      Annars tillstand({ typ: "klar", data: { stad: stad.namn, vader: svar.data } }).
//   5. catch (fel): tillstand({ typ: "fel", meddelande: ... }). Fel är unknown:
//        fel instanceof Error ? fel.message : String(fel)
async function laddaVader(): Promise<void> {
    const stad = hittaStad(stadVal.value)
    function tillstand(t: DataTillstand<VaderData>): void {
        vaderKnapp.disabled = t.typ === 'laddar'
        visaTillstand(vaderResultat, t, {
            vidForsokIgen: laddaVader,
            visaKlar: (container, klar) => {
                senastVader = klar.data.vader
                visaVader(container, klar.data.stad, klar.data.vader)
                tillampaRekommendation(klar.data.vader)
            }
        })
    }
    tillstand({ typ: 'laddar' })
    try {
        const svar = await hamtaVaderSenaste(stad)
        if (svar.gammal) {
            return
        }
        tillstand({ typ: 'klar', data: { stad: stad.namn, vader: svar.data } })
    } catch (fel) {
        tillstand({ typ: 'fel', meddelande: fel instanceof Error ? fel.message : String(fel) })
    }
}
vaderForm.addEventListener('submit', (handelse) => {
    handelse.preventDefault()
    laddaVader()
})
// TODO 4: Hämta vädret direkt när användaren byter stad: lyssna på "change" på stadVal och anropa laddaVader.
//   Då kan två anrop vara på väg samtidigt. Det är precis det senasteVinner är till för.
stadVal.addEventListener('change', () => {
    laddaVader()
})

// ---- Start ----
visaOrder(orderRef, order, meny)
laddaMenyn()
laddaVader()
