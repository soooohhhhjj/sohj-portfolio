type Options = {
  ellipsis?: string;
};

const defaultEllipsis = "...";

const doesOverflow = (el: HTMLElement) => el.scrollHeight > el.clientHeight + 1;

const setText = (el: HTMLElement, text: string) => {
  el.textContent = text;
};

export function truncateToFit(el: HTMLElement | null, fullText: string, options?: Options) {
  if (!el) return;
  const text = (fullText ?? "").trim();
  const ellipsis = options?.ellipsis ?? defaultEllipsis;

  setText(el, text);
  if (!doesOverflow(el)) return;

  // Binary search the max character count that fits.
  let lo = 0;
  let hi = text.length;
  let best = 0;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = `${text.slice(0, mid).trimEnd()}${ellipsis}`;
    setText(el, candidate);

    if (doesOverflow(el)) {
      hi = mid - 1;
    } else {
      best = mid;
      lo = mid + 1;
    }
  }

  // Prefer cutting on a word boundary, then "fill" into the next word until it hits the edge.
  const baseSlice = text.slice(0, best).trimEnd();
  const lastSpace = baseSlice.lastIndexOf(" ");

  if (lastSpace > 12) {
    const prefix = baseSlice.slice(0, lastSpace).trimEnd();
    const remainder = text.slice(lastSpace + 1);
    const nextWord = remainder.split(/\s+/)[0] ?? "";

    // Start from the word boundary, then add chars from the next word until we overflow.
    let filled = prefix;
    let i = 0;
    while (i < nextWord.length) {
      const nextCandidate = `${filled} ${nextWord.slice(0, i + 1)}${ellipsis}`;
      setText(el, nextCandidate);
      if (doesOverflow(el)) break;
      i++;
    }

    const finalCandidate =
      i === 0 ? `${prefix}${ellipsis}` : `${filled} ${nextWord.slice(0, i)}${ellipsis}`;
    setText(el, finalCandidate);
    if (!doesOverflow(el)) return;
  }

  setText(el, `${baseSlice}${ellipsis}`);
}

