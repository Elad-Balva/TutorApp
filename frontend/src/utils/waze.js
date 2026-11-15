/** Opens Waze with a search query built from address + optional notes (floor/apt). */
export function buildWazeUrl(addressLine, locationNotes) {
  const parts = [addressLine?.trim(), locationNotes?.trim()].filter(Boolean);
  if (!parts.length) return null;
  return `https://waze.com/ul?q=${encodeURIComponent(parts.join(", "))}&navigate=yes`;
}
