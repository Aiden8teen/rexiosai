/** Keep complete words together, including their original punctuation/whitespace. */
export function nextWordPrefix(current: string, target: string, words: number, complete = false): string {
  if (complete && words === Infinity) return target;
  const start = target.startsWith(current) ? current.length : 0;
  const remaining = target.slice(start);
  const chunks = remaining.match(/\s*\S+\s*/gu) || [];
  if (!complete && chunks.length && !/\s$/u.test(chunks.at(-1)!)) chunks.pop();
  return target.slice(0, start) + chunks.slice(0, words).join('');
}
