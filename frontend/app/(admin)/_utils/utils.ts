export function formatIdDotLabel(id: number, ...parts: string[]) {
  return [id, ...parts].join(" · ");
}
