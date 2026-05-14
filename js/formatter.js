// ── Formatting & Numbering Logic ──

import { REPORT_SPEC as S } from '../templates/report_spec.js';

// ── Labels ──

export function getFigureLabel(chapterIdx, localIdx) {
  const ch = S.chapterNumerals[chapterIdx] || `${chapterIdx + 1}`;
  return `Figure ${ch}-${localIdx + 1}.`;
}

export function getTableLabel(chapterIdx, localIdx) {
  const ch = S.chapterRoman[chapterIdx] || `${chapterIdx + 1}`;
  return `Table ${ch}-${localIdx + 1}.`;
}

export function getEquationLabel(chapterIdx, localIdx) {
  return `(${chapterIdx + 1}.${localIdx + 1})`;
}

export function getChapterNumeral(idx) {
  return S.chapterNumerals[idx] || `${idx + 1}`;
}

export function getChapterRoman(idx) {
  return S.chapterRoman[idx] || `${idx + 1}`;
}

// ── Section Numbering ──

export function getFullSectionNumber(chapterIdx, sectionIdx, subSectionIdx) {
  const parts = [];
  if (sectionIdx !== undefined) parts.push(sectionIdx + 1);
  if (subSectionIdx !== undefined) parts.push(subSectionIdx + 1);
  return parts.join('.');
}

// ── Reference Number Assignment ──

export function assignReferenceNumbers(bodyText, references) {
  // Find [ref:xxx] markers in body text, order by position
  const refPattern = /\[ref:([^\]]+)\]/g;
  const seen = new Map();
  let match;
  while ((match = refPattern.exec(bodyText)) !== null) {
    const key = match[1].trim();
    if (!seen.has(key)) {
      seen.set(key, match.index);
    }
  }

  // Sort refs by first appearance
  const ordered = [];
  references.forEach((ref, idx) => {
    const pos = seen.get(ref.id);
    if (pos !== undefined) {
      ordered.push({ ...ref, number: null, _pos: pos, _origIdx: idx });
    }
  });
  ordered.sort((a, b) => a._pos - b._pos);
  ordered.forEach((r, i) => { r.number = i + 1; });

  // Assign numbers back
  const numbered = references.map((ref) => {
    const found = ordered.find(o => o._origIdx === references.indexOf(ref));
    return { ...ref, number: found ? found.number : null };
  });

  return { numbered, ordered };
}

// ── Format Reference String ──

export function formatReference(ref, number) {
  const num = number !== undefined ? number : ref.number;
  const parts = [];
  parts.push(`[${num}]`);
  if (ref.authors) parts.push(` ${ref.authors}`);
  if (ref.year) parts.push(` (${ref.year}).`);
  if (ref.title) parts.push(` ${ref.title}.`);
  if (ref.journal) parts.push(` ${ref.journal},`);
  if (ref.volume) {
    parts.push(` ${ref.volume}`);
    if (ref.issue) parts.push(`(${ref.issue}),`);
  }
  if (ref.page) parts.push(` ${ref.page}.`);
  if (ref.doi) parts.push(` ${ref.doi}`);
  return parts.join('');
}

// ── Build TOC ──

export function buildTOC(state) {
  const lines = [];

  lines.push({ text: 'CONTENTS', level: 'toc-heading', page: '' });
  lines.push({ text: '', level: 'spacer', page: '' });

  // LIST OF TABLES
  const tables = state.tables || [];
  const figures = state.figures || [];
  if (tables.length > 0) {
    lines.push({ text: 'LIST OF TABLES', level: 'toc1', page: 'iii' });
    tables.forEach(t => {
      const label = getTableLabel(t.chapterIdx, t.localIdx);
      lines.push({ text: `${label} ${t.caption || ''}`, level: 'toc-figure', page: '' });
    });
  }
  if (figures.length > 0) {
    lines.push({ text: 'LIST OF FIGURES', level: 'toc1', page: 'iv' });
    figures.forEach(f => {
      const label = getFigureLabel(f.chapterIdx, f.localIdx);
      lines.push({ text: `${label} ${f.caption || ''}`, level: 'toc-figure', page: '' });
    });
  }

  // Chapters
  let pageNum = 1;
  (state.chapters || []).forEach((ch, ci) => {
    const chLabel = `${S.chapterNumerals[ci]}. ${ch.title || ''}`;
    lines.push({ text: chLabel, level: 'toc1', page: String(pageNum) });
    pageNum += estimatePages(ch);
    (ch.sections || []).forEach((sec, si) => {
      const secLabel = `${si + 1}. ${sec.title || ''}`;
      lines.push({ text: secLabel, level: 'toc2', page: String(pageNum) });
      pageNum += 1;
      (sec.subSections || []).forEach((sub, ssi) => {
        const subLabel = `${si + 1}.${ssi + 1} ${sub.title || ''}`;
        lines.push({ text: subLabel, level: 'toc3', page: String(pageNum) });
        pageNum += 1;
      });
    });
  });

  // Back matter
  lines.push({ text: 'REFERENCES', level: 'toc1', page: String(pageNum) });
  lines.push({ text: '국 문 초 록', level: 'toc1', page: '' });
  lines.push({ text: 'ABSTRACT', level: 'toc1', page: '' });
  lines.push({ text: 'APPENDIX', level: 'toc1', page: '' });
  lines.push({ text: 'ACKNOWLEDGEMENTS', level: 'toc1', page: '' });

  return lines;
}

function estimatePages(chapter) {
  let lines = 5; // Title + spacing
  (chapter.sections || []).forEach(() => {
    lines += 10; // Rough: section heading + ~9 lines of content
  });
  return Math.max(1, Math.ceil(lines / 45));
}

