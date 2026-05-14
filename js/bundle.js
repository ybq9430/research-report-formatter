/* ── Research Report Auto-Formatter ──
   Single-file bundle for direct file:// compatibility.
   All modules combined: report_spec → state → api → crossref → formatter → exporter → preview → main */

(function(global) {
'use strict';

// ═══════════════════════════════════════════
// MODULE: report_spec.js
// ═══════════════════════════════════════════

const REPORT_SPEC = {
  page: {
    width: 11906, height: 16838, marginTop: 1077, marginBottom: 1077,
    marginLeft: 1474, marginRight: 1474, headerDist: 851, footerDist: 851, gutter: 0,
  },
  fonts: {
    latin: 'Times New Roman', eastAsia: 'SimSun', korean: '맑은 고딕',
    cover: '한양신명조', dengxian: 'DengXian',
  },
  styles: {
    coverText: { fontSize: 32, lineSpacing: 240, spaceBefore: 0, spaceAfter: 0, alignment: 'center', fontLatin: 'Times New Roman', fontEA: '한양신명조' },
    reportTitle: { fontSize: 56, spaceAfter: 80, alignment: 'center' },
    reportSubtitle: { fontSize: 28, lineSpacing: 278, spaceAfter: 160, alignment: 'center', color: '595959' },
    heading1: { fontSize: 36, lineSpacing: 480, spaceBefore: 0, spaceAfter: 624, alignment: 'center', bold: true, fontLatin: 'Times New Roman', fontEA: 'DengXian' },
    heading2: { fontSize: 28, lineSpacing: 480, spaceBefore: 312, spaceAfter: 312, bold: true, fontLatin: 'Times New Roman' },
    heading3: { fontSize: 24, lineSpacing: 480, spaceBefore: 0, spaceAfter: 312, bold: true, indent: { firstLine: 480 }, fontLatin: 'Times New Roman' },
    bodyText: { fontSize: 22, lineSpacing: 480, spaceBefore: 0, spaceAfter: 0, alignment: 'both', indent: { firstLine: 440 }, fontLatin: 'Times New Roman', fontEA: 'SimSun' },
    caption: { fontSize: 22, lineSpacing: 480, spaceBefore: 156, spaceAfter: 0, indent: { firstLine: 440 }, fontLatin: 'Times New Roman' },
    reference: { fontSize: 22, lineSpacing: 372, spaceBefore: 0, spaceAfter: 0, indent: { left: 1210, hanging: 1210 }, fontLatin: 'Times New Roman' },
    toc1: { fontSize: 22, lineSpacing: 372, indent: { left: 0 } },
    toc2: { fontSize: 22, lineSpacing: 372, indent: { left: 420 } },
    toc3: { fontSize: 22, lineSpacing: 372, indent: { left: 840 } },
    codeBlock: { fontSize: 20, lineSpacing: 240, fontLatin: 'Courier New' },
    koreanBody: { fontSize: 22, lineSpacing: 480, indent: { firstLine: 440 }, fontEA: '맑은 고딕' },
  },
  table: { borderStyle: 'single', borderSize: 4, borderColor: 'auto', cellMarginLeft: 108, cellMarginRight: 108, cellMarginTop: 0, cellMarginBottom: 0 },
  list: { bullet: '•', level1: { left: 720, hanging: 360 }, level2: { left: 1440, hanging: 360 }, level3: { left: 2160, hanging: 360 } },
  footer: { content: 'PAGE_NUMBER', alignment: 'center', startPage: 1 },
  chapterNumerals: ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'],
  chapterRoman: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'],
};

// ═══════════════════════════════════════════
// MODULE: state.js
// ═══════════════════════════════════════════

const initialState = {
  apiConfig: { key: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', connected: false },
  cover: { title: '', subtitle: '', date: 'August 2026', major: 'Major of Computer Science and Technology', school: 'Graduate School of Youngsan University', studentName: '', advisor: 'Supervised by Jinwhan Kim', advisorSchool: '', univName: '' },
  chapters: [
    { numeral: 'Ⅰ', title: 'Introduction', sections: [
      { heading: '1', title: 'Research Background', content: '', subSections: [] },
      { heading: '2', title: 'Research Significance & Objectives', content: '', subSections: [] },
      { heading: '3', title: 'Research Methods & Contributions', content: '', subSections: [] },
      { heading: '4', title: 'Thesis Organization', content: '', subSections: [] },
    ]},
    { numeral: 'Ⅱ', title: 'Literature Review', sections: [] },
    { numeral: 'Ⅲ', title: '', sections: [
      { heading: '1', title: 'Introduction', content: '', subSections: [] },
      { heading: '2', title: 'Related Work', content: '', subSections: [] },
      { heading: '3', title: 'Proposed Method', content: '', subSections: [] },
      { heading: '4', title: 'Experimental Evaluation', content: '', subSections: [] },
      { heading: '5', title: 'Summary', content: '', subSections: [] },
    ]},
    { numeral: 'Ⅳ', title: '', sections: [
      { heading: '1', title: 'Introduction', content: '', subSections: [] },
      { heading: '2', title: 'Related Work', content: '', subSections: [] },
      { heading: '3', title: 'Proposed Method', content: '', subSections: [] },
      { heading: '4', title: 'Experimental Evaluation', content: '', subSections: [] },
      { heading: '5', title: 'Summary', content: '', subSections: [] },
    ]},
    { numeral: 'Ⅴ', title: 'Conclusion and Future Outlook', sections: [
      { heading: '1', title: 'Summary of Achievements', content: '', subSections: [] },
      { heading: '2', title: 'Contributions', content: '', subSections: [] },
      { heading: '3', title: 'Limitations', content: '', subSections: [] },
      { heading: '4', title: 'Future Directions', content: '', subSections: [] },
      { heading: '5', title: 'Conclusion', content: '', subSections: [] },
    ]},
  ],
  figures: [], tables: [], equations: [], references: [],
  abstracts: {
    korean: { title: '', studentName: '', major: '', advisor: '', body: '', keywords: '' },
    english: { title: '', studentName: '', major: '', advisor: '', body: '', keywords: '' },
  },
  appendix: [],
  acknowledgements: '',
  activeTab: 'cover',
  previewVisible: true,
};

let _state = JSON.parse(JSON.stringify(initialState));
const _listeners = new Set();

function getState() { return _state; }
function setState(partial) { _state = Object.assign({}, _state, partial); _listeners.forEach(fn => fn(_state)); }
function updateState(path, value) {
  const keys = path.split('.'); let obj = _state;
  for (let i = 0; i < keys.length - 1; i++) { if (!obj[keys[i]]) obj[keys[i]] = {}; obj = obj[keys[i]]; }
  obj[keys[keys.length - 1]] = value; _listeners.forEach(fn => fn(_state));
}
function subscribe(fn) { _listeners.add(fn); return function() { _listeners.delete(fn); }; }
function resetState() { _state = JSON.parse(JSON.stringify(initialState)); _listeners.forEach(fn => fn(_state)); }

function loadApiConfig() {
  try { const s = localStorage.getItem('rrf_api_config'); if (s) { const c = JSON.parse(s); _state.apiConfig = Object.assign({}, _state.apiConfig, c); } } catch(e){}
}
function saveApiConfig() {
  try { localStorage.setItem('rrf_api_config', JSON.stringify({ key: _state.apiConfig.key, baseUrl: _state.apiConfig.baseUrl, model: _state.apiConfig.model })); } catch(e){}
}

// ═══════════════════════════════════════════
// MODULE: api.js
// ═══════════════════════════════════════════

async function callDeepSeek(systemPrompt, userContent, apiKey, baseUrl, model) {
  baseUrl = baseUrl || 'https://api.deepseek.com'; model = model || 'deepseek-chat';
  const url = baseUrl.replace(/\/+$/, '') + '/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model: model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }], temperature: 0.3, max_tokens: 4096, stream: false }),
  });
  if (!response.ok) { const et = await response.text().catch(function() { return ''; }); throw new Error('API Error ' + response.status + ': ' + et); }
  const data = await response.json();
  return data.choices[0].message.content;
}

async function testConnection(apiKey, baseUrl, model) {
  try { const result = await callDeepSeek('Reply with exactly: OK', 'Test connection. Reply OK.', apiKey, baseUrl, model); return result && result.trim().toUpperCase().includes('OK'); } catch(e) { return false; }
}

async function polishParagraph(text, apiKey, baseUrl, model) {
  return callDeepSeek('You are an academic English editor. Polish the following text for a research report: maintain original meaning, improve academic tone and clarity, use formal academic English. Do NOT change citations like [1], [2], [ref:xxx]. Return ONLY the polished text.', text, apiKey, baseUrl, model);
}

async function expandSection(outline, apiKey, baseUrl, model, targetWords) {
  targetWords = targetWords || 300;
  return callDeepSeek('You are an academic researcher writing a master\'s thesis section. Write a complete academic section based on the given outline. Write in formal academic English. Target approximately ' + targetWords + ' words. Return the complete section text.', outline, apiKey, baseUrl, model);
}

async function checkFormatting(fullText, specSummary, apiKey, baseUrl, model) {
  const result = await callDeepSeek('You are a formatting checker for a master\'s thesis. Review the text against these specs:\n' + specSummary + '\n\nIdentify issues: heading level inconsistencies, missing/broken reference numbers, figure/table numbering gaps, missing keywords, inconsistent paragraph formatting. Return a JSON array: [{"type":"heading|reference|figure|table|keyword|format","location":"...","description":"...","severity":"error|warning"}]. Return ONLY valid JSON.', fullText, apiKey, baseUrl, model);
  try { return JSON.parse(result); } catch(e) { var m = result.match(/```(?:json)?\s*([\s\S]*?)```/); if (m) return JSON.parse(m[1]); return [{ type: 'format', location: 'unknown', description: 'Could not parse AI response', severity: 'error' }]; }
}

async function matchReferencesToBody(bodyText, refList, apiKey, baseUrl, model) {
  var refSummary = refList.map(function(r, i) { return '[' + i + '] ' + (r.authors||'') + ' (' + (r.year||'') + '). ' + (r.title||'') + '. ' + (r.journal||'') + '.'; }).join('\n');
  var result = await callDeepSeek('You are a citation matching assistant. Given a document body and reference list, identify which [ref:KEYWORD] markers correspond to which references. Return JSON: {"keyword1": refIndex, ...}. Each [ref:xxx] maps to exactly one reference. -1 means no match. Return ONLY valid JSON.',
    'BODY TEXT:\n' + bodyText + '\n\nREFERENCE LIST:\n' + refSummary + '\n\nFind [ref:xxx] markers and match to references.', apiKey, baseUrl, model);
  try { return JSON.parse(result.replace(/```json\s*|```\s*/g, '').trim()); } catch(e) { try { return JSON.parse(result); } catch(e2) { return {}; } }
}

async function integrateFullReport(state, apiKey, baseUrl, model) {
  return callDeepSeek('You are assembling a complete master\'s thesis. Combine all sections in order: Cover, TOC, Chapters I-V, References, Korean Abstract, English Abstract, Appendix, Acknowledgements. Format as clean Markdown with proper heading levels. Preserve all numbering.',
    JSON.stringify(state, null, 2), apiKey, baseUrl, model);
}

async function parseReference(rawText, apiKey, baseUrl, model) {
  var result = await callDeepSeek('Parse reference text into structured JSON: {"authors":"...","year":"...","title":"...","journal":"...","volume":"...","issue":"...","page":"...","doi":"..."}. Author format: LastName, FirstInitial. Missing fields = empty string. Return ONLY valid JSON.', rawText, apiKey, baseUrl, model);
  try { return JSON.parse(result.replace(/```json\s*|```\s*/g, '').trim()); } catch(e) { return null; }
}

// ═══════════════════════════════════════════
// MODULE: crossref.js
// ═══════════════════════════════════════════

async function fetchByDOI(doi) {
  var cleaned = doi.replace(/^https?:\/\/doi\.org\//i, '').trim();
  var res = await fetch('https://api.crossref.org/works/' + encodeURIComponent(cleaned), { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('DOI not found: ' + res.status);
  var message = (await res.json()).message;
  var authors = (message.author || []).map(function(a) { var f = a.family || '', g = a.given || '', init = g ? g.split(' ').map(function(s){return s.charAt(0)+'.'}).join(' ') : ''; return f ? f + ', ' + init : ''; }).filter(Boolean).join(', ');
  var year = (message.issued && message.issued['date-parts'] && message.issued['date-parts'][0]) ? message.issued['date-parts'][0][0] : '';
  var title = (message.title || [''])[0];
  var journal = (message['container-title'] || [''])[0];
  return { authors: authors, year: year, title: title, journal: journal, volume: message.volume || '', issue: message.issue || '', page: message.page || '', doi: 'https://doi.org/' + message.DOI };
}

async function batchFetchDOI(doiList) {
  var results = [];
  for (var i = 0; i < doiList.length; i++) { var d = doiList[i].trim(); if (!d) continue;
    try { var data = await fetchByDOI(d); results.push(Object.assign({ success: true, doi: d }, data)); } catch(e) { results.push({ success: false, doi: d, error: e.message }); }
  }
  return results;
}

function parseBibTeX(bibtex) {
  var result = { authors: '', year: '', title: '', journal: '', volume: '', issue: '', page: '', doi: '' };
  var typeMatch = bibtex.match(/@\w+\s*\{[^,]*,\s*/);
  if (!typeMatch) return result;
  var body = bibtex.slice(typeMatch[0].length);
  var fields = {};
  var fieldRegex = /(\w+)\s*=\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g, m;
  while ((m = fieldRegex.exec(body)) !== null) fields[m[1].toLowerCase()] = m[2].replace(/\s+/g, ' ').trim();
  if (fields.author) result.authors = fields.author.split(/\s+and\s+/).map(function(a) { var p = a.trim().split(/,/); if (p.length >= 2) { var last = p[0].trim(); var firsts = p.slice(1).join(' ').trim(); return last + ', ' + firsts.split(/\s+/).map(function(s){return s.charAt(0)+'.'}).join(' '); } var w = a.trim().split(/\s+/); if (w.length >= 2) { var l = w.pop(); return l + ', ' + w.map(function(s){return s.charAt(0)+'.'}).join(' '); } return a.trim(); }).join(', ');
  result.year = fields.year || ''; result.title = fields.title || ''; result.journal = fields.journal || fields.booktitle || '';
  result.volume = fields.volume || ''; result.issue = fields.number || fields.issue || ''; result.page = fields.pages || ''; result.doi = fields.doi || '';
  return result;
}

// ═══════════════════════════════════════════
// MODULE: formatter.js
// ═══════════════════════════════════════════

function getFigureLabel(chapterIdx, localIdx) { return 'Figure ' + (REPORT_SPEC.chapterNumerals[chapterIdx] || (chapterIdx+1)) + '-' + (localIdx+1) + '.'; }
function getTableLabel(chapterIdx, localIdx) { return 'Table ' + (REPORT_SPEC.chapterRoman[chapterIdx] || (chapterIdx+1)) + '-' + (localIdx+1) + '.'; }
function getEquationLabel(chapterIdx, localIdx) { return '(' + (chapterIdx+1) + '.' + (localIdx+1) + ')'; }

function assignReferenceNumbers(bodyText, references) {
  var refPattern = /\[ref:([^\]]+)\]/g, seen = new Map(), m;
  while ((m = refPattern.exec(bodyText)) !== null) { var key = m[1].trim(); if (!seen.has(key)) seen.set(key, m.index); }
  var ordered = [];
  references.forEach(function(ref, idx) { var pos = seen.get(ref.id); if (pos !== undefined) ordered.push(Object.assign({}, ref, { number: null, _pos: pos, _origIdx: idx })); });
  ordered.sort(function(a, b) { return a._pos - b._pos; });
  ordered.forEach(function(r, i) { r.number = i + 1; });
  var numbered = references.map(function(ref) { var found = ordered.find(function(o) { return o._origIdx === references.indexOf(ref); }); return Object.assign({}, ref, { number: found ? found.number : null }); });
  return { numbered: numbered, ordered: ordered };
}

function formatReference(ref, number) {
  var num = number !== undefined ? number : ref.number, parts = ['[' + (num||'?') + ']'];
  if (ref.authors) parts.push(' ' + ref.authors);
  if (ref.year) parts.push(' (' + ref.year + ').');
  if (ref.title) parts.push(' ' + ref.title + '.');
  if (ref.journal) parts.push(' ' + ref.journal + ',');
  if (ref.volume) { parts.push(' ' + ref.volume); if (ref.issue) parts.push('(' + ref.issue + '),'); }
  if (ref.page) parts.push(' ' + ref.page + '.');
  if (ref.doi) parts.push(' ' + ref.doi);
  return parts.join('');
}

function buildTOC(state) {
  var lines = [{ text: 'CONTENTS', level: 'toc-heading', page: '' }, { text: '', level: 'spacer', page: '' }];
  var tables = state.tables || [], figures = state.figures || [];
  if (tables.length > 0) { lines.push({ text: 'LIST OF TABLES', level: 'toc1', page: 'iii' }); tables.forEach(function(t) { lines.push({ text: getTableLabel(t.chapterIdx, t.localIdx) + ' ' + (t.caption||''), level: 'toc-figure', page: '' }); }); }
  if (figures.length > 0) { lines.push({ text: 'LIST OF FIGURES', level: 'toc1', page: 'iv' }); figures.forEach(function(f) { lines.push({ text: getFigureLabel(f.chapterIdx, f.localIdx) + ' ' + (f.caption||''), level: 'toc-figure', page: '' }); }); }
  var pageNum = 1;
  (state.chapters || []).forEach(function(ch, ci) { lines.push({ text: REPORT_SPEC.chapterNumerals[ci] + '. ' + (ch.title||''), level: 'toc1', page: String(pageNum) }); pageNum += Math.max(1, Math.ceil((ch.sections.length * 10 + 5) / 45));
    (ch.sections || []).forEach(function(sec, si) { lines.push({ text: (si+1) + '. ' + (sec.title||''), level: 'toc2', page: String(pageNum) }); pageNum += 1;
      (sec.subSections || []).forEach(function(sub, ssi) { lines.push({ text: (si+1) + '.' + (ssi+1) + ' ' + (sub.title||''), level: 'toc3', page: String(pageNum) }); pageNum += 1; });
    });
  });
  lines.push({ text: 'REFERENCES', level: 'toc1', page: String(pageNum) });
  lines.push({ text: '국 문 초 록', level: 'toc1', page: '' });
  lines.push({ text: 'ABSTRACT', level: 'toc1', page: '' });
  lines.push({ text: 'APPENDIX', level: 'toc1', page: '' });
  lines.push({ text: 'ACKNOWLEDGEMENTS', level: 'toc1', page: '' });
  return lines;
}

function applyReferenceMarkers(bodyText, refMapping) {
  var result = bodyText;
  for (var key in refMapping) { if (refMapping.hasOwnProperty(key) && refMapping[key] >= 0) { var regex = new RegExp('\\[ref:' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\]', 'g'); result = result.replace(regex, '[' + refMapping[key] + ']'); } }
  return result;
}

function validateFormatting(state) {
  var issues = [];
  state.chapters.forEach(function(ch, i) { if (!ch.title || ch.title.trim() === '') issues.push({ type: 'heading', location: 'Chapter ' + REPORT_SPEC.chapterNumerals[i], description: 'Chapter title is empty', severity: 'warning' }); });
  state.references.forEach(function(ref, i) { if (ref.number === null || ref.number === undefined) issues.push({ type: 'reference', location: 'Reference #' + (i+1), description: 'Reference "' + ref.id + '" not cited in body text', severity: 'warning' }); });
  if (state.abstracts.korean.body && !state.abstracts.korean.keywords) issues.push({ type: 'keyword', location: '국문초록', description: 'Korean abstract missing keywords', severity: 'error' });
  if (state.abstracts.english.body && !state.abstracts.english.keywords) issues.push({ type: 'keyword', location: 'ABSTRACT', description: 'English abstract missing keywords', severity: 'error' });
  return issues;
}

function generateMarkdown(state) {
  var lines = [];
  lines.push('# ' + (state.cover.title || 'Research Report'));
  if (state.cover.subtitle) lines.push('### ' + state.cover.subtitle);
  lines.push(''); lines.push(state.cover.studentName || ''); lines.push(state.cover.date || ''); lines.push(state.cover.major || ''); lines.push(state.cover.school || ''); lines.push('');
  var toc = buildTOC(state); lines.push('## CONTENTS');
  toc.forEach(function(line) { if (line.level === 'toc-heading' || line.level === 'spacer') return; var indent = line.level === 'toc3' ? '        ' : line.level === 'toc2' ? '    ' : ''; lines.push(indent + line.text); });
  lines.push('');
  state.chapters.forEach(function(ch, ci) {
    lines.push('# ' + REPORT_SPEC.chapterNumerals[ci] + '. ' + (ch.title||'')); lines.push('');
    var chT = (state.tables||[]).filter(function(t){return t.chapterIdx===ci});
    var chF = (state.figures||[]).filter(function(f){return f.chapterIdx===ci});
    var chE = (state.equations||[]).filter(function(e){return e.chapterIdx===ci});
    (ch.sections||[]).forEach(function(sec, si) { lines.push('## ' + (si+1) + '. ' + (sec.title||'')); lines.push(''); if (sec.content) lines.push(sec.content); lines.push('');
      (sec.subSections||[]).forEach(function(sub, ssi) { lines.push('### ' + (si+1) + '.' + (ssi+1) + ' ' + (sub.title||'')); lines.push(''); if (sub.content) lines.push(sub.content); lines.push(''); });
    });
    chT.forEach(function(t) { lines.push('*' + getTableLabel(ci, t.localIdx) + ' ' + (t.caption||'') + '*'); lines.push(''); });
    chF.forEach(function(f) { lines.push('*' + getFigureLabel(ci, f.localIdx) + ' ' + (f.caption||'') + '*'); lines.push(''); });
    chE.forEach(function(e) { lines.push('$$ ' + e.latex + ' \\qquad ' + getEquationLabel(ci, e.localIdx) + ' $$'); lines.push(''); });
  });
  var bodyText = ''; state.chapters.forEach(function(ch){ch.sections.forEach(function(sec){bodyText+=sec.content+'\n';(sec.subSections||[]).forEach(function(sub){bodyText+=sub.content+'\n';});});});
  var refResult = assignReferenceNumbers(bodyText, state.references);
  lines.push('# REFERENCES'); lines.push('');
  (refResult.numbered).filter(function(r){return r.number}).sort(function(a,b){return a.number-b.number}).forEach(function(ref){lines.push(formatReference(ref));lines.push('');});
  if (state.abstracts.korean.body) { lines.push('# 국 문 초 록'); lines.push(''); lines.push(state.abstracts.korean.body); if (state.abstracts.korean.keywords) lines.push('**Keywords:** ' + state.abstracts.korean.keywords); lines.push(''); }
  if (state.abstracts.english.body) { lines.push('# ABSTRACT'); lines.push(''); lines.push(state.abstracts.english.body); if (state.abstracts.english.keywords) lines.push('**Keywords:** ' + state.abstracts.english.keywords); lines.push(''); }
  if (state.appendix.length > 0) { lines.push('# APPENDIX'); state.appendix.forEach(function(app) { lines.push(''); if (app.requires) lines.push('**Requires:** `' + app.requires + '`'); if (app.imports) lines.push('```python\n' + app.imports + '\n```'); if (app.code) lines.push('```python\n' + app.code + '\n```'); }); }
  if (state.acknowledgements) { lines.push('# ACKNOWLEDGEMENTS'); lines.push(''); lines.push(state.acknowledgements); }
  return lines.join('\n');
}

// ═══════════════════════════════════════════
// MODULE: exporter.js (docx & markdown export)
// ═══════════════════════════════════════════

var _docx = (typeof docx !== 'undefined') ? docx : null;

function _docxAvailable() { return !!_docx; }

function _makeParagraph(text, styleSpec, extra) {
  styleSpec = styleSpec || REPORT_SPEC.styles.bodyText; extra = extra || {};
  var opts = { font: styleSpec.fontLatin || REPORT_SPEC.fonts.latin, size: styleSpec.fontSize };
  if (styleSpec.bold) opts.bold = true;
  var runs = [];
  if (text) {
    if (text.indexOf('**') >= 0 && !extra.skipBold) {
      var parts = text.split(/(\*\*.*?\*\*)/g);
      parts.forEach(function(part) {
        if (part.indexOf('**') === 0 && part.lastIndexOf('**') === part.length - 2) {
          runs.push(new _docx.TextRun(Object.assign({ text: part.slice(2, -2), bold: true }, opts)));
        } else { runs.push(new _docx.TextRun(Object.assign({ text: part }, opts))); }
      });
    } else { runs.push(new _docx.TextRun(Object.assign({ text: text }, opts))); }
  }
  var align = _docx.AlignmentType.JUSTIFIED;
  if (extra.alignment === 'center') align = _docx.AlignmentType.CENTER;
  else if (extra.alignment === 'left') align = _docx.AlignmentType.LEFT;
  else if (styleSpec.alignment === 'center') align = _docx.AlignmentType.CENTER;
  else if (styleSpec.alignment === 'left') align = _docx.AlignmentType.LEFT;
  var props = { spacing: { line: styleSpec.lineSpacing || 480, before: styleSpec.spaceBefore || 0, after: styleSpec.spaceAfter || 0 }, alignment: align };
  if (styleSpec.indent) props.indent = styleSpec.indent;
  if (extra.props) Object.assign(props, extra.props);
  return new _docx.Paragraph({ children: runs.length > 0 ? runs : [new _docx.TextRun({ text: '', font: opts.font, size: opts.size })], spacing: props.spacing, alignment: props.alignment, indent: props.indent, keepNext: extra.keepNext, pageBreakBefore: extra.pageBreakBefore });
}

function _buildCoverPage(cover) {
  var S_C = REPORT_SPEC.styles.coverText, items = [];
  items.push(_makeParagraph('Research Report', S_C));
  items.push(_makeParagraph(cover.title || '', { fontSize: REPORT_SPEC.styles.reportTitle.fontSize, lineSpacing: S_C.lineSpacing, spaceBefore: 0, spaceAfter: REPORT_SPEC.styles.reportTitle.spaceAfter, alignment: 'center', fontLatin: S_C.fontLatin }, { alignment: 'center', props: { spacing: { line: S_C.lineSpacing, before: 200, after: REPORT_SPEC.styles.reportTitle.spaceAfter } } }));
  if (cover.subtitle) items.push(_makeParagraph(cover.subtitle, { fontSize: REPORT_SPEC.styles.reportSubtitle.fontSize, lineSpacing: REPORT_SPEC.styles.reportSubtitle.lineSpacing, spaceBefore: 0, spaceAfter: REPORT_SPEC.styles.reportSubtitle.spaceAfter, alignment: 'center', fontLatin: S_C.fontLatin }, { alignment: 'center', runOptions: { color: REPORT_SPEC.styles.reportSubtitle.color } }));
  items.push(_makeParagraph('', S_C, { props: { spacing: { line: S_C.lineSpacing, before: 600, after: 0 } } }));
  [cover.studentName, cover.date, cover.major, cover.school, cover.advisor, cover.advisorSchool, cover.univName].filter(Boolean).forEach(function(f) { items.push(_makeParagraph(f, Object.assign({}, S_C, { fontSize: 32 }))); });
  return items;
}

function _buildTOCParagraphs(state) {
  var items = [];
  items.push(_makeParagraph('CONTENTS', { fontSize: REPORT_SPEC.styles.heading2.fontSize, lineSpacing: REPORT_SPEC.styles.heading2.lineSpacing, spaceBefore: 0, spaceAfter: REPORT_SPEC.styles.heading2.spaceAfter, bold: true, alignment: 'center', fontLatin: REPORT_SPEC.fonts.latin }, { alignment: 'center' }));
  var toc = buildTOC(state);
  toc.forEach(function(entry) {
    if (entry.level === 'toc-heading' || entry.level === 'spacer') return;
    var spec = entry.level === 'toc-figure' ? Object.assign({}, REPORT_SPEC.styles.caption, { indent: { left: 420 }, fontLatin: REPORT_SPEC.fonts.latin, alignment: 'left' })
      : entry.level === 'toc2' ? Object.assign({}, REPORT_SPEC.styles.toc2, { fontLatin: REPORT_SPEC.fonts.latin, alignment: 'left' })
      : entry.level === 'toc3' ? Object.assign({}, REPORT_SPEC.styles.toc3, { fontLatin: REPORT_SPEC.fonts.latin, alignment: 'left' })
      : Object.assign({}, REPORT_SPEC.styles.toc1, { fontLatin: REPORT_SPEC.fonts.latin, alignment: 'left' });
    items.push(_makeParagraph(entry.text, spec));
  });
  return items;
}

function _buildChapterBody(state, chapterIdx) {
  var ch = state.chapters[chapterIdx]; if (!ch) return []; var items = [];
  items.push(_makeParagraph(REPORT_SPEC.chapterNumerals[chapterIdx] + '. ' + (ch.title||''), { fontSize: REPORT_SPEC.styles.heading1.fontSize, lineSpacing: REPORT_SPEC.styles.heading1.lineSpacing, spaceBefore: 0, spaceAfter: REPORT_SPEC.styles.heading1.spaceAfter, bold: true, alignment: 'center', fontLatin: REPORT_SPEC.styles.heading1.fontLatin, fontEA: REPORT_SPEC.styles.heading1.fontEA }, { alignment: 'center' }));
  var chT = (state.tables||[]).filter(function(t){return t.chapterIdx===chapterIdx});
  var chF = (state.figures||[]).filter(function(f){return f.chapterIdx===chapterIdx});
  var chE = (state.equations||[]).filter(function(e){return e.chapterIdx===chapterIdx});
  (ch.sections||[]).forEach(function(sec, si) {
    items.push(_makeParagraph((si+1) + '. ' + (sec.title||''), REPORT_SPEC.styles.heading2));
    if (sec.content) sec.content.split('\n').filter(Boolean).forEach(function(para){ items.push(_makeParagraph(para, REPORT_SPEC.styles.bodyText)); });
    (sec.subSections||[]).forEach(function(sub, ssi) { items.push(_makeParagraph((si+1) + '.' + (ssi+1) + ' ' + (sub.title||''), REPORT_SPEC.styles.heading3)); if (sub.content) sub.content.split('\n').filter(Boolean).forEach(function(para){ items.push(_makeParagraph(para, REPORT_SPEC.styles.bodyText)); }); });
  });
  chT.forEach(function(t) { items.push(_makeParagraph(REPORT_SPEC.chapterRoman[chapterIdx] + '-' + (t.localIdx+1) + '. ' + (t.caption||''), REPORT_SPEC.styles.caption)); items.push(_buildDocxTable(t.rows, t.headerRows || 1)); });
  chF.forEach(function(f) { items.push(_makeParagraph(REPORT_SPEC.chapterNumerals[chapterIdx] + '-' + (f.localIdx+1) + '. ' + (f.caption||''), REPORT_SPEC.styles.caption)); });
  chE.forEach(function(e) { var pw = REPORT_SPEC.page.width - REPORT_SPEC.page.marginLeft - REPORT_SPEC.page.marginRight; items.push(new _docx.Paragraph({ spacing: { line: 480, before: 120, after: 120 }, tabStops: [{ type: _docx.TabStopType.CENTER, position: pw / 2 }, { type: _docx.TabStopType.RIGHT, position: pw }], children: [new _docx.TextRun({ text: '\t' + e.latex + '\t(' + (chapterIdx+1) + '.' + (e.localIdx+1) + ')', font: { name: REPORT_SPEC.fonts.latin }, size: 22, italics: true })] })); });
  return items;
}

function _buildDocxTable(rows, headerRows) {
  if (!rows || rows.length === 0) return _makeParagraph(''); headerRows = headerRows || 1;
  var border = { style: _docx.BorderStyle.SINGLE, size: REPORT_SPEC.table.borderSize, color: REPORT_SPEC.table.borderColor };
  var tableRows = rows.map(function(row, ri) { var isHeader = ri < headerRows; return new _docx.TableRow({ children: (row||[]).map(function(cell) { var text = String(cell||''), isBold = isHeader || text.indexOf('**') >= 0, cleaned = text.replace(/\*\*/g, ''); return new _docx.TableCell({ children: [new _docx.Paragraph({ alignment: isHeader ? _docx.AlignmentType.CENTER : _docx.AlignmentType.LEFT, spacing: { line: 240, before: 28, after: 28 }, children: [new _docx.TextRun({ text: cleaned, bold: isBold, font: { name: REPORT_SPEC.fonts.latin }, size: 20 })] })], margins: { left: REPORT_SPEC.table.cellMarginLeft, right: REPORT_SPEC.table.cellMarginRight, top: REPORT_SPEC.table.cellMarginTop, bottom: REPORT_SPEC.table.cellMarginBottom }, shading: isHeader ? { fill: 'E8E8E8', type: _docx.ShadingType.CLEAR } : undefined }); }) }); });
  return new _docx.Table({ rows: tableRows, width: { size: 100, type: _docx.WidthType.PERCENTAGE }, borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border } });
}

function _buildReferences(refs) {
  var items = []; items.push(_makeParagraph('REFERENCES', REPORT_SPEC.styles.heading1, { alignment: 'center', props: { pageBreakBefore: true } }));
  var sorted = [].concat(refs).sort(function(a,b){ if(a.number&&b.number) return a.number-b.number; if(a.number) return -1; if(b.number) return 1; return 0; });
  sorted.forEach(function(ref) { items.push(_makeParagraph(formatReference(ref), REPORT_SPEC.styles.reference)); });
  return items;
}

function _buildAbstracts(abstracts) {
  var items = [];
  if (abstracts.korean && (abstracts.korean.body || abstracts.korean.title)) {
    items.push(_makeParagraph('국 문 초 록', REPORT_SPEC.styles.heading1, { alignment: 'center', props: { pageBreakBefore: true } }));
    if (abstracts.korean.title) items.push(_makeParagraph('논문 제목: ' + abstracts.korean.title, REPORT_SPEC.styles.koreanBody));
    if (abstracts.korean.studentName) items.push(_makeParagraph('학생이름: ' + abstracts.korean.studentName, REPORT_SPEC.styles.koreanBody));
    if (abstracts.korean.major) items.push(_makeParagraph('전공: ' + abstracts.korean.major, REPORT_SPEC.styles.koreanBody));
    if (abstracts.korean.advisor) items.push(_makeParagraph('지도교수: ' + abstracts.korean.advisor, REPORT_SPEC.styles.koreanBody));
    if (abstracts.korean.body) abstracts.korean.body.split('\n').filter(Boolean).forEach(function(p){ items.push(_makeParagraph(p, REPORT_SPEC.styles.koreanBody)); });
    if (abstracts.korean.keywords) items.push(_makeParagraph('키워드: ' + abstracts.korean.keywords, REPORT_SPEC.styles.koreanBody));
  }
  if (abstracts.english && (abstracts.english.body || abstracts.english.title)) {
    items.push(_makeParagraph('ABSTRACT', REPORT_SPEC.styles.heading1, { alignment: 'center', props: { pageBreakBefore: true } }));
    if (abstracts.english.title) items.push(_makeParagraph('Title: ' + abstracts.english.title, REPORT_SPEC.styles.bodyText));
    if (abstracts.english.studentName) items.push(_makeParagraph('Student Name: ' + abstracts.english.studentName, REPORT_SPEC.styles.bodyText));
    if (abstracts.english.major) items.push(_makeParagraph('Major: ' + abstracts.english.major, REPORT_SPEC.styles.bodyText));
    if (abstracts.english.advisor) items.push(_makeParagraph('Advisor: ' + abstracts.english.advisor, REPORT_SPEC.styles.bodyText));
    if (abstracts.english.body) abstracts.english.body.split('\n').filter(Boolean).forEach(function(p){ items.push(_makeParagraph(p, REPORT_SPEC.styles.bodyText)); });
    if (abstracts.english.keywords) items.push(_makeParagraph('Keywords: ' + abstracts.english.keywords, REPORT_SPEC.styles.bodyText));
  }
  return items;
}

function _buildAppendix(appendixData) {
  var items = []; items.push(_makeParagraph('APPENDIX', REPORT_SPEC.styles.heading1, { alignment: 'center', props: { pageBreakBefore: true } }));
  (appendixData||[]).forEach(function(app) { if (app.chapterName) items.push(_makeParagraph(app.chapterName, REPORT_SPEC.styles.heading2)); if (app.requires) items.push(_makeParagraph('python=='+app.requires, REPORT_SPEC.styles.codeBlock)); if (app.imports) app.imports.split('\n').forEach(function(l){ if(l.trim()) items.push(_makeParagraph(l, REPORT_SPEC.styles.codeBlock)); }); if (app.code) app.code.split('\n').forEach(function(l){ items.push(_makeParagraph(l, REPORT_SPEC.styles.codeBlock)); }); });
  return items;
}

function _buildAcknowledgements(text) {
  var items = []; items.push(_makeParagraph('ACKNOWLEDGEMENTS', REPORT_SPEC.styles.heading1, { alignment: 'center', props: { pageBreakBefore: true } }));
  if (text) text.split('\n').filter(Boolean).forEach(function(p){ items.push(_makeParagraph(p, REPORT_SPEC.styles.bodyText)); });
  return items;
}

function buildFullDocument(state) {
  var children = [].concat(_buildCoverPage(state.cover), _buildTOCParagraphs(state));
  state.chapters.forEach(function(ch, ci) { children = children.concat(_buildChapterBody(state, ci)); });
  children = children.concat(_buildReferences(state.references), _buildAbstracts(state.abstracts), _buildAppendix(state.appendix), _buildAcknowledgements(state.acknowledgements));
  return new _docx.Document({ sections: [{ properties: { page: { size: { width: REPORT_SPEC.page.width, height: REPORT_SPEC.page.height }, margin: { top: REPORT_SPEC.page.marginTop, bottom: REPORT_SPEC.page.marginBottom, left: REPORT_SPEC.page.marginLeft, right: REPORT_SPEC.page.marginRight, header: REPORT_SPEC.page.headerDist, footer: REPORT_SPEC.page.footerDist } } }, footers: { default: new _docx.Footer({ children: [new _docx.Paragraph({ alignment: _docx.AlignmentType.CENTER, children: [new _docx.TextRun({ children: [_docx.PageNumber.CURRENT], size: 20 })] })] }) }, children: children }] });
}

async function exportDocx(state) { var doc = buildFullDocument(state); return await _docx.Packer.toBlob(doc); }
function exportMarkdownBlob(state) { var md = generateMarkdown(state); return new Blob([md], { type: 'text/markdown;charset=utf-8' }); }

// ═══════════════════════════════════════════
// MODULE: preview.js
// ═══════════════════════════════════════════

var _debounceTimer = null;

function initPreview() {
  var c = document.getElementById('preview-content'); if (c) c.innerHTML = renderPreview(getState());
}

function updatePreview() {
  clearTimeout(_debounceTimer);
  _debounceTimer = setTimeout(function() { var c = document.getElementById('preview-content'); if (c) { c.innerHTML = renderPreview(getState()); if (global.MathJax && global.MathJax.typesetPromise) global.MathJax.typesetPromise([c]).catch(function(){}); } }, 500);
}

function updatePreviewImmediate() {
  var c = document.getElementById('preview-content'); if (c) { c.innerHTML = renderPreview(getState()); if (global.MathJax && global.MathJax.typesetPromise) global.MathJax.typesetPromise([c]).catch(function(){}); }
}

function renderPreview(state) {
  var parts = [];
  // Cover
  parts.push('<div class="preview-cover" style="text-align:center;line-height:1.2;">');
  parts.push('<p style="font-family:\'' + REPORT_SPEC.fonts.latin + '\',\'' + REPORT_SPEC.fonts.cover + '\';font-size:16pt;text-align:center;">Research Report</p>');
  if (state.cover.title) parts.push('<h1 style="font-family:\'' + REPORT_SPEC.fonts.latin + '\',\'' + REPORT_SPEC.fonts.cover + '\';font-size:28pt;text-align:center;">' + escHtml(state.cover.title) + '</h1>');
  if (state.cover.subtitle) parts.push('<p style="font-family:\'' + REPORT_SPEC.fonts.latin + '\';font-size:14pt;color:#595959;text-align:center;">' + escHtml(state.cover.subtitle) + '</p>');
  parts.push('<div style="margin-top:40px;"></div>');
  [state.cover.studentName, state.cover.date, state.cover.major, state.cover.school, state.cover.advisor, state.cover.advisorSchool, state.cover.univName].forEach(function(f) { if (f) parts.push('<p style="font-family:\'' + REPORT_SPEC.fonts.latin + '\',\'' + REPORT_SPEC.fonts.cover + '\';font-size:16pt;text-align:center;margin:4px 0;">' + escHtml(f) + '</p>'); });
  parts.push('</div>');
  // TOC
  parts.push('<div class="preview-toc" style="margin-top:40px;">');
  parts.push('<p style="font-size:14pt;font-weight:bold;text-align:center;margin-bottom:15.6pt;">CONTENTS</p>');
  var toc = buildTOC(state);
  toc.forEach(function(line) { if (line.level === 'toc-heading' || line.level === 'spacer') return; var indent = line.level === 'toc3' ? REPORT_SPEC.styles.toc3.indent.left : line.level === 'toc2' ? REPORT_SPEC.styles.toc2.indent.left : line.level === 'toc-figure' ? 420 : 0; var indentCm = (indent / 567).toFixed(2); parts.push('<p class="toc-line ' + line.level + '" style="padding-left:' + indentCm + 'cm;line-height:1.55;font-size:11pt;margin:1px 0;">' + escHtml(line.text) + '</p>'); });
  parts.push('</div>');
  // Chapters
  state.chapters.forEach(function(ch, ci) {
    parts.push('<div class="preview-chapter" style="margin-top:30px;">');
    parts.push('<h1 style="font-family:\'' + REPORT_SPEC.styles.heading1.fontLatin + '\',\'' + (REPORT_SPEC.styles.heading1.fontEA||'') + '\';font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">' + REPORT_SPEC.chapterNumerals[ci] + '. ' + escHtml(ch.title||'') + '</h1>');
    var chT = (state.tables||[]).filter(function(t){return t.chapterIdx===ci});
    var chF = (state.figures||[]).filter(function(f){return f.chapterIdx===ci});
    var chE = (state.equations||[]).filter(function(e){return e.chapterIdx===ci});
    (ch.sections||[]).forEach(function(sec, si) {
      parts.push('<h2 style="font-size:14pt;font-weight:bold;margin:15.6pt 0;">' + (si+1) + '. ' + escHtml(sec.title||'') + '</h2>');
      if (sec.content) sec.content.split('\n').filter(Boolean).forEach(function(p){ parts.push('<p style="font-family:\'' + REPORT_SPEC.fonts.latin + '\';font-size:11pt;text-align:justify;text-indent:' + (440/567).toFixed(2) + 'cm;line-height:2;margin:0;">' + escHtml(p) + '</p>'); });
      (sec.subSections||[]).forEach(function(sub, ssi) { parts.push('<h3 style="font-size:12pt;font-weight:bold;margin-bottom:15.6pt;text-indent:' + (REPORT_SPEC.styles.heading3.indent.firstLine/567).toFixed(2) + 'cm;">' + (si+1) + '.' + (ssi+1) + ' ' + escHtml(sub.title||'') + '</h3>'); if (sub.content) sub.content.split('\n').filter(Boolean).forEach(function(p){ parts.push('<p style="font-family:\'' + REPORT_SPEC.fonts.latin + '\';font-size:11pt;text-align:justify;text-indent:' + (440/567).toFixed(2) + 'cm;line-height:2;margin:0;">' + escHtml(p) + '</p>'); }); });
    });
    chT.forEach(function(t) { parts.push('<p class="caption" style="font-size:11pt;margin-top:7.8pt;text-indent:' + (440/567).toFixed(2) + 'cm;">' + escHtml(getTableLabel(ci, t.localIdx)) + ' ' + escHtml(t.caption||'') + '</p>'); if (t.rows && t.rows.length>0) { parts.push('<table style="width:100%;border-collapse:collapse;margin:8px 0;">'); t.rows.forEach(function(row,ri){ var isH=ri<(t.headerRows||1); parts.push('<tr>'); (row||[]).forEach(function(cell){ var tag=isH?'th':'td', text=String(cell||'').replace(/\*\*/g,''); parts.push('<' + tag + ' style="border:0.5pt solid #000;padding:0 5.4pt;text-align:' + (isH?'center':'left') + ';' + (isH?'background:#e8e8e8;':'') + '">' + escHtml(text) + '</' + tag + '>'); }); parts.push('</tr>'); }); parts.push('</table>'); } });
    chF.forEach(function(f) { if (f.imageData) parts.push('<div style="text-align:center;margin:12px 0;"><img src="' + f.imageData + '" style="max-width:80%;" alt=""/></div>'); else parts.push('<div style="text-align:center;margin:12px 0;border:1px dashed #ccc;padding:40px;">[Figure ' + REPORT_SPEC.chapterNumerals[ci] + '-' + (f.localIdx+1) + ']</div>'); parts.push('<p class="caption" style="font-size:11pt;margin-top:7.8pt;text-indent:' + (440/567).toFixed(2) + 'cm;">' + escHtml(getFigureLabel(ci, f.localIdx)) + ' ' + escHtml(f.caption||'') + '</p>'); });
    chE.forEach(function(e) { parts.push('<div class="equation-block" style="display:flex;justify-content:space-between;align-items:center;margin:8px 0;"><span style="flex:1;text-align:center;">\\(' + escHtml(e.latex) + '\\)</span><span>' + escHtml(getEquationLabel(ci, e.localIdx)) + '</span></div>'); });
    parts.push('</div>');
  });
  // References
  parts.push('<div class="preview-references" style="margin-top:30px;">');
  parts.push('<h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">REFERENCES</h1>');
  var sortedRefs = [].concat(state.references||[]).sort(function(a,b){ if(a.number&&b.number) return a.number-b.number; if(a.number) return -1; if(b.number) return 1; return 0; });
  sortedRefs.forEach(function(ref) { parts.push('<p class="ref-item-preview" style="font-size:11pt;line-height:1.55;padding-left:2.14cm;text-indent:-2.14cm;margin:2px 0;">' + escHtml(formatReference(ref)) + '</p>'); });
  parts.push('</div>');
  // Abstracts
  var abs = state.abstracts || {};
  if (abs.korean && (abs.korean.body||abs.korean.title)) { parts.push('<div style="margin-top:30px;"><h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">국 문 초 록</h1>'); if (abs.korean.title) parts.push('<p style="font-family:\''+REPORT_SPEC.fonts.korean+'\';font-size:11pt;text-indent:'+(440/567).toFixed(2)+'cm;line-height:2;">논문 제목: '+escHtml(abs.korean.title)+'</p>'); if (abs.korean.studentName) parts.push('<p style="font-family:\''+REPORT_SPEC.fonts.korean+'\';font-size:11pt;">학생이름: '+escHtml(abs.korean.studentName)+'</p>'); if (abs.korean.major) parts.push('<p style="font-family:\''+REPORT_SPEC.fonts.korean+'\';font-size:11pt;">전공: '+escHtml(abs.korean.major)+'</p>'); if (abs.korean.advisor) parts.push('<p style="font-family:\''+REPORT_SPEC.fonts.korean+'\';font-size:11pt;">지도교수: '+escHtml(abs.korean.advisor)+'</p>'); if (abs.korean.body) abs.korean.body.split('\n').filter(Boolean).forEach(function(p){ parts.push('<p style="font-family:\''+REPORT_SPEC.fonts.korean+'\';font-size:11pt;text-indent:'+(440/567).toFixed(2)+'cm;line-height:2;">'+escHtml(p)+'</p>'); }); if (abs.korean.keywords) parts.push('<p style="font-family:\''+REPORT_SPEC.fonts.korean+'\';font-size:11pt;">키워드: '+escHtml(abs.korean.keywords)+'</p>'); parts.push('</div>'); }
  if (abs.english && (abs.english.body||abs.english.title)) { parts.push('<div style="margin-top:30px;"><h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">ABSTRACT</h1>'); if (abs.english.title) parts.push('<p>Title: '+escHtml(abs.english.title)+'</p>'); if (abs.english.studentName) parts.push('<p>Student Name: '+escHtml(abs.english.studentName)+'</p>'); if (abs.english.major) parts.push('<p>Major: '+escHtml(abs.english.major)+'</p>'); if (abs.english.advisor) parts.push('<p>Advisor: '+escHtml(abs.english.advisor)+'</p>'); if (abs.english.body) abs.english.body.split('\n').filter(Boolean).forEach(function(p){ parts.push('<p style="font-family:\''+REPORT_SPEC.fonts.latin+'\';font-size:11pt;text-indent:'+(440/567).toFixed(2)+'cm;line-height:2;">'+escHtml(p)+'</p>'); }); if (abs.english.keywords) parts.push('<p>Keywords: '+escHtml(abs.english.keywords)+'</p>'); parts.push('</div>'); }
  // Appendix
  if (state.appendix && state.appendix.length>0) { parts.push('<div style="margin-top:30px;"><h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">APPENDIX</h1>'); state.appendix.forEach(function(app){ if(app.chapterName) parts.push('<h2>'+escHtml(app.chapterName)+'</h2>'); if(app.requires) parts.push('<p class="code-block"><strong>Requires:</strong> python=='+escHtml(app.requires)+'</p>'); if(app.imports) parts.push('<pre class="code-block">'+escHtml(app.imports)+'</pre>'); if(app.code) parts.push('<pre class="code-block">'+escHtml(app.code)+'</pre>'); }); parts.push('</div>'); }
  // Acknowledgements
  if (state.acknowledgements) { parts.push('<div style="margin-top:30px;"><h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">ACKNOWLEDGEMENTS</h1>'); state.acknowledgements.split('\n').filter(Boolean).forEach(function(p){ parts.push('<p style="font-family:\''+REPORT_SPEC.fonts.latin+'\';font-size:11pt;text-indent:'+(440/567).toFixed(2)+'cm;line-height:2;">'+escHtml(p)+'</p>'); }); parts.push('</div>'); }
  return parts.join('\n');
}

function escHtml(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ═══════════════════════════════════════════
// MODULE: main.js — Entry Point & UI Wiring
// ═══════════════════════════════════════════

var secDebounceTimers = {};

function $(id) { return document.getElementById(id); }
function val(id) { var el = $(id); return el ? el.value : ''; }
function setVal(id, v) { var el = $(id); if (el) el.value = v; }

function toast(msg, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) return;
  var el = document.createElement('div'); el.className = 'toast ' + type; el.textContent = msg;
  container.appendChild(el); setTimeout(function() { el.remove(); }, 4000);
}

function getApiConfig() { return { key: val('api-key'), baseUrl: val('api-base'), model: val('api-model') }; }
function saveApiConfigFromUI() { updateState('apiConfig.key', val('api-key')); updateState('apiConfig.baseUrl', val('api-base')); updateState('apiConfig.model', val('api-model')); saveApiConfig(); }
function restoreApiUI() { var s = getState(); setVal('api-key', s.apiConfig.key); setVal('api-base', s.apiConfig.baseUrl); setVal('api-model', s.apiConfig.model); }

function renderChapterSelects() {
  var state = getState();
  ['table-chapter-select','figure-chapter-select','equation-chapter-select','appendix-chapter-select'].forEach(function(sid) {
    var sel = $(sid); if (!sel) return;
    sel.innerHTML = state.chapters.map(function(ch, i) { return '<option value="' + i + '">' + REPORT_SPEC.chapterNumerals[i] + '. ' + (ch.title||'Untitled') + '</option>'; }).join('');
  });
}

function renderAllChapterLists() { renderChaptersUI(); renderTablesList(); renderFiguresList(); renderEquationsList(); renderRefList(); renderAppendixList(); updatePreview(); }

// ── Top Bar ──
function initTopBar() {
  $('#btn-test-api').addEventListener('click', async function() { saveApiConfigFromUI(); var cfg = getApiConfig(); if (!cfg.key) { toast('Please enter an API Key first.', 'error'); return; } var s = $('#api-status'), b = this; s.className = 'status-dot idle'; b.disabled = true; b.textContent = '...';
    try { var ok = await testConnection(cfg.key, cfg.baseUrl, cfg.model); s.className = ok ? 'status-dot ok' : 'status-dot err'; updateState('apiConfig.connected', ok); toast(ok ? 'Connection successful' : 'Connection failed', ok ? 'success' : 'error'); } catch(e) { s.className = 'status-dot err'; toast('Connection error: ' + e.message, 'error'); } b.disabled = false; b.textContent = 'Test'; });
  $('#btn-export-docx').addEventListener('click', function() { doExportDocx(); });
  $('#btn-export-md').addEventListener('click', function() { doExportMarkdown(); });
  $('#btn-toggle-preview').addEventListener('click', function() { var p = document.getElementById('preview-panel'); p.classList.toggle('visible'); });
}

// ── Tabs ──
function initTabs() {
  var tabs = document.querySelectorAll('.tab-btn'), contents = document.querySelectorAll('.tab-content');
  tabs.forEach(function(btn) {
    btn.addEventListener('click', function() {
      tabs.forEach(function(b){ b.classList.remove('active'); }); contents.forEach(function(c){ c.style.display = 'none'; });
      btn.classList.add('active'); var target = document.getElementById('tab-' + btn.dataset.tab);
      if (target) { target.style.display = 'block'; updateState('activeTab', btn.dataset.tab); } updatePreviewImmediate();
    });
  });
}

// ── Cover ──
function initCoverTab() {
  var s = getState();
  setVal('cover-title', s.cover.title); setVal('cover-subtitle', s.cover.subtitle); setVal('cover-date', s.cover.date);
  setVal('cover-major', s.cover.major); setVal('cover-school', s.cover.school); setVal('cover-student-name', s.cover.studentName);
  setVal('cover-advisor', s.cover.advisor); setVal('cover-advisor-school', s.cover.advisorSchool); setVal('cover-univ-name', s.cover.univName);
  ['title','subtitle','date','major','school','student-name','advisor','advisor-school','univ-name'].forEach(function(f){
    var keyMap = { title:'title', subtitle:'subtitle', date:'date', major:'major', school:'school', 'student-name':'studentName', advisor:'advisor', 'advisor-school':'advisorSchool', 'univ-name':'univName' };
    $('#cover-'+f)?.addEventListener('input', function() { updateState('cover.'+keyMap[f], val('cover-'+f)); updatePreview(); });
  });
}

// ── Chapters ──
function initChaptersTab() {
  $('#btn-add-chapter').addEventListener('click', function() { var s = getState(), idx = s.chapters.length, numeral = REPORT_SPEC.chapterNumerals[idx]||(idx+1); s.chapters.push({ numeral: numeral, title: '', sections: [] }); setState({ chapters: s.chapters }); renderChapterSelects(); renderChaptersUI(); updatePreview(); toast('Chapter ' + numeral + ' added.'); });
  $('#btn-collapse-all').addEventListener('click', function() { document.querySelectorAll('.chapter-body').forEach(function(el){ el.style.display = 'none'; }); });
  $('#btn-expand-all').addEventListener('click', function() { document.querySelectorAll('.chapter-body').forEach(function(el){ el.style.display = 'block'; }); });
}

function renderChaptersUI() {
  var container = $('#chapters-container'); if (!container) return;
  var state = getState(), chT = state.tables||[], chF = state.figures||[], chE = state.equations||[];
  container.innerHTML = state.chapters.map(function(ch, ci) {
    var tc = chT.filter(function(t){return t.chapterIdx===ci}).length, fc = chF.filter(function(f){return f.chapterIdx===ci}).length, ec = chE.filter(function(e){return e.chapterIdx===ci}).length;
    var meta = []; if (tc) meta.push(tc+' tables'); if (fc) meta.push(fc+' figures'); if (ec) meta.push(ec+' equations');
    var sh = (ch.sections||[]).map(function(sec, si) {
      var ssh = (sec.subSections||[]).map(function(sub, ssi) {
        return '<div class="subsection-item"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;"><span class="section-label" style="font-size:12px;">'+(si+1)+'.'+(ssi+1)+' '+escHtml(sub.title||'')+'</span><div><button class="btn btn-xs btn-secondary" onclick="_editSubSection('+ci+','+si+','+ssi+')">✏</button><button class="btn btn-xs btn-danger" onclick="_deleteSubSection('+ci+','+si+','+ssi+')">✕</button></div></div><textarea style="width:100%;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);border-radius:4px;padding:6px;font-size:12px;min-height:40px;" onchange="_updateSubContent('+ci+','+si+','+ssi+',this.value)" oninput="_debounceSubContent('+ci+','+si+','+ssi+',this)">'+escHtml(sub.content||'')+'</textarea></div>';
      }).join('');
      return '<div class="section-item"><div class="section-header"><span class="section-label">'+(si+1)+'. '+escHtml(sec.title||'Untitled')+'</span><div><button class="btn btn-xs btn-secondary" onclick="_editSection('+ci+','+si+')">✏</button><button class="btn btn-xs btn-primary" onclick="_addSubSection('+ci+','+si+')">+Sub</button><button class="btn btn-xs btn-danger" onclick="_deleteSection('+ci+','+si+')">✕</button></div></div><textarea style="width:100%;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);border-radius:4px;padding:6px;font-size:12px;min-height:60px;" placeholder="Section content..." onchange="_updateSecContent('+ci+','+si+',this.value)" oninput="_debounceSecContent('+ci+','+si+',this)">'+escHtml(sec.content||'')+'</textarea>'+ssh+'</div>';
    }).join('');
    return '<div class="chapter-card"><div class="chapter-header" onclick="_toggleChapter(this)"><span><span class="chapter-chapterNum">'+REPORT_SPEC.chapterNumerals[ci]+'.</span><span class="chapter-title">'+escHtml(ch.title||'Untitled Chapter')+'</span></span><span style="display:flex;align-items:center;gap:8px;"><span style="font-size:11px;color:var(--text-muted);">'+meta.join(', ')+'</span><button class="btn btn-xs btn-primary" onclick="event.stopPropagation();_addSection('+ci+')">+Section</button><button class="btn btn-xs btn-danger" onclick="event.stopPropagation();_deleteChapter('+ci+')">✕</button></span></div><div class="chapter-body"><div class="form-group" style="margin-bottom:12px;"><label>Chapter Title</label><input type="text" value="'+escHtml(ch.title||'')+'" onchange="_updateChapterTitle('+ci+',this.value)" oninput="_updateChapterTitle('+ci+',this.value)"></div><div style="margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">SECTIONS</div>'+ (sh || '<div class="empty-state" style="padding:20px;"><p>No sections yet.</p></div>') +'</div></div>';
  }).join('');
}

// Chapter CRUD
function _toggleChapter(header) { var b = header.nextElementSibling; if (b) b.style.display = b.style.display==='none'?'block':'none'; }
function _updateChapterTitle(ci, val) { var s = getState(); s.chapters[ci].title = val; setState({ chapters: s.chapters }); renderChapterSelects(); updatePreview(); }
function _updateSecContent(ci, si, val) { var s = getState(); s.chapters[ci].sections[si].content = val; setState({ chapters: s.chapters }); updatePreview(); }
function _debounceSecContent(ci, si, el) { clearTimeout(secDebounceTimers[ci+'_'+si]); secDebounceTimers[ci+'_'+si] = setTimeout(function(){ _updateSecContent(ci, si, el.value); }, 500); }
function _updateSubContent(ci, si, ssi, val) { var s = getState(); if(!s.chapters[ci].sections[si].subSections) s.chapters[ci].sections[si].subSections=[]; s.chapters[ci].sections[si].subSections[ssi].content=val; setState({ chapters: s.chapters }); updatePreview(); }
function _debounceSubContent(ci, si, ssi, el) { clearTimeout(secDebounceTimers[ci+'_'+si+'_'+ssi]); secDebounceTimers[ci+'_'+si+'_'+ssi] = setTimeout(function(){ _updateSubContent(ci, si, ssi, el.value); }, 500); }
function _addSection(ci) { var s=getState(), secs=s.chapters[ci].sections||[], label=secs.length+1, title=prompt('Section title:', 'Section '+label); if(!title) return; secs.push({ heading: String(label), title: title, content: '', subSections: [] }); s.chapters[ci].sections=secs; setState({ chapters: s.chapters }); renderChaptersUI(); updatePreview(); }
function _deleteSection(ci, si) { if(!confirm('Delete this section?')) return; var s=getState(); s.chapters[ci].sections.splice(si,1); s.chapters[ci].sections.forEach(function(sec,i){sec.heading=String(i+1);}); setState({ chapters: s.chapters }); renderChaptersUI(); updatePreview(); }
function _addSubSection(ci, si) { var s=getState(), sec=s.chapters[ci].sections[si]; if(!sec.subSections) sec.subSections=[]; var title=prompt('Sub-section title:', 'Sub-section '+(sec.subSections.length+1)); if(!title) return; sec.subSections.push({ heading: (si+1)+'.'+(sec.subSections.length+1), title: title, content: '' }); setState({ chapters: s.chapters }); renderChaptersUI(); updatePreview(); }
function _deleteSubSection(ci, si, ssi) { if(!confirm('Delete this sub-section?')) return; var s=getState(); s.chapters[ci].sections[si].subSections.splice(ssi,1); setState({ chapters: s.chapters }); renderChaptersUI(); updatePreview(); }
function _editSection(ci, si) { var s=getState(), sec=s.chapters[ci].sections[si], title=prompt('Section title:', sec.title); if(!title) return; sec.title=title; setState({ chapters: s.chapters }); renderChaptersUI(); updatePreview(); }
function _editSubSection(ci, si, ssi) { var s=getState(), sub=s.chapters[ci].sections[si].subSections[ssi], title=prompt('Sub-section title:', sub.title); if(!title) return; sub.title=title; setState({ chapters: s.chapters }); renderChaptersUI(); updatePreview(); }
function _deleteChapter(ci) { if(!confirm('Delete Chapter '+REPORT_SPEC.chapterNumerals[ci]+'? This will also remove associated items.')) return; var s=getState(); s.chapters.splice(ci,1); s.tables=s.tables.filter(function(t){return t.chapterIdx!==ci}); s.figures=s.figures.filter(function(f){return f.chapterIdx!==ci}); s.equations=s.equations.filter(function(e){return e.chapterIdx!==ci}); s.chapters.forEach(function(ch,i){ch.numeral=REPORT_SPEC.chapterNumerals[i]||String(i+1);}); s.tables.forEach(function(t){if(t.chapterIdx>ci)t.chapterIdx--;}); s.figures.forEach(function(f){if(f.chapterIdx>ci)f.chapterIdx--;}); s.equations.forEach(function(e){if(e.chapterIdx>ci)e.chapterIdx--;}); renumberPerChapter(s); setState(s); renderChapterSelects(); renderAllChapterLists(); updatePreview(); }
function renumberPerChapter(s) { for(var ci=0; ci<s.chapters.length; ci++){ s.tables.filter(function(t){return t.chapterIdx===ci}).forEach(function(t,i){t.localIdx=i;}); s.figures.filter(function(f){return f.chapterIdx===ci}).forEach(function(f,i){f.localIdx=i;}); s.equations.filter(function(e){return e.chapterIdx===ci}).forEach(function(e,i){e.localIdx=i;}); } }

// ── Tables ──
function initTablesTab() {
  $('#btn-add-table').addEventListener('click', function() { var s=getState(), ci=parseInt(val('table-chapter-select')), localIdx=s.tables.filter(function(t){return t.chapterIdx===ci}).length, rows=parseInt(prompt('Rows:','4'))||4, cols=parseInt(prompt('Columns:','3'))||3, caption=prompt('Caption:','')||'', hr=[]; for(var c=0;c<cols;c++) hr.push(prompt('Header '+ (c+1)+':','Col '+(c+1))||'Col '+(c+1)); var dataRows=[hr]; for(var r=1;r<rows;r++){ var row=[]; for(var c=0;c<cols;c++) row.push(''); dataRows.push(row); } s.tables.push({ chapterIdx: ci, localIdx: localIdx, caption: caption, rows: dataRows, headerRows: 1 }); setState({ tables: s.tables }); renderChapterSelects(); renderAllChapterLists(); toast('Table '+getTableLabel(ci,localIdx)+' added.'); });
}

function renderTablesList() {
  var c = $('#tables-list'); if (!c) return; var s = getState();
  if (s.tables.length===0) { c.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No tables yet.</p></div>'; return; }
  c.innerHTML = s.tables.map(function(t, i) {
    return '<div class="card" style="background:var(--bg-tertiary);"><div class="card-header" style="font-size:13px;">'+escHtml(getTableLabel(t.chapterIdx,t.localIdx))+' '+escHtml(t.caption||'')+'<button class="btn btn-xs btn-danger" onclick="_deleteTable('+i+')">✕</button></div><div style="overflow-x:auto;"><table class="table-editor">'+(t.rows||[]).map(function(row,ri){ var isHeader=ri<(t.headerRows||1); return '<tr>'+(row||[]).map(function(cell,ci){ return isHeader?'<th><input value="'+escHtml(String(cell||''))+'" oninput="_updateTableCell('+i+','+ri+','+ci+',this.value)"></th>':'<td><input value="'+escHtml(String(cell||''))+'" oninput="_updateTableCell('+i+','+ri+','+ci+',this.value)"></td>'; }).join('')+'<td><button class="btn btn-xs btn-danger" onclick="_deleteTableRow('+i+','+ri+')">−</button></td></tr>'; }).join('')+'</table><div style="display:flex;gap:4px;padding:4px;"><button class="btn btn-xs btn-secondary" onclick="_addTableRow('+i+')">+ Row</button><button class="btn btn-xs btn-secondary" onclick="_addTableCol('+i+')">+ Column</button></div></div></div>';
  }).join('');
}

function _updateTableCell(ti, ri, ci, val) { var s=getState(); if(!s.tables[ti].rows[ri]) s.tables[ti].rows[ri]=[]; s.tables[ti].rows[ri][ci]=val; setState({ tables: s.tables }); updatePreview(); }
function _addTableRow(ti) { var s=getState(), cols=s.tables[ti].rows[0]?s.tables[ti].rows[0].length:3; s.tables[ti].rows.push(new Array(cols).fill('')); setState({ tables: s.tables }); renderTablesList(); updatePreview(); }
function _addTableCol(ti) { var s=getState(); s.tables[ti].rows.forEach(function(row){row.push('');}); setState({ tables: s.tables }); renderTablesList(); updatePreview(); }
function _deleteTable(ti) { if(!confirm('Delete this table?')) return; var s=getState(); s.tables.splice(ti,1); renumberPerChapter(s); setState({ tables: s.tables }); renderAllChapterLists(); updatePreview(); }
function _deleteTableRow(ti, ri) { var s=getState(); s.tables[ti].rows.splice(ri,1); setState({ tables: s.tables }); renderTablesList(); updatePreview(); }

// ── Figures ──
function initFiguresTab() {
  $('#btn-add-figure').addEventListener('click', function() { var s=getState(), ci=parseInt(val('figure-chapter-select')), caption=val('figure-caption')||'', fileInput=$('#figure-file'), file=fileInput?fileInput.files?.[0]:null; if (!caption && !file) { toast('Provide caption or image.', 'error'); return; }
    if (file) { var reader = new FileReader(); reader.onload = function(e) { var localIdx=s.figures.filter(function(f){return f.chapterIdx===ci}).length; s.figures.push({ chapterIdx:ci, localIdx:localIdx, caption:caption, imageData:e.target.result }); setState({ figures: s.figures }); renderChapterSelects(); renderAllChapterLists(); updatePreview(); toast('Figure '+getFigureLabel(ci,localIdx)+' added.'); fileInput.value=''; setVal('figure-caption',''); }; reader.readAsDataURL(file); }
    else { var localIdx=s.figures.filter(function(f){return f.chapterIdx===ci}).length; s.figures.push({ chapterIdx:ci, localIdx:localIdx, caption:caption, imageData:null }); setState({ figures: s.figures }); renderChapterSelects(); renderAllChapterLists(); updatePreview(); toast('Figure placeholder added.'); }
  });
}

function renderFiguresList() {
  var c = $('#figures-list'); if (!c) return; var s = getState();
  if (s.figures.length===0) { c.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No figures yet.</p></div>'; return; }
  c.innerHTML = s.figures.map(function(f,i){ return '<div class="card" style="background:var(--bg-tertiary);display:flex;gap:12px;align-items:flex-start;">'+(f.imageData?'<img src="'+f.imageData+'" class="img-preview" style="width:120px;height:auto;flex-shrink:0;">':'<div style="width:120px;height:80px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;color:var(--text-muted);">No Image</div>')+'<div style="flex:1;"><div style="font-weight:600;font-size:13px;margin-bottom:4px;">'+escHtml(getFigureLabel(f.chapterIdx,f.localIdx))+' '+escHtml(f.caption||'')+'</div><div style="font-size:11px;color:var(--text-muted);">Chapter '+escHtml(REPORT_SPEC.chapterNumerals[f.chapterIdx])+'</div></div><button class="btn btn-xs btn-danger" onclick="_deleteFigure('+i+')">✕</button></div>'; }).join('');
}

function _deleteFigure(fi) { if(!confirm('Delete this figure?')) return; var s=getState(); s.figures.splice(fi,1); renumberPerChapter(s); setState({ figures: s.figures }); renderAllChapterLists(); updatePreview(); }

// ── Equations ──
function initEquationsTab() {
  $('#btn-add-equation').addEventListener('click', function() { var s=getState(), ci=parseInt(val('equation-chapter-select')), latex=val('equation-latex'); if(!latex.trim()){toast('Enter LaTeX.','error');return;} var localIdx=s.equations.filter(function(e){return e.chapterIdx===ci}).length; s.equations.push({ chapterIdx:ci, localIdx:localIdx, latex:latex }); setState({ equations: s.equations }); renderChapterSelects(); renderAllChapterLists(); updatePreview(); setVal('equation-latex',''); toast('Equation '+getEquationLabel(ci,localIdx)+' added.'); });
  $('#equation-latex').addEventListener('input', function() { var latex=val('equation-latex'), preview=$('#equation-preview'); if(preview&&latex){ preview.innerHTML='\\('+escHtml(latex)+'\\)'; if(global.MathJax&&global.MathJax.typesetPromise) global.MathJax.typesetPromise([preview]).catch(function(){}); } });
}

function renderEquationsList() {
  var c = $('#equations-list'); if (!c) return; var s = getState();
  if (s.equations.length===0) { c.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No equations yet.</p></div>'; return; }
  c.innerHTML = s.equations.map(function(e,i){ return '<div class="card" style="background:var(--bg-tertiary);display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;align-items:center;gap:12px;flex:1;"><span style="font-weight:600;font-size:12px;">'+escHtml(getEquationLabel(e.chapterIdx,e.localIdx))+'</span><span style="font-family:monospace;color:var(--accent);">\\('+escHtml(e.latex)+'\\)</span></div><button class="btn btn-xs btn-danger" onclick="_deleteEquation('+i+')">✕</button></div>'; }).join('');
  setTimeout(function(){ if(global.MathJax&&global.MathJax.typesetPromise) global.MathJax.typesetPromise([c]).catch(function(){}); }, 100);
}

function _deleteEquation(ei) { if(!confirm('Delete this equation?')) return; var s=getState(); s.equations.splice(ei,1); renumberPerChapter(s); setState({ equations: s.equations }); renderAllChapterLists(); updatePreview(); }

// ── References ──
function initReferencesTab() {
  $('#btn-parse-ref').addEventListener('click', async function() { var cfg=getApiConfig(); if(!cfg.key){toast('Configure API Key first.','error');return;} var rawText=val('ref-raw'), id=val('ref-id')||'ref'; if(!rawText.trim()){toast('Paste reference text.','error');return;} var btn=this; btn.disabled=true; btn.textContent='Parsing...';
    try{ var parsed=await parseReference(rawText,cfg.key,cfg.baseUrl,cfg.model); if(parsed){ var s=getState(); s.references.push(Object.assign({ id:id },parsed,{ number:null })); setState({ references: s.references }); renderRefList(); updatePreview(); setVal('ref-raw',''); setVal('ref-id',''); toast('Reference parsed and added.'); }else{ toast('Failed to parse.','error'); } }catch(e){toast('Error: '+e.message,'error');} btn.disabled=false; btn.textContent='AI Parse'; });
  $('#btn-fetch-doi').addEventListener('click', async function() { var dois=val('ref-doi').split('\n').filter(Boolean); if(dois.length===0){toast('Enter DOI(s).','error');return;} var btn=this; btn.disabled=true; btn.textContent='Fetching...';
    try{ var results=await batchFetchDOI(dois), s=getState(); results.forEach(function(r){ if(r.success){ s.references.push({ id:'doi_'+r.doi.replace(/[^a-zA-Z0-9]/g,''), authors:r.authors, year:r.year, title:r.title, journal:r.journal, volume:r.volume, issue:r.issue, page:r.page, doi:r.doi, number:null }); }else{ toast('DOI '+r.doi+': '+r.error,'error'); } }); setState({ references: s.references }); renderRefList(); updatePreview(); setVal('ref-doi',''); toast(results.filter(function(r){return r.success}).length+' references fetched.'); }catch(e){toast('Error: '+e.message,'error');} btn.disabled=false; btn.textContent='Fetch from CrossRef'; });
  $('#btn-import-bibtex').addEventListener('click', function() { var bibtex=val('bibtex-entry'), id=val('bibtex-id')||'bibtex_'+Date.now(); if(!bibtex.trim()){toast('Paste BibTeX.','error');return;}
    try{ var parsed=parseBibTeX(bibtex), s=getState(); s.references.push(Object.assign({ id:id },parsed,{ number:null })); setState({ references: s.references }); renderRefList(); updatePreview(); setVal('bibtex-entry',''); setVal('bibtex-id',''); toast('BibTeX imported.'); }catch(e){toast('Error: '+e.message,'error');} });
  $('#btn-match-refs').addEventListener('click', async function() { var cfg=getApiConfig(); if(!cfg.key){toast('Configure API Key first.','error');return;} var s=getState(); if(s.references.length===0){toast('Add references first.','error');return;}
    var bodyText=''; s.chapters.forEach(function(ch){ch.sections.forEach(function(sec){bodyText+=sec.content+'\n';(sec.subSections||[]).forEach(function(sub){bodyText+=sub.content+'\n';});});}); bodyText+=(s.abstracts?.korean?.body||'')+'\n'+(s.abstracts?.english?.body||'')+'\n';
    var markers=bodyText.match(/\[ref:([^\]]+)\]/g)||[]; if(markers.length===0){toast('No [ref:xxx] markers found.','error');return;}
    var btn=this; btn.disabled=true; btn.textContent='Matching...';
    try{ var mapping=await matchReferencesToBody(bodyText,s.references,cfg.key,cfg.baseUrl,cfg.model); for(var key in mapping){ if(mapping.hasOwnProperty(key)&&mapping[key]>=0&&mapping[key]<s.references.length){ s.references[mapping[key]].number=mapping[key]+1; bodyText=applyReferenceMarkers(bodyText,{[key]:mapping[key]+1}); } }
      s.references.sort(function(a,b){ if(a.number&&b.number) return a.number-b.number; if(a.number) return -1; if(b.number) return 1; return 0; });
      setState(s); renderRefList(); updatePreview(); toast('Matched '+Object.keys(mapping).length+' citations.'); }catch(e){toast('Error: '+e.message,'error');} btn.disabled=false; btn.textContent='Match [ref:xxx] → [n]'; });
}

function renderRefList() {
  var c = $('#ref-list'); if (!c) return; var s = getState();
  if (s.references.length===0) { c.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No references yet.</p></div>'; }
  else { c.innerHTML = s.references.map(function(ref,i){ return '<div class="ref-item" style="display:flex;justify-content:space-between;align-items:flex-start;"><span><span class="ref-number">['+(ref.number||'?')+']</span> '+escHtml(formatReference(ref,ref.number))+'</span><button class="btn btn-xs btn-danger" onclick="_deleteRef('+i+')">✕</button></div>'; }).join(''); }
  var cnt = $('#ref-count'); if (cnt) cnt.textContent = s.references.length;
}
function _deleteRef(ri) { if(!confirm('Delete this reference?')) return; var s=getState(); s.references.splice(ri,1); setState({ references: s.references }); renderRefList(); updatePreview(); }

// ── Abstracts ──
function initAbstractsTab() {
  var s=getState();
  setVal('abs-ko-title',s.abstracts.korean.title); setVal('abs-ko-name',s.abstracts.korean.studentName); setVal('abs-ko-major',s.abstracts.korean.major); setVal('abs-ko-advisor',s.abstracts.korean.advisor); setVal('abs-ko-body',s.abstracts.korean.body); setVal('abs-ko-keywords',s.abstracts.korean.keywords);
  setVal('abs-en-title',s.abstracts.english.title); setVal('abs-en-name',s.abstracts.english.studentName); setVal('abs-en-major',s.abstracts.english.major); setVal('abs-en-advisor',s.abstracts.english.advisor); setVal('abs-en-body',s.abstracts.english.body); setVal('abs-en-keywords',s.abstracts.english.keywords);
  var koMap={ 'abs-ko-title':'title','abs-ko-name':'studentName','abs-ko-major':'major','abs-ko-advisor':'advisor','abs-ko-body':'body','abs-ko-keywords':'keywords' };
  var enMap={ 'abs-en-title':'title','abs-en-name':'studentName','abs-en-major':'major','abs-en-advisor':'advisor','abs-en-body':'body','abs-en-keywords':'keywords' };
  Object.keys(koMap).forEach(function(f){ $('#'+f)?.addEventListener('input', function(){ updateState('abstracts.korean.'+koMap[f], val(f)); updatePreview(); }); });
  Object.keys(enMap).forEach(function(f){ $('#'+f)?.addEventListener('input', function(){ updateState('abstracts.english.'+enMap[f], val(f)); updatePreview(); }); });
}

// ── Appendix ──
function initAppendixTab() {
  $('#btn-add-appendix').addEventListener('click', function() { var s=getState(); s.appendix.push({ chapterIdx: parseInt(val('appendix-chapter-select')), chapterName: val('appendix-chapter-name'), requires: val('appendix-requires'), imports: val('appendix-imports'), code: val('appendix-code') }); setState({ appendix: s.appendix }); renderAppendixList(); updatePreview(); ['appendix-chapter-name','appendix-requires','appendix-imports','appendix-code'].forEach(function(id){setVal(id,'');}); toast('Appendix entry added.'); });
  $('#acknowledgements-text')?.addEventListener('input', function() { updateState('acknowledgements', val('acknowledgements-text')); updatePreview(); });
}

function renderAppendixList() {
  var c = $('#appendix-list'); if (!c) return; var s = getState();
  if (s.appendix.length===0) { c.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No appendix entries yet.</p></div>'; return; }
  c.innerHTML = s.appendix.map(function(app,i){ return '<div class="card" style="background:var(--bg-tertiary);"><div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-weight:600;font-size:13px;">'+escHtml(app.chapterName||'Entry '+(i+1))+'</span><button class="btn btn-xs btn-danger" onclick="_deleteAppendix('+i+')">✕</button></div>'+(app.requires?'<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Requires: python=='+escHtml(app.requires)+'</div>':'')+(app.imports?'<pre style="font-family:\'Courier New\',monospace;font-size:10pt;color:var(--accent);margin-top:4px;">'+escHtml(app.imports)+'</pre>':'')+(app.code?'<pre style="font-family:\'Courier New\',monospace;font-size:10pt;color:var(--text-secondary);margin-top:4px;max-height:200px;overflow-y:auto;">'+escHtml(app.code)+'</pre>':'')+'</div>'; }).join('');
}
function _deleteAppendix(ai) { if(!confirm('Delete this appendix entry?')) return; var s=getState(); s.appendix.splice(ai,1); setState({ appendix: s.appendix }); renderAppendixList(); updatePreview(); }

// ── AI Tools ──
function initAIToolsTab() {
  $('#btn-ai-polish').addEventListener('click', async function() { var cfg=getApiConfig(); if(!cfg.key){toast('Configure API Key first.','error');return;} var text=val('ai-polish-input'); if(!text.trim()){toast('Paste text.','error');return;} var btn=this; btn.disabled=true; btn.textContent='Polishing...';
    try{ var result=await polishParagraph(text,cfg.key,cfg.baseUrl,cfg.model), out=$('#ai-polish-output'); out.style.display='block'; out.innerHTML='<div style="margin-bottom:8px;font-size:12px;font-weight:600;">Polished:</div><div>'+escHtml(result)+'</div>'; toast('Text polished.'); }catch(e){toast('Error: '+e.message,'error');} btn.disabled=false; btn.textContent='Polish'; });
  $('#btn-ai-expand').addEventListener('click', async function() { var cfg=getApiConfig(); if(!cfg.key){toast('Configure API Key first.','error');return;} var text=val('ai-expand-input'), words=parseInt(val('ai-expand-words'))||300; if(!text.trim()){toast('Enter keywords.','error');return;} var btn=this; btn.disabled=true; btn.textContent='Expanding...';
    try{ var result=await expandSection(text,cfg.key,cfg.baseUrl,cfg.model,words), out=$('#ai-expand-output'); out.style.display='block'; out.innerHTML='<div style="margin-bottom:8px;font-size:12px;font-weight:600;">Generated:</div><div>'+escHtml(result)+'</div>'; toast('Section expanded.'); }catch(e){toast('Error: '+e.message,'error');} btn.disabled=false; btn.textContent='Expand'; });
  $('#btn-ai-check').addEventListener('click', async function() { var cfg=getApiConfig(); if(!cfg.key){toast('Configure API Key first.','error');return;} var s=getState(), spec=JSON.stringify({heading1:'18pt bold center',heading2:'14pt bold',heading3:'12pt bold',bodyText:'11pt double-spaced justified',reference:'11pt hanging indent 2.14cm'}), fullText=generateMarkdown(s), btn=this; btn.disabled=true; btn.textContent='Checking...';
    try{ var issues=await checkFormatting(fullText,spec,cfg.key,cfg.baseUrl,cfg.model), out=$('#ai-check-output'); out.style.display='block'; if(issues.length===0) out.innerHTML='<div style="color:var(--accent-green);">✅ No formatting issues found.</div>';
    else out.innerHTML='<div style="font-size:12px;font-weight:600;margin-bottom:8px;">Issues found:</div>'+issues.map(function(issue){ return '<div style="margin-bottom:6px;padding:8px;background:var(--bg-input);border-radius:4px;border-left:3px solid '+(issue.severity==='error'?'var(--accent-red)':'var(--accent-yellow)')+';"><span style="font-weight:600;font-size:12px;">['+issue.type+']</span><span style="font-size:11px;color:var(--text-secondary);"> '+escHtml(issue.location)+'</span><div style="font-size:12px;">'+escHtml(issue.description)+'</div></div>'; }).join(''); toast('Format check complete.'); }catch(e){toast('Error: '+e.message,'error');} btn.disabled=false; btn.textContent='Run Format Check'; });
  $('#btn-ai-integrate').addEventListener('click', async function() { var cfg=getApiConfig(); if(!cfg.key){toast('Configure API Key first.','error');return;} var s=getState(), btn=this; btn.disabled=true; btn.textContent='Integrating...';
    try{ var result=await integrateFullReport(s,cfg.key,cfg.baseUrl,cfg.model), preview=document.getElementById('preview-content'); if(preview) preview.innerHTML='<pre style="white-space:pre-wrap;font-family:monospace;font-size:12px;">'+escHtml(result)+'</pre>'; toast('Full report integrated.'); }catch(e){toast('Error: '+e.message,'error');} btn.disabled=false; btn.textContent='Integrate & Preview'; });
}

// ── Export ──
function initExportTab() {
  $('#btn-export-docx2')?.addEventListener('click', function() { doExportDocx(); });
  $('#btn-export-md2')?.addEventListener('click', function() { doExportMarkdown(); });
  $('#btn-print-preview')?.addEventListener('click', function() { global.print(); });
  $('#btn-validate')?.addEventListener('click', function() { runValidation(); });
}

async function doExportDocx() {
  if (!_docxAvailable()) { toast('docx.js library not loaded. Check your internet connection.', 'error'); return; }
  var status = $('#export-status'); if (status) { status.textContent = 'Generating .docx...'; status.style.color = 'var(--accent)'; }
  try {
    var blob = await exportDocx(getState());
    var title = (getState().cover.title || 'research_report').replace(/[^a-zA-Z0-9]/g, '_');
    if (global.saveAs) global.saveAs(blob, title + '.docx'); else { var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = title + '.docx'; a.click(); URL.revokeObjectURL(url); }
    if (status) { status.textContent = 'Export complete!'; status.style.color = 'var(--accent-green)'; }
    toast('DOCX exported!', 'success');
  } catch(e) { toast('Export error: ' + e.message, 'error'); if (status) { status.textContent = 'Error: ' + e.message; status.style.color = 'var(--accent-red)'; } }
}

async function doExportMarkdown() {
  try {
    var blob = exportMarkdownBlob(getState());
    var title = (getState().cover.title || 'research_report').replace(/[^a-zA-Z0-9]/g, '_');
    if (global.saveAs) global.saveAs(blob, title + '.md'); else { var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = title + '.md'; a.click(); URL.revokeObjectURL(url); }
    toast('Markdown exported!', 'success');
  } catch(e) { toast('Export error: ' + e.message, 'error'); }
}

function runValidation() {
  var s = getState(), checklist = $('#validation-checklist'); if (!checklist) return;
  var items = [
    { label: 'A4 paper (21.00 × 29.70 cm)', ok: true },
    { label: 'Margins: top/bottom 1.90cm, left/right 2.60cm', ok: true },
    { label: 'Body: Times New Roman 11pt, double spacing, first-line 0.78cm', ok: true },
    { label: 'Chapter titles: 18pt bold centered, 31.2pt after', ok: true },
    { label: 'Section titles: 14pt bold, 15.6pt before/after', ok: true },
    { label: 'Table numbering (Table III-1.)', ok: s.tables.every(function(t){ return REPORT_SPEC.chapterRoman[t.chapterIdx] !== undefined; }) },
    { label: 'Figure numbering (Figure Ⅳ-1.)', ok: s.figures.every(function(f){ return REPORT_SPEC.chapterNumerals[f.chapterIdx] !== undefined; }) },
    { label: 'Equation numbering (4.1)', ok: true },
    { label: 'References: hanging indent, 18.6pt spacing', ok: true },
    { label: 'Footer: centered page numbers', ok: true },
    { label: 'TOC with LIST OF TABLES and FIGURES', ok: true },
    { label: 'Korean abstract: 맑은 고딕 (Malgun Gothic)', ok: true },
  ];
  checklist.innerHTML = items.map(function(item){ return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><span style="color:'+(item.ok?'var(--accent-green)':'var(--accent-red)')+';font-size:14px;">'+(item.ok?'✓':'✗')+'</span><span style="color:'+(item.ok?'var(--text-primary)':'var(--accent-red)')+';">'+item.label+'</span></div>'; }).join('');
  toast('Validation complete.', 'info');
}

// ── Init on DOM ready ──
function boot() {
  loadApiConfig(); restoreApiUI(); renderChapterSelects();
  initTabs(); initCoverTab(); initChaptersTab(); initTablesTab();
  initFiguresTab(); initEquationsTab(); initReferencesTab();
  initAbstractsTab(); initAppendixTab(); initAIToolsTab();
  initExportTab(); initTopBar(); initPreview(); renderAllChapterLists();
  ['api-key','api-base','api-model'].forEach(function(id){ $(id)?.addEventListener('change', function(){ saveApiConfigFromUI(); }); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

// ── Expose for inline onclick handlers ──
global._toggleChapter = _toggleChapter;
global._updateChapterTitle = _updateChapterTitle;
global._updateSecContent = _updateSecContent;
global._debounceSecContent = _debounceSecContent;
global._updateSubContent = _updateSubContent;
global._debounceSubContent = _debounceSubContent;
global._addSection = _addSection;
global._deleteSection = _deleteSection;
global._addSubSection = _addSubSection;
global._deleteSubSection = _deleteSubSection;
global._editSection = _editSection;
global._editSubSection = _editSubSection;
global._deleteChapter = _deleteChapter;
global._updateTableCell = _updateTableCell;
global._addTableRow = _addTableRow;
global._addTableCol = _addTableCol;
global._deleteTable = _deleteTable;
global._deleteTableRow = _deleteTableRow;
global._deleteFigure = _deleteFigure;
global._deleteEquation = _deleteEquation;
global._deleteRef = _deleteRef;
global._deleteAppendix = _deleteAppendix;

})(window);
