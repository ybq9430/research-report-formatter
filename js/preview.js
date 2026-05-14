// ── Real-time Preview Panel ──

import { REPORT_SPEC as S } from '../templates/report_spec.js';
import { getState } from './state.js';
import { getFigureLabel, getTableLabel, getEquationLabel, buildTOC, formatReference } from './formatter.js';

let debounceTimer = null;
const DEBOUNCE_MS = 500;

export function initPreview() {
  const container = document.getElementById('preview-content');
  if (!container) return;

  // Update on state changes
  container.innerHTML = renderPreview(getState());
}

export function updatePreview() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const container = document.getElementById('preview-content');
    if (container) {
      container.innerHTML = renderPreview(getState());
      // Re-render MathJax if available
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([container]).catch(() => {});
      }
    }
  }, DEBOUNCE_MS);
}

export function updatePreviewImmediate() {
  const container = document.getElementById('preview-content');
  if (container) {
    container.innerHTML = renderPreview(getState());
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([container]).catch(() => {});
    }
  }
}

function renderPreview(state) {
  const parts = [];

  // ── Cover Page ──
  parts.push('<div class="preview-cover" style="text-align:center;line-height:1.2;page-break-after:always;">');
  parts.push(`<p style="font-family:'${S.fonts.latin}','${S.fonts.cover}';font-size:16pt;text-align:center;">Research Report</p>`);
  if (state.cover.title) {
    parts.push(`<h1 style="font-family:'${S.fonts.latin}','${S.fonts.cover}';font-size:28pt;text-align:center;">${esc(state.cover.title)}</h1>`);
  }
  if (state.cover.subtitle) {
    parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:14pt;color:#595959;text-align:center;">${esc(state.cover.subtitle)}</p>`);
  }
  parts.push('<div style="margin-top:40px;"></div>');
  const coverFields = [state.cover.studentName, state.cover.date, state.cover.major, state.cover.school, state.cover.advisor, state.cover.advisorSchool, state.cover.univName];
  coverFields.forEach(f => {
    if (f) parts.push(`<p style="font-family:'${S.fonts.latin}','${S.fonts.cover}';font-size:16pt;text-align:center;margin:4px 0;">${esc(f)}</p>`);
  });
  parts.push('</div>');

  // ── TOC ──
  parts.push('<div class="preview-toc" style="page-break-after:always;">');
  const toc = buildTOC(state);
  // Toc heading
  parts.push('<p style="font-size:14pt;font-weight:bold;text-align:center;margin-bottom:15.6pt;">CONTENTS</p>');

  toc.forEach(line => {
    if (line.level === 'toc-heading' || line.level === 'spacer') return;
    const indent = line.level === 'toc3' ? S.styles.toc3.indent.left
      : line.level === 'toc2' ? S.styles.toc2.indent.left
      : line.level === 'toc-figure' ? 420 : 0;
    const indentCm = (indent / 567).toFixed(2);
    parts.push(`<p class="toc-line ${line.level}" style="padding-left:${indentCm}cm;line-height:1.55;font-size:11pt;margin:1px 0;">${esc(line.text)}</p>`);
  });
  parts.push('</div>');

  // ── Chapters ──
  state.chapters.forEach((ch, ci) => {
    parts.push('<div class="preview-chapter" style="page-break-before:always;">');
    // Chapter title
    parts.push(`<h1 style="font-family:'${S.styles.heading1.fontLatin}','${S.styles.heading1.fontEA}';font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">${S.chapterNumerals[ci]}. ${esc(ch.title || '')}</h1>`);

    // Chapter tables, figures, equations
    const chTables = (state.tables || []).filter(t => t.chapterIdx === ci);
    const chFigures = (state.figures || []).filter(f => f.chapterIdx === ci);
    const chEquations = (state.equations || []).filter(e => e.chapterIdx === ci);

    (ch.sections || []).forEach((sec, si) => {
      // Section heading
      parts.push(`<h2 style="font-size:14pt;font-weight:bold;margin:15.6pt 0;">${si + 1}. ${esc(sec.title || '')}</h2>`);

      // Content
      if (sec.content) {
        sec.content.split('\n').filter(Boolean).forEach(para => {
          parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:11pt;text-align:justify;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;margin:0;">${esc(para)}</p>`);
        });
      }

      // Sub-sections
      (sec.subSections || []).forEach((sub, ssi) => {
        parts.push(`<h3 style="font-size:12pt;font-weight:bold;margin-bottom:15.6pt;text-indent:${(S.styles.heading3.indent.firstLine / 567).toFixed(2)}cm;">${si + 1}.${ssi + 1} ${esc(sub.title || '')}</h3>`);
        if (sub.content) {
          sub.content.split('\n').filter(Boolean).forEach(para => {
            parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:11pt;text-align:justify;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;margin:0;">${esc(para)}</p>`);
          });
        }
      });
    });

    // Render chapter tables
    chTables.forEach(t => {
      const label = getTableLabel(ci, t.localIdx);
      parts.push(`<p class="caption" style="font-size:11pt;margin-top:7.8pt;text-indent:${(440 / 567).toFixed(2)}cm;">${label} ${esc(t.caption || '')}</p>`);
      if (t.rows && t.rows.length > 0) {
        parts.push('<table class="preview-table" style="width:100%;border-collapse:collapse;margin:8px 0;">');
        t.rows.forEach((row, ri) => {
          const isHeader = ri < (t.headerRows || 1);
          parts.push('<tr>');
          (row || []).forEach(cell => {
            const tag = isHeader ? 'th' : 'td';
            const text = String(cell || '').replace(/\*\*/g, '');
            parts.push(`<${tag} style="border:0.5pt solid #000;padding:0 5.4pt;text-align:${isHeader ? 'center' : 'left'};${isHeader ? 'background:#e8e8e8;' : ''}${text.includes('**') ? 'font-weight:bold;' : ''}">${esc(text)}</${tag}>`);
          });
          parts.push('</tr>');
        });
        parts.push('</table>');
      }
    });

    // Render chapter figures
    chFigures.forEach(f => {
      const label = getFigureLabel(ci, f.localIdx);
      if (f.imageData) {
        parts.push(`<div style="text-align:center;margin:12px 0;"><img src="${f.imageData}" style="max-width:80%;" alt="${esc(f.caption || '')}"/></div>`);
      } else {
        parts.push(`<div style="text-align:center;margin:12px 0;border:1px dashed #ccc;padding:40px;">[Figure ${S.chapterNumerals[ci]}-${f.localIdx + 1}]</div>`);
      }
      parts.push(`<p class="caption" style="font-size:11pt;margin-top:7.8pt;text-indent:${(440 / 567).toFixed(2)}cm;">${label} ${esc(f.caption || '')}</p>`);
    });

    // Render chapter equations
    chEquations.forEach(e => {
      const label = getEquationLabel(ci, e.localIdx);
      parts.push(`<div class="equation-block">`);
      parts.push(`<span style="flex:1;text-align:center;">\\(${esc(e.latex)}\\)</span>`);
      parts.push(`<span class="eq-number">${label}</span>`);
      parts.push(`</div>`);
    });

    parts.push('</div>');
  });

  // ── References ──
  parts.push('<div class="preview-references" style="page-break-before:always;">');
  parts.push('<h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">REFERENCES</h1>');
  const sortedRefs = [...(state.references || [])].sort((a, b) => {
    if (a.number && b.number) return a.number - b.number;
    if (a.number) return -1;
    if (b.number) return 1;
    return 0;
  });
  sortedRefs.forEach(ref => {
    parts.push(`<p class="ref-item-preview">${esc(formatReference(ref))}</p>`);
  });
  parts.push('</div>');

  // ── Abstract: 국문초록 ──
  const abs = state.abstracts || {};
  if (abs.korean && (abs.korean.body || abs.korean.title)) {
    parts.push('<div class="preview-abstract" style="page-break-before:always;">');
    parts.push('<h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">국 문 초 록</h1>'); // 국문초록
    if (abs.korean.title) parts.push(`<p style="font-family:'${S.fonts.korean}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">논문 제목: ${esc(abs.korean.title)}</p>`);
    if (abs.korean.studentName) parts.push(`<p style="font-family:'${S.fonts.korean}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">학생이름: ${esc(abs.korean.studentName)}</p>`);
    if (abs.korean.major) parts.push(`<p style="font-family:'${S.fonts.korean}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">전공: ${esc(abs.korean.major)}</p>`);
    if (abs.korean.advisor) parts.push(`<p style="font-family:'${S.fonts.korean}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">지도교수: ${esc(abs.korean.advisor)}</p>`);
    if (abs.korean.body) {
      abs.korean.body.split('\n').filter(Boolean).forEach(p => {
        parts.push(`<p style="font-family:'${S.fonts.korean}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">${esc(p)}</p>`);
      });
    }
    if (abs.korean.keywords) parts.push(`<p style="font-family:'${S.fonts.korean}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">키워드: ${esc(abs.korean.keywords)}</p>`);
    parts.push('</div>');
  }

  // ── Abstract: ABSTRACT ──
  if (abs.english && (abs.english.body || abs.english.title)) {
    parts.push('<div class="preview-abstract" style="page-break-before:always;">');
    parts.push('<h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">ABSTRACT</h1>');
    if (abs.english.title) parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">Title: ${esc(abs.english.title)}</p>`);
    if (abs.english.studentName) parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">Student Name: ${esc(abs.english.studentName)}</p>`);
    if (abs.english.major) parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">Major: ${esc(abs.english.major)}</p>`);
    if (abs.english.advisor) parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">Advisor: ${esc(abs.english.advisor)}</p>`);
    if (abs.english.body) {
      abs.english.body.split('\n').filter(Boolean).forEach(p => {
        parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">${esc(p)}</p>`);
      });
    }
    if (abs.english.keywords) parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">Keywords: ${esc(abs.english.keywords)}</p>`);
    parts.push('</div>');
  }

  // ── Appendix ──
  if (state.appendix && state.appendix.length > 0) {
    parts.push('<div class="preview-appendix" style="page-break-before:always;">');
    parts.push('<h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">APPENDIX</h1>');
    state.appendix.forEach(app => {
      if (app.chapterName) parts.push(`<h2 style="font-size:14pt;font-weight:bold;margin:15.6pt 0;">${esc(app.chapterName)}</h2>`);
      if (app.requires) parts.push(`<p class="code-block"><strong>Requires:</strong> python==${esc(app.requires)}</p>`);
      if (app.imports) parts.push(`<pre class="code-block">${esc(app.imports)}</pre>`);
      if (app.code) parts.push(`<pre class="code-block">${esc(app.code)}</pre>`);
    });
    parts.push('</div>');
  }

  // ── Acknowledgements ──
  if (state.acknowledgements) {
    parts.push('<div class="preview-acks" style="page-break-before:always;">');
    parts.push('<h1 style="font-size:18pt;font-weight:bold;text-align:center;margin-bottom:31.2pt;">ACKNOWLEDGEMENTS</h1>');
    state.acknowledgements.split('\n').filter(Boolean).forEach(p => {
      parts.push(`<p style="font-family:'${S.fonts.latin}';font-size:11pt;text-indent:${(440 / 567).toFixed(2)}cm;line-height:2;">${esc(p)}</p>`);
    });
    parts.push('</div>');
  }

  return parts.join('\n');
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