// ── Apply Reference Markers ──

export function applyReferenceMarkers(bodyText, refMapping) {
  let result = bodyText;
  for (const [key, num] of Object.entries(refMapping)) {
    if (num >= 0) {
      const regex = new RegExp(`\\[ref:${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
      result = result.replace(regex, `[${num}]`);
    }
  }
  return result;
}

// ── Validate Formatting ──

export function validateFormatting(state) {
  const issues = [];

  // Check chapter titles exist
  state.chapters.forEach((ch, i) => {
    if (!ch.title || ch.title.trim() === '') {
      issues.push({ type: 'heading', location: `Chapter ${S.chapterNumerals[i]}`, description: 'Chapter title is empty', severity: 'warning' });
    }
  });

  // Check references have numbers assigned
  state.references.forEach((ref, i) => {
    if (ref.number === null || ref.number === undefined) {
      issues.push({ type: 'reference', location: `Reference #${i + 1}`, description: `Reference "${ref.id}" not cited in body text`, severity: 'warning' });
    }
  });

  // Check abstracts have keywords
  if (state.abstracts.korean.body && !state.abstracts.korean.keywords) {
    issues.push({ type: 'keyword', location: '국문초록', description: 'Korean abstract missing keywords', severity: 'error' });
  }
  if (state.abstracts.english.body && !state.abstracts.english.keywords) {
    issues.push({ type: 'keyword', location: 'ABSTRACT', description: 'English abstract missing keywords', severity: 'error' });
  }

  return issues;
}

// ── Generate Markdown Export ──

export function generateMarkdown(state) {
  const lines = [];

  // Cover
  lines.push(`# ${state.cover.title || 'Research Report'}`);
  if (state.cover.subtitle) lines.push(`### ${state.cover.subtitle}`);
  lines.push('');
  lines.push(`${state.cover.studentName || ''}`);
  lines.push(`${state.cover.date || ''}`);
  lines.push(`${state.cover.major || ''}`);
  lines.push(`${state.cover.school || ''}`);
  lines.push('');

  // TOC
  const toc = buildTOC(state);
  lines.push('## CONTENTS');
  toc.forEach(line => {
    if (line.level === 'toc-heading') return;
    const indent = line.level === 'toc3' ? '        ' : line.level === 'toc2' ? '    ' : '';
    lines.push(`${indent}${line.text}`);
  });
  lines.push('');

  // Chapters
  state.chapters.forEach((ch, ci) => {
    lines.push(`# ${S.chapterNumerals[ci]}. ${ch.title || ''}`);
    lines.push('');

    // Chapter figures
    const chFigures = state.figures.filter(f => f.chapterIdx === ci);
    const chTables = state.tables.filter(t => t.chapterIdx === ci);
    const chEquations = state.equations.filter(e => e.chapterIdx === ci);

    ch.sections.forEach((sec, si) => {
      lines.push(`## ${si + 1}. ${sec.title || ''}`);
      lines.push('');
      if (sec.content) lines.push(sec.content);
      lines.push('');

      sec.subSections.forEach((sub, ssi) => {
        lines.push(`### ${si + 1}.${ssi + 1} ${sub.title || ''}`);
        lines.push('');
        if (sub.content) lines.push(sub.content);
        lines.push('');
      });
    });

    // Chapter figures & tables
    chTables.forEach(t => {
      lines.push(`*${getTableLabel(ci, t.localIdx)} ${t.caption || ''}*`);
      lines.push('');
    });
    chFigures.forEach(f => {
      lines.push(`*${getFigureLabel(ci, f.localIdx)} ${f.caption || ''}*`);
      lines.push('');
    });
    chEquations.forEach(e => {
      lines.push(`$$ ${e.latex} \\qquad ${getEquationLabel(ci, e.localIdx)} $$`);
      lines.push('');
    });
  });

  // References
  lines.push('# REFERENCES');
  lines.push('');
  const { numbered } = assignReferenceNumbers(getAllBodyText(state), state.references);
  numbered.filter(r => r.number).sort((a, b) => a.number - b.number).forEach(ref => {
    lines.push(formatReference(ref));
    lines.push('');
  });

  // Abstracts
  if (state.abstracts.korean.body) {
    lines.push('# 국 문 초 록');
    lines.push('');
    lines.push(state.abstracts.korean.body);
    if (state.abstracts.korean.keywords) lines.push(`**Keywords:** ${state.abstracts.korean.keywords}`);
    lines.push('');
  }
  if (state.abstracts.english.body) {
    lines.push('# ABSTRACT');
    lines.push('');
    lines.push(state.abstracts.english.body);
    if (state.abstracts.english.keywords) lines.push(`**Keywords:** ${state.abstracts.english.keywords}`);
    lines.push('');
  }

  // Appendix
  if (state.appendix.length > 0) {
    lines.push('# APPENDIX');
    state.appendix.forEach(app => {
      lines.push('');
      if (app.requires) lines.push(`**Requires:** \`${app.requires}\``);
      if (app.imports) lines.push('```python\n' + app.imports + '\n```');
      if (app.code) lines.push('```python\n' + app.code + '\n```');
    });
  }

  // Acknowledgements
  if (state.acknowledgements) {
    lines.push('# ACKNOWLEDGEMENTS');
    lines.push('');
    lines.push(state.acknowledgements);
  }

  return lines.join('\n');
}

function getAllBodyText(state) {
  let text = '';
  state.chapters.forEach(ch => {
    ch.sections.forEach(sec => {
      text += sec.content + '\n';
      sec.subSections.forEach(sub => { text += sub.content + '\n'; });
    });
  });
  return text;
}
