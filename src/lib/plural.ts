/** Русское склонение по числу: 1 изделие, 2 изделия, 5 изделий. */
export function pluralItems(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "изделие";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "изделия";
  return "изделий";
}
