// Dag 10: visa rekommendationen i sidan.

// Lägger klassen "rekommenderad" på de rättkort (article) i container vars data-id finns i listan ids,
// och tar bort den från alla andra. Anropas om och om igen, så den ska alltid ge rätt slutresultat.
// Tips: kort.dataset.id är en sträng. ids innehåller tal.
export function markeraRekommenderade(container: HTMLElement, ids: number[]): void {
  container.querySelectorAll<HTMLElement>("article[data-id]").forEach((kort) => {
    kort.classList.toggle("rekommenderad", ids.includes(Number(kort.dataset.id)));
  });
}

// Lägger till ett <p class="rekommendation"> med texten rubrik sist i container.
// Tömmer INTE container, och tar bort eventuell gammal .rekommendation först så att det aldrig blir två.
export function visaRekommendation(container: HTMLElement, rubrik: string): void {
  container.querySelector(".rekommendation")?.remove();
  const p = document.createElement("p");
  p.className = "rekommendation";
  p.textContent = rubrik;
  container.append(p);
}
