// ── CrossRef API (Free, no key required) ──

export async function fetchByDOI(doi) {
  const cleaned = doi.replace(/^https?:\/\/doi\.org\//i, '').trim();
  const url = `https://api.crossref.org/works/${encodeURIComponent(cleaned)}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`DOI not found: ${res.status}`);

  const { message } = await res.json();

  const authors = (message.author || [])
    .map(a => {
      const family = a.family || '';
      const given = a.given || '';
      const initial = given ? given.split(' ').map(s => s.charAt(0) + '.').join(' ') : '';
      return family ? `${family}, ${initial}` : '';
    })
    .filter(Boolean)
    .join(', ');

  const year    = message.issued?.['date-parts']?.[0]?.[0] || '';
  const title   = (message.title || [])[0] || '';
  const journal = (message['container-title'] || [])[0] || '';
  const volume  = message.volume || '';
  const issue   = message.issue || '';
  const page    = message.page || '';
  const doiUrl  = `https://doi.org/${message.DOI}`;

  return { authors, year, title, journal, volume, issue, page, doi: doiUrl };
}

export async function batchFetchDOI(doiList) {
  const results = [];
  for (const doi of doiList) {
    const trimmed = doi.trim();
    if (!trimmed) continue;
    try {
      const data = await fetchByDOI(trimmed);
      results.push({ success: true, doi: trimmed, ...data });
    } catch (e) {
      results.push({ success: false, doi: trimmed, error: e.message });
    }
  }
  return results;
}

export function parseBibTeX(bibtex) {
  // Naive BibTeX parser
  const result = {
    authors: '', year: '', title: '', journal: '', volume: '', issue: '', page: '', doi: '',
  };

  const typeMatch = bibtex.match(/@\w+\s*\{[^,]*,\s*/);
  if (!typeMatch) return result;
  const body = bibtex.slice(typeMatch[0].length);

  const fields = {};
  const fieldRegex = /(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let match;
  while ((match = fieldRegex.exec(body)) !== null) {
    fields[match[1].toLowerCase()] = match[2].replace(/\s+/g, ' ').trim();
  }

  // Parse authors
  if (fields.author) {
    result.authors = fields.author.split(/\s+and\s+/).map(a => {
      const parts = a.trim().split(/,/);
      if (parts.length >= 2) {
        const last = parts[0].trim();
        const firsts = parts.slice(1).join(' ').trim();
        return `${last}, ${firsts.split(/\s+/).map(s => s.charAt(0) + '.').join(' ')}`;
      }
      const words = a.trim().split(/\s+/);
      if (words.length >= 2) {
        const last = words.pop();
        return `${last}, ${words.map(w => w.charAt(0) + '.').join(' ')}`;
      }
      return a.trim();
    }).join(', ');
  }

  result.year    = fields.year || '';
  result.title   = fields.title || '';
  result.journal = fields.journal || fields.booktitle || '';
  result.volume  = fields.volume || '';
  result.issue   = fields.number || fields.issue || '';
  result.page    = fields.pages || '';
  result.doi     = fields.doi || '';

  return result;
}
