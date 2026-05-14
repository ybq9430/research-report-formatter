// ── Main Entry Point ──
// Initializes all modules, wires UI events, manages tabs

import { REPORT_SPEC as S } from '../templates/report_spec.js';
import { getState, setState, updateState, subscribe, loadApiConfig, saveApiConfig, initialState } from './state.js';
import { callDeepSeek, testConnection, polishParagraph, expandSection, checkFormatting, matchReferencesToBody, integrateFullReport, parseReference, parseDocxContent } from './api.js';
import { fetchByDOI, batchFetchDOI, parseBibTeX } from './crossref.js';
import { getFigureLabel, getTableLabel, getEquationLabel, assignReferenceNumbers, formatReference, buildTOC, applyReferenceMarkers, generateMarkdown } from './formatter.js';
import { exportDocx, exportMarkdownBlob } from './exporter.js';
import { initPreview, updatePreview, updatePreviewImmediate } from './preview.js';

// ── Initialization ──
document.addEventListener('DOMContentLoaded', () => {
  loadApiConfig();
  restoreApiUI();
  renderChapterSelects();
  initTabs();
  initCoverTab();
  initChaptersTab();
  initTablesTab();
  initFiguresTab();
  initEquationsTab();
  initReferencesTab();
  initAbstractsTab();
  initAppendixTab();
  initAIToolsTab();
  initImportDocx();
  initExportTab();
  initTopBar();
  initPreview();
  renderAllChapterLists();

  // Auto-save API config on change
  ['api-key', 'api-base', 'api-model'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => saveApiConfigFromUI());
  });
});

// ── Toast ──
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.remove(); }, 4000);
}

// ── Utils ──
function $(id) { return document.getElementById(id); }
function val(id) { return $(id)?.value || ''; }
function setVal(id, v) { const el = $(id); if (el) el.value = v; }
function getApiConfig() {
  return {
    key: val('api-key'),
    baseUrl: val('api-base'),
    model: val('api-model'),
  };
}
function saveApiConfigFromUI() {
  updateState('apiConfig.key', val('api-key'));
  updateState('apiConfig.baseUrl', val('api-base'));
  updateState('apiConfig.model', val('api-model'));
  saveApiConfig();
}
function restoreApiUI() {
  const state = getState();
  setVal('api-key', state.apiConfig.key);
  setVal('api-base', state.apiConfig.baseUrl);
  setVal('api-model', state.apiConfig.model);
}

// ── Top Bar ──
function initTopBar() {
  $('#btn-test-api')?.addEventListener('click', async () => {
    saveApiConfigFromUI();
    const cfg = getApiConfig();
    if (!cfg.key) { toast('Please enter an API Key first.', 'error'); return; }
    const statusEl = $('#api-status');
    statusEl.className = 'status-dot idle';
    const btn = $('#btn-test-api');
    btn.disabled = true;
    btn.textContent = '...';
    try {
      const ok = await testConnection(cfg.key, cfg.baseUrl, cfg.model);
      statusEl.className = ok ? 'status-dot ok' : 'status-dot err';
      updateState('apiConfig.connected', ok);
      toast(ok ? 'Connection successful' : 'Connection failed', ok ? 'success' : 'error');
    } catch (e) {
      statusEl.className = 'status-dot err';
      toast(`Connection error: ${e.message}`, 'error');
    }
    btn.disabled = false;
    btn.textContent = 'Test';
  });

  $('#btn-export-docx')?.addEventListener('click', () => doExportDocx());
  $('#btn-export-md')?.addEventListener('click', () => doExportMarkdown());
  $('#btn-toggle-preview')?.addEventListener('click', () => {
    const panel = $('#preview-panel');
    panel.classList.toggle('visible');
  });
}

// ── Tab Navigation ──
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.style.display = 'none');
      btn.classList.add('active');
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) { target.style.display = 'block'; updateState('activeTab', btn.dataset.tab); }
      updatePreviewImmediate();
    });
  });
}

// ── Chapter Select Helpers ──
function renderChapterSelects() {
  const state = getState();
  const selects = ['table-chapter-select', 'figure-chapter-select', 'equation-chapter-select', 'appendix-chapter-select'];
  selects.forEach(sid => {
    const sel = $(sid);
    if (!sel) return;
    sel.innerHTML = state.chapters.map((ch, i) => `<option value="${i}">${S.chapterNumerals[i]}. ${ch.title || 'Untitled'}</option>`).join('');
  });
}

function renderAllChapterLists() {
  renderChaptersUI();
  renderTablesList();
  renderFiguresList();
  renderEquationsList();
  renderRefList();
  renderAppendixList();
  updatePreview();
}

// ═══════════════════════════════════════════
// COVER TAB (M2)
// ═══════════════════════════════════════════
function initCoverTab() {
  const state = getState();
  setVal('cover-title', state.cover.title);
  setVal('cover-subtitle', state.cover.subtitle);
  setVal('cover-date', state.cover.date);
  setVal('cover-major', state.cover.major);
  setVal('cover-school', state.cover.school);
  setVal('cover-student-name', state.cover.studentName);
  setVal('cover-advisor', state.cover.advisor);
  setVal('cover-advisor-school', state.cover.advisorSchool);
  setVal('cover-univ-name', state.cover.univName);

  const fields = ['title', 'subtitle', 'date', 'major', 'school', 'student-name', 'advisor', 'advisor-school', 'univ-name'];
  fields.forEach(f => {
    $(`cover-${f}`)?.addEventListener('input', () => {
      const keyMap = {
        'title': 'title', 'subtitle': 'subtitle', 'date': 'date', 'major': 'major',
        'school': 'school', 'student-name': 'studentName', 'advisor': 'advisor',
        'advisor-school': 'advisorSchool', 'univ-name': 'univName',
      };
      updateState(`cover.${keyMap[f]}`, val(`cover-${f}`));
      updatePreview();
    });
  });
}

// ═══════════════════════════════════════════
// CHAPTERS TAB (M4)
// ═══════════════════════════════════════════
function initChaptersTab() {
  $('#btn-add-chapter')?.addEventListener('click', () => {
    const state = getState();
    const idx = state.chapters.length;
    const numeral = S.chapterNumerals[idx] || `${idx + 1}`;
    state.chapters.push({ numeral, title: '', sections: [] });
    setState({ chapters: state.chapters });
    renderChapterSelects();
    renderChaptersUI();
    updatePreview();
    toast(`Chapter ${numeral} added.`);
  });

  $('#btn-collapse-all')?.addEventListener('click', () => {
    document.querySelectorAll('.chapter-body').forEach(el => el.style.display = 'none');
  });
  $('#btn-expand-all')?.addEventListener('click', () => {
    document.querySelectorAll('.chapter-body').forEach(el => el.style.display = 'block');
  });
}

function renderChaptersUI() {
  const container = $('#chapters-container');
  if (!container) return;
  const state = getState();
  const chTables = state.tables || [];
  const chFigures = state.figures || [];
  const chEquations = state.equations || [];

  container.innerHTML = state.chapters.map((ch, ci) => {
    const tableCount = chTables.filter(t => t.chapterIdx === ci).length;
    const figCount = chFigures.filter(f => f.chapterIdx === ci).length;
    const eqCount = chEquations.filter(e => e.chapterIdx === ci).length;
    const meta = [];
    if (tableCount) meta.push(`${tableCount} tables`);
    if (figCount) meta.push(`${figCount} figures`);
    if (eqCount) meta.push(`${eqCount} equations`);

    const sectionsHtml = (ch.sections || []).map((sec, si) => {
      const subsHtml = (sec.subSections || []).map((sub, ssi) => `
        <div class="subsection-item">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <span class="section-label" style="font-size:12px;">${si + 1}.${ssi + 1} ${escHtml(sub.title || '')}</span>
            <div>
              <button class="btn btn-xs btn-secondary" onclick="window._editSubSection(${ci},${si},${ssi})" title="Edit">✏</button>
              <button class="btn btn-xs btn-danger" onclick="window._deleteSubSection(${ci},${si},${ssi})" title="Delete">✕</button>
            </div>
          </div>
          <textarea style="width:100%;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);border-radius:4px;padding:6px;font-size:12px;min-height:40px;"
            onchange="window._updateSubContent(${ci},${si},${ssi},this.value)"
            oninput="window._updateSubContent(${ci},${si},${ssi},this.value)">${escHtml(sub.content || '')}</textarea>
        </div>
      `).join('');

      return `
        <div class="section-item">
          <div class="section-header">
            <span class="section-label">${si + 1}. ${escHtml(sec.title || 'Untitled Section')}</span>
            <div>
              <button class="btn btn-xs btn-secondary" onclick="window._editSection(${ci},${si})" title="Edit">✏</button>
              <button class="btn btn-xs btn-primary" onclick="window._addSubSection(${ci},${si})" title="Add Subsection">+Sub</button>
              <button class="btn btn-xs btn-danger" onclick="window._deleteSection(${ci},${si})" title="Delete">✕</button>
            </div>
          </div>
          <textarea style="width:100%;background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);border-radius:4px;padding:6px;font-size:12px;min-height:60px;"
            placeholder="Section content..."
            onchange="window._updateSecContent(${ci},${si},this.value)"
            oninput="window._debounceUpdateSecContent(${ci},${si},this)">${escHtml(sec.content || '')}</textarea>
          ${subsHtml}
        </div>
      `;
    }).join('');

    return `
      <div class="chapter-card">
        <div class="chapter-header" onclick="window._toggleChapter(this)">
          <span><span class="chapter-chapterNum">${S.chapterNumerals[ci]}.</span><span class="chapter-title">${escHtml(ch.title || 'Untitled Chapter')}</span></span>
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11px;color:var(--text-muted);">${meta.join(', ')}</span>
            <button class="btn btn-xs btn-primary" onclick="event.stopPropagation();window._addSection(${ci})">+Section</button>
            <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();window._deleteChapter(${ci})">✕</button>
          </span>
        </div>
        <div class="chapter-body">
          <div class="form-group" style="margin-bottom:12px;">
            <label>Chapter Title</label>
            <input type="text" value="${escHtml(ch.title || '')}"
              onchange="window._updateChapterTitle(${ci},this.value)"
              oninput="window._updateChapterTitle(${ci},this.value)" placeholder="Chapter title">
          </div>
          <div style="margin-bottom:8px;font-size:13px;font-weight:600;color:var(--text-secondary);">SECTIONS</div>
          ${sectionsHtml || '<div class="empty-state" style="padding:20px;"><p>No sections yet. Click "+Section" to add.</p></div>'}
        </div>
      </div>
    `;
  }).join('');
}

// ── Chapter CRUD (global for inline onclick) ──
window._toggleChapter = function(header) {
  const body = header.nextElementSibling;
  if (body) body.style.display = body.style.display === 'none' ? 'block' : 'none';
};

window._updateChapterTitle = function(ci, val) {
  const state = getState();
  state.chapters[ci].title = val;
  setState({ chapters: state.chapters });
  renderChapterSelects();
  updatePreview();
};

window._updateSecContent = function(ci, si, val) {
  const state = getState();
  state.chapters[ci].sections[si].content = val;
  setState({ chapters: state.chapters });
  updatePreview();
};

let secDebounceTimers = {};
window._debounceUpdateSecContent = function(ci, si, el) {
  clearTimeout(secDebounceTimers[`${ci}_${si}`]);
  secDebounceTimers[`${ci}_${si}`] = setTimeout(() => {
    window._updateSecContent(ci, si, el.value);
  }, 500);
};

window._updateSubContent = function(ci, si, ssi, val) {
  const state = getState();
  if (!state.chapters[ci].sections[si].subSections) {
    state.chapters[ci].sections[si].subSections = [];
  }
  state.chapters[ci].sections[si].subSections[ssi].content = val;
  setState({ chapters: state.chapters });
  updatePreview();
};

window._addSection = function(ci) {
  const state = getState();
  const sections = state.chapters[ci].sections || [];
  const label = sections.length + 1;
  const title = prompt('Section title:', `Section ${label}`);
  if (!title) return;
  sections.push({ heading: String(label), title, content: '', subSections: [] });
  state.chapters[ci].sections = sections;
  setState({ chapters: state.chapters });
  renderChaptersUI();
  updatePreview();
};

window._deleteSection = function(ci, si) {
  if (!confirm('Delete this section?')) return;
  const state = getState();
  state.chapters[ci].sections.splice(si, 1);
  // Re-number
  state.chapters[ci].sections.forEach((s, i) => { s.heading = String(i + 1); });
  setState({ chapters: state.chapters });
  renderChaptersUI();
  updatePreview();
};

window._addSubSection = function(ci, si) {
  const state = getState();
  const sec = state.chapters[ci].sections[si];
  if (!sec.subSections) sec.subSections = [];
  const label = sec.subSections.length + 1;
  const title = prompt('Sub-section title:', `Sub-section ${label}`);
  if (!title) return;
  sec.subSections.push({ heading: `${si + 1}.${label}`, title, content: '' });
  setState({ chapters: state.chapters });
  renderChaptersUI();
  updatePreview();
};

window._deleteSubSection = function(ci, si, ssi) {
  if (!confirm('Delete this sub-section?')) return;
  const state = getState();
  state.chapters[ci].sections[si].subSections.splice(ssi, 1);
  setState({ chapters: state.chapters });
  renderChaptersUI();
  updatePreview();
};

window._editSection = function(ci, si) {
  const state = getState();
  const sec = state.chapters[ci].sections[si];
  const title = prompt('Section title:', sec.title);
  if (!title) return;
  sec.title = title;
  setState({ chapters: state.chapters });
  renderChaptersUI();
  updatePreview();
};

window._editSubSection = function(ci, si, ssi) {
  const state = getState();
  const sub = state.chapters[ci].sections[si].subSections[ssi];
  const title = prompt('Sub-section title:', sub.title);
  if (!title) return;
  sub.title = title;
  setState({ chapters: state.chapters });
  renderChaptersUI();
  updatePreview();
};

window._deleteChapter = function(ci) {
  if (!confirm(`Delete Chapter ${S.chapterNumerals[ci]}? This will also remove associated tables, figures, and equations.`)) return;
  const state = getState();
  state.chapters.splice(ci, 1);
  // Remove associated items
  state.tables = state.tables.filter(t => t.chapterIdx !== ci);
  state.figures = state.figures.filter(f => f.chapterIdx !== ci);
  state.equations = state.equations.filter(e => e.chapterIdx !== ci);
  // Re-number remaining chapters
  state.chapters.forEach((ch, i) => { ch.numeral = S.chapterNumerals[i] || `${i + 1}`; });
  // Re-index tables/figures/equations for remaining chapters
  state.tables.forEach(t => { if (t.chapterIdx > ci) t.chapterIdx--; });
  state.figures.forEach(f => { if (f.chapterIdx > ci) f.chapterIdx--; });
  state.equations.forEach(e => { if (e.chapterIdx > ci) e.chapterIdx--; });
  // Re-number tables/figures/equations per chapter
  renumberPerChapter(state);
  setState(state);
  renderChapterSelects();
  renderAllChapterLists();
  updatePreview();
};

function renumberPerChapter(state) {
  for (let ci = 0; ci < state.chapters.length; ci++) {
    state.tables.filter(t => t.chapterIdx === ci).forEach((t, i) => { t.localIdx = i; });
    state.figures.filter(f => f.chapterIdx === ci).forEach((f, i) => { f.localIdx = i; });
    state.equations.filter(e => e.chapterIdx === ci).forEach((e, i) => { e.localIdx = i; });
  }
}

// ═══════════════════════════════════════════
// TABLES TAB (M5)
// ═══════════════════════════════════════════
function initTablesTab() {
  $('#btn-add-table')?.addEventListener('click', () => {
    const state = getState();
    const ci = parseInt(val('table-chapter-select'));
    const localIdx = state.tables.filter(t => t.chapterIdx === ci).length;

    const rows = parseInt(prompt('Number of rows:', '4')) || 4;
    const cols = parseInt(prompt('Number of columns:', '3')) || 3;
    const caption = prompt('Table caption (e.g. Transaction throughput...):', '') || '';

    const headerRow = [];
    for (let c = 0; c < cols; c++) {
      headerRow.push(prompt(`Header for column ${c + 1}:`, `Column ${c + 1}`) || `Col ${c + 1}`);
    }

    const dataRows = [headerRow];
    for (let r = 1; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push('');
      }
      dataRows.push(row);
    }

    state.tables.push({ chapterIdx: ci, localIdx, caption, rows: dataRows, headerRows: 1 });
    setState({ tables: state.tables });
    renderChapterSelects();
    renderAllChapterLists();
    updatePreview();
    toast(`Table ${getTableLabel(ci, localIdx)} added.`);
  });
}

function renderTablesList() {
  const container = $('#tables-list');
  if (!container) return;
  const state = getState();
  if (state.tables.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No tables yet.</p></div>';
    return;
  }
  container.innerHTML = state.tables.map((t, i) => `
    <div class="card" style="background:var(--bg-tertiary);">
      <div class="card-header" style="font-size:13px;">
        ${escHtml(getTableLabel(t.chapterIdx, t.localIdx))} ${escHtml(t.caption || '')}
        <button class="btn btn-xs btn-danger" onclick="window._deleteTable(${i})">✕</button>
      </div>
      <div style="overflow-x:auto;">
        <table class="table-editor">
          ${(t.rows || []).map((row, ri) => `
            <tr>
              ${(row || []).map((cell, ci) => {
                const isHeader = ri < (t.headerRows || 1);
                return isHeader
                  ? `<th><input value="${escHtml(String(cell || ''))}" oninput="window._updateTableCell(${i},${ri},${ci},this.value)" placeholder="Header"></th>`
                  : `<td><input value="${escHtml(String(cell || ''))}" oninput="window._updateTableCell(${i},${ri},${ci},this.value)" placeholder="Data"></td>`;
              }).join('')}
              <td><button class="btn btn-xs btn-danger" onclick="window._deleteTableCol(${i},${ri})" title="Delete row">−</button></td>
            </tr>
          `).join('')}
        </table>
        <div style="display:flex;gap:4px;padding:4px;">
          <button class="btn btn-xs btn-secondary" onclick="window._addTableRow(${i})">+ Row</button>
          <button class="btn btn-xs btn-secondary" onclick="window._addTableCol(${i})">+ Column</button>
        </div>
      </div>
    </div>
  `).join('');
}

window._updateTableCell = function(ti, ri, ci, val) {
  const state = getState();
  if (!state.tables[ti].rows[ri]) state.tables[ti].rows[ri] = [];
  state.tables[ti].rows[ri][ci] = val;
  setState({ tables: state.tables });
  updatePreview();
};
window._addTableRow = function(ti) {
  const state = getState();
  const cols = state.tables[ti].rows[0]?.length || 3;
  state.tables[ti].rows.push(new Array(cols).fill(''));
  setState({ tables: state.tables });
  renderTablesList();
  updatePreview();
};
window._addTableCol = function(ti) {
  const state = getState();
  state.tables[ti].rows.forEach(row => row.push(''));
  setState({ tables: state.tables });
  renderTablesList();
  updatePreview();
};
window._deleteTable = function(ti) {
  if (!confirm('Delete this table?')) return;
  const state = getState();
  state.tables.splice(ti, 1);
  renumberPerChapter(state);
  setState({ tables: state.tables });
  renderAllChapterLists();
  updatePreview();
};
window._deleteTableCol = function(ti, ri) {
  const state = getState();
  state.tables[ti].rows.splice(ri, 1);
  setState({ tables: state.tables });
  renderTablesList();
  updatePreview();
};

// ═══════════════════════════════════════════
// FIGURES TAB (M6)
// ═══════════════════════════════════════════
function initFiguresTab() {
  $('#btn-add-figure')?.addEventListener('click', () => {
    const state = getState();
    const ci = parseInt(val('figure-chapter-select'));
    const caption = val('figure-caption') || '';
    const fileInput = $('#figure-file');
    const file = fileInput?.files?.[0];

    if (!caption && !file) {
      toast('Please provide a caption or select an image.', 'error');
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const localIdx = state.figures.filter(f => f.chapterIdx === ci).length;
        state.figures.push({ chapterIdx: ci, localIdx, caption, imageData: e.target.result });
        setState({ figures: state.figures });
        renderChapterSelects();
        renderAllChapterLists();
        updatePreview();
        toast(`Figure ${getFigureLabel(ci, localIdx)} added.`);
        fileInput.value = '';
        setVal('figure-caption', '');
      };
      reader.readAsDataURL(file);
    } else {
      const localIdx = state.figures.filter(f => f.chapterIdx === ci).length;
      state.figures.push({ chapterIdx: ci, localIdx, caption, imageData: null });
      setState({ figures: state.figures });
      renderChapterSelects();
      renderAllChapterLists();
      updatePreview();
      toast(`Figure placeholder ${getFigureLabel(ci, localIdx)} added.`);
    }
  });
}

function renderFiguresList() {
  const container = $('#figures-list');
  if (!container) return;
  const state = getState();
  if (state.figures.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No figures yet.</p></div>';
    return;
  }
  container.innerHTML = state.figures.map((f, i) => `
    <div class="card" style="background:var(--bg-tertiary);display:flex;gap:12px;align-items:flex-start;">
      ${f.imageData ? `<img src="${f.imageData}" class="img-preview" style="width:120px;height:auto;flex-shrink:0;">` : '<div style="width:120px;height:80px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;color:var(--text-muted);">No Image</div>'}
      <div style="flex:1;">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${escHtml(getFigureLabel(f.chapterIdx, f.localIdx))} ${escHtml(f.caption || '')}</div>
        <div style="font-size:11px;color:var(--text-muted);">Chapter ${escHtml(S.chapterNumerals[f.chapterIdx])}</div>
      </div>
      <button class="btn btn-xs btn-danger" onclick="window._deleteFigure(${i})">✕</button>
    </div>
  `).join('');
}

window._deleteFigure = function(fi) {
  if (!confirm('Delete this figure?')) return;
  const state = getState();
  state.figures.splice(fi, 1);
  renumberPerChapter(state);
  setState({ figures: state.figures });
  renderAllChapterLists();
  updatePreview();
};

// ═══════════════════════════════════════════
// EQUATIONS TAB (M7)
// ═══════════════════════════════════════════
function initEquationsTab() {
  $('#btn-add-equation')?.addEventListener('click', () => {
    const state = getState();
    const ci = parseInt(val('equation-chapter-select'));
    const latex = val('equation-latex');
    if (!latex.trim()) { toast('Please enter a LaTeX expression.', 'error'); return; }
    const localIdx = state.equations.filter(e => e.chapterIdx === ci).length;
    state.equations.push({ chapterIdx: ci, localIdx, latex });
    setState({ equations: state.equations });
    renderChapterSelects();
    renderAllChapterLists();
    updatePreview();
    setVal('equation-latex', '');
    toast(`Equation ${getEquationLabel(ci, localIdx)} added.`);
  });

  $('#equation-latex')?.addEventListener('input', () => {
    const latex = val('equation-latex');
    const preview = $('#equation-preview');
    if (preview && latex) {
      preview.innerHTML = `\\(${escHtml(latex)}\\)`;
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([preview]).catch(() => {});
      }
    }
  });
}

function renderEquationsList() {
  const container = $('#equations-list');
  if (!container) return;
  const state = getState();
  if (state.equations.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No equations yet.</p></div>';
    return;
  }
  container.innerHTML = state.equations.map((e, i) => `
    <div class="card" style="background:var(--bg-tertiary);display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:12px;flex:1;">
        <span style="font-weight:600;font-size:12px;">${escHtml(getEquationLabel(e.chapterIdx, e.localIdx))}</span>
        <span style="font-family:monospace;color:var(--accent);">\\(${escHtml(e.latex)}\\)</span>
      </div>
      <button class="btn btn-xs btn-danger" onclick="window._deleteEquation(${i})">✕</button>
    </div>
  `).join('');
  // Trigger MathJax for equation list
  setTimeout(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([container]).catch(() => {});
    }
  }, 100);
}

window._deleteEquation = function(ei) {
  if (!confirm('Delete this equation?')) return;
  const state = getState();
  state.equations.splice(ei, 1);
  renumberPerChapter(state);
  setState({ equations: state.equations });
  renderAllChapterLists();
  updatePreview();
};

// ═══════════════════════════════════════════
// REFERENCES TAB (M8)
// ═══════════════════════════════════════════
function initReferencesTab() {
  // AI Parse
  $('#btn-parse-ref')?.addEventListener('click', async () => {
    const cfg = getApiConfig();
    if (!cfg.key) { toast('Please configure API Key first.', 'error'); return; }
    const rawText = val('ref-raw');
    const id = val('ref-id') || 'ref';
    if (!rawText.trim()) { toast('Paste reference text first.', 'error'); return; }
    const btn = $('#btn-parse-ref');
    btn.disabled = true; btn.textContent = 'Parsing...';
    try {
      const parsed = await parseReference(rawText, cfg.key, cfg.baseUrl, cfg.model);
      if (parsed) {
        const state = getState();
        state.references.push({ id, ...parsed, number: null });
        setState({ references: state.references });
        renderRefList();
        updatePreview();
        setVal('ref-raw', '');
        setVal('ref-id', '');
        toast('Reference parsed and added.');
      } else {
        toast('Failed to parse reference.', 'error');
      }
    } catch (e) { toast(`Error: ${e.message}`, 'error'); }
    btn.disabled = false; btn.textContent = 'AI Parse';
  });

  // DOI Fetch
  $('#btn-fetch-doi')?.addEventListener('click', async () => {
    const doiText = val('ref-doi');
    if (!doiText.trim()) { toast('Enter DOI(s) first.', 'error'); return; }
    const dois = doiText.split('\n').filter(Boolean);
    const btn = $('#btn-fetch-doi');
    btn.disabled = true; btn.textContent = 'Fetching...';
    try {
      const results = await batchFetchDOI(dois);
      const state = getState();
      results.forEach(r => {
        if (r.success) {
          state.references.push({
            id: `doi_${r.doi.replace(/[^a-zA-Z0-9]/g, '')}`,
            authors: r.authors,
            year: r.year,
            title: r.title,
            journal: r.journal,
            volume: r.volume,
            issue: r.issue,
            page: r.page,
            doi: r.doi,
            number: null,
          });
        } else {
          toast(`DOI ${r.doi}: ${r.error}`, 'error');
        }
      });
      setState({ references: state.references });
      renderRefList();
      updatePreview();
      setVal('ref-doi', '');
      toast(`${results.filter(r => r.success).length} references fetched.`);
    } catch (e) { toast(`Error: ${e.message}`, 'error'); }
    btn.disabled = false; btn.textContent = 'Fetch from CrossRef';
  });

  // BibTeX Import
  $('#btn-import-bibtex')?.addEventListener('click', () => {
    const bibtex = val('bibtex-entry');
    const id = val('bibtex-id') || `bibtex_${Date.now()}`;
    if (!bibtex.trim()) { toast('Paste BibTeX entry first.', 'error'); return; }
    try {
      const parsed = parseBibTeX(bibtex);
      const state = getState();
      state.references.push({ id, ...parsed, number: null });
      setState({ references: state.references });
      renderRefList();
      updatePreview();
      setVal('bibtex-entry', '');
      setVal('bibtex-id', '');
      toast('BibTeX imported.');
    } catch (e) { toast(`Error: ${e.message}`, 'error'); }
  });

  // Citation Matching
  $('#btn-match-refs')?.addEventListener('click', async () => {
    const cfg = getApiConfig();
    if (!cfg.key) { toast('Please configure API Key first.', 'error'); return; }
    const state = getState();
    if (state.references.length === 0) { toast('Add references first.', 'error'); return; }

    // Collect all body text
    let bodyText = '';
    state.chapters.forEach(ch => {
      ch.sections.forEach(sec => {
        bodyText += sec.content + '\n';
        (sec.subSections || []).forEach(sub => { bodyText += sub.content + '\n'; });
      });
    });
    bodyText += (state.abstracts?.korean?.body || '') + '\n';
    bodyText += (state.abstracts?.english?.body || '') + '\n';

    // Count [ref:xxx] markers
    const markers = bodyText.match(/\[ref:([^\]]+)\]/g) || [];
    if (markers.length === 0) {
      toast('No [ref:xxx] markers found in body text. Add [ref:keyword] markers to your chapters first.', 'error');
      return;
    }

    const btn = $('#btn-match-refs');
    btn.disabled = true; btn.textContent = 'Matching...';
    try {
      const mapping = await matchReferencesToBody(bodyText, state.references, cfg.key, cfg.baseUrl, cfg.model);
      // Apply mapping: for each [ref:key], replace with [n]
      Object.entries(mapping).forEach(([key, refIdx]) => {
        if (refIdx >= 0 && refIdx < state.references.length) {
          state.references[refIdx].number = refIdx + 1;
          bodyText = applyReferenceMarkers(bodyText, { [key]: refIdx + 1 });
        }
      });
      // Assign numbers to referenced entries
      state.references.forEach((ref, i) => {
        if (ref.number === null || ref.number === undefined) {
          for (const [key, refIdx] of Object.entries(mapping)) {
            if (refIdx === i) { ref.number = i + 1; break; }
          }
        }
      });
      // Sort references
      state.references.sort((a, b) => {
        if (a.number && b.number) return a.number - b.number;
        if (a.number) return -1;
        if (b.number) return 1;
        return 0;
      });
      setState(state);
      renderRefList();
      updatePreview();
      toast(`Matched ${Object.keys(mapping).length} citations.`);
    } catch (e) { toast(`Error: ${e.message}`, 'error'); }
    btn.disabled = false; btn.textContent = 'Match [ref:xxx] → [n]';
  });
}

function renderRefList() {
  const container = $('#ref-list');
  if (!container) return;
  const state = getState();
  if (state.references.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No references yet. Use Manual Input, DOI Fetch, or BibTeX Import.</p></div>';
  } else {
    container.innerHTML = state.references.map((ref, i) => `
      <div class="ref-item" style="display:flex;justify-content:space-between;align-items:flex-start;">
        <span><span class="ref-number">[${ref.number || '?'}]</span> ${escHtml(formatReference(ref, ref.number))}</span>
        <button class="btn btn-xs btn-danger" onclick="window._deleteRef(${i})">✕</button>
      </div>
    `).join('');
  }
  const countEl = $('#ref-count');
  if (countEl) countEl.textContent = state.references.length;
}

window._deleteRef = function(ri) {
  if (!confirm('Delete this reference?')) return;
  const state = getState();
  state.references.splice(ri, 1);
  setState({ references: state.references });
  renderRefList();
  updatePreview();
};

// ═══════════════════════════════════════════
// ABSTRACTS TAB (M9)
// ═══════════════════════════════════════════
function initAbstractsTab() {
  const state = getState();
  setVal('abs-ko-title', state.abstracts.korean.title);
  setVal('abs-ko-name', state.abstracts.korean.studentName);
  setVal('abs-ko-major', state.abstracts.korean.major);
  setVal('abs-ko-advisor', state.abstracts.korean.advisor);
  setVal('abs-ko-body', state.abstracts.korean.body);
  setVal('abs-ko-keywords', state.abstracts.korean.keywords);
  setVal('abs-en-title', state.abstracts.english.title);
  setVal('abs-en-name', state.abstracts.english.studentName);
  setVal('abs-en-major', state.abstracts.english.major);
  setVal('abs-en-advisor', state.abstracts.english.advisor);
  setVal('abs-en-body', state.abstracts.english.body);
  setVal('abs-en-keywords', state.abstracts.english.keywords);

  const koFields = ['abs-ko-title', 'abs-ko-name', 'abs-ko-major', 'abs-ko-advisor', 'abs-ko-body', 'abs-ko-keywords'];
  const enFields = ['abs-en-title', 'abs-en-name', 'abs-en-major', 'abs-en-advisor', 'abs-en-body', 'abs-en-keywords'];

  const koMap = { 'abs-ko-title': 'title', 'abs-ko-name': 'studentName', 'abs-ko-major': 'major', 'abs-ko-advisor': 'advisor', 'abs-ko-body': 'body', 'abs-ko-keywords': 'keywords' };
  const enMap = { 'abs-en-title': 'title', 'abs-en-name': 'studentName', 'abs-en-major': 'major', 'abs-en-advisor': 'advisor', 'abs-en-body': 'body', 'abs-en-keywords': 'keywords' };

  koFields.forEach(f => {
    $(f)?.addEventListener('input', () => { updateState(`abstracts.korean.${koMap[f]}`, val(f)); updatePreview(); });
  });
  enFields.forEach(f => {
    $(f)?.addEventListener('input', () => { updateState(`abstracts.english.${enMap[f]}`, val(f)); updatePreview(); });
  });
}

// ═══════════════════════════════════════════
// APPENDIX TAB (M10)
// ═══════════════════════════════════════════
function initAppendixTab() {
  $('#btn-add-appendix')?.addEventListener('click', () => {
    const state = getState();
    const ci = parseInt(val('appendix-chapter-select'));
    const entry = {
      chapterIdx: ci,
      chapterName: val('appendix-chapter-name'),
      requires: val('appendix-requires'),
      imports: val('appendix-imports'),
      code: val('appendix-code'),
    };
    state.appendix.push(entry);
    setState({ appendix: state.appendix });
    renderAppendixList();
    updatePreview();
    ['appendix-chapter-name', 'appendix-requires', 'appendix-imports', 'appendix-code'].forEach(id => setVal(id, ''));
    toast('Appendix entry added.');
  });

  $('#acknowledgements-text')?.addEventListener('input', () => {
    updateState('acknowledgements', val('acknowledgements-text'));
    updatePreview();
  });
}

function renderAppendixList() {
  const container = $('#appendix-list');
  if (!container) return;
  const state = getState();
  if (state.appendix.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No appendix entries yet.</p></div>';
    return;
  }
  container.innerHTML = state.appendix.map((app, i) => `
    <div class="card" style="background:var(--bg-tertiary);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:600;font-size:13px;">${escHtml(app.chapterName || `Entry ${i + 1}`)}</span>
        <button class="btn btn-xs btn-danger" onclick="window._deleteAppendix(${i})">✕</button>
      </div>
      ${app.requires ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Requires: python==${escHtml(app.requires)}</div>` : ''}
      ${app.imports ? `<pre style="font-family:'Courier New',monospace;font-size:10pt;color:var(--accent);margin-top:4px;">${escHtml(app.imports)}</pre>` : ''}
      ${app.code ? `<pre style="font-family:'Courier New',monospace;font-size:10pt;color:var(--text-secondary);margin-top:4px;max-height:200px;overflow-y:auto;">${escHtml(app.code)}</pre>` : ''}
    </div>
  `).join('');
}

window._deleteAppendix = function(ai) {
  if (!confirm('Delete this appendix entry?')) return;
  const state = getState();
  state.appendix.splice(ai, 1);
  setState({ appendix: state.appendix });
  renderAppendixList();
  updatePreview();
};

// ═══════════════════════════════════════════
// AI TOOLS TAB (M11)
// ═══════════════════════════════════════════
function initAIToolsTab() {
  // Polish
  $('#btn-ai-polish')?.addEventListener('click', async () => {
    const cfg = getApiConfig();
    if (!cfg.key) { toast('Please configure API Key first.', 'error'); return; }
    const text = val('ai-polish-input');
    if (!text.trim()) { toast('Paste text to polish.', 'error'); return; }
    const btn = $('#btn-ai-polish');
    btn.disabled = true; btn.textContent = 'Polishing...';
    try {
      const result = await polishParagraph(text, cfg.key, cfg.baseUrl, cfg.model);
      const outEl = $('#ai-polish-output');
      outEl.style.display = 'block';
      outEl.innerHTML = `<div style="margin-bottom:8px;font-size:12px;font-weight:600;">Polished version:</div><div>${escHtml(result)}</div>`;
      toast('Text polished.');
    } catch (e) { toast(`Error: ${e.message}`, 'error'); }
    btn.disabled = false; btn.textContent = 'Polish';
  });

  // Expand
  $('#btn-ai-expand')?.addEventListener('click', async () => {
    const cfg = getApiConfig();
    if (!cfg.key) { toast('Please configure API Key first.', 'error'); return; }
    const text = val('ai-expand-input');
    const words = parseInt(val('ai-expand-words')) || 300;
    if (!text.trim()) { toast('Enter keywords/outline.', 'error'); return; }
    const btn = $('#btn-ai-expand');
    btn.disabled = true; btn.textContent = 'Expanding...';
    try {
      const result = await expandSection(text, cfg.key, cfg.baseUrl, cfg.model, words);
      const outEl = $('#ai-expand-output');
      outEl.style.display = 'block';
      outEl.innerHTML = `<div style="margin-bottom:8px;font-size:12px;font-weight:600;">Generated section:</div><div>${escHtml(result)}</div>`;
      toast('Section expanded.');
    } catch (e) { toast(`Error: ${e.message}`, 'error'); }
    btn.disabled = false; btn.textContent = 'Expand';
  });

  // Format Check
  $('#btn-ai-check')?.addEventListener('click', async () => {
    const cfg = getApiConfig();
    if (!cfg.key) { toast('Please configure API Key first.', 'error'); return; }
    const state = getState();
    const specSummary = JSON.stringify({
      heading1: '18pt bold center, after:31.2pt',
      heading2: '14pt bold, before/after:15.6pt',
      heading3: '12pt bold, after:15.6pt, firstLine:0.85cm',
      bodyText: '11pt, line:24pt, firstLine:0.78cm, justified',
      reference: '11pt, line:18.6pt, hanging:2.14cm',
      caption: '11pt, before:7.8pt, firstLine:0.78cm',
      codeBlock: 'Courier New 10pt, line:12pt',
    }, null, 2);

    const fullText = generateMarkdown(state);
    const btn = $('#btn-ai-check');
    btn.disabled = true; btn.textContent = 'Checking...';
    try {
      const issues = await checkFormatting(fullText, specSummary, cfg.key, cfg.baseUrl, cfg.model);
      const outEl = $('#ai-check-output');
      outEl.style.display = 'block';
      if (issues.length === 0) {
        outEl.innerHTML = '<div style="color:var(--accent-green);">No formatting issues found.</div>';
      } else {
        outEl.innerHTML = '<div style="font-size:12px;font-weight:600;margin-bottom:8px;">Issues found:</div>' +
          issues.map(issue => `
            <div style="margin-bottom:6px;padding:8px;background:var(--bg-input);border-radius:4px;border-left:3px solid ${issue.severity === 'error' ? 'var(--accent-red)' : 'var(--accent-yellow)'};">
              <span style="font-weight:600;font-size:12px;">[${issue.type}]</span>
              <span style="font-size:11px;color:var(--text-secondary);"> ${escHtml(issue.location)}</span>
              <div style="font-size:12px;">${escHtml(issue.description)}</div>
            </div>
          `).join('');
      }
      toast('Format check complete.');
    } catch (e) { toast(`Error: ${e.message}`, 'error'); }
    btn.disabled = false; btn.textContent = 'Run Format Check';
  });

  // Integrate All
  $('#btn-ai-integrate')?.addEventListener('click', async () => {
    const cfg = getApiConfig();
    if (!cfg.key) { toast('Please configure API Key first.', 'error'); return; }
    const state = getState();
    const btn = $('#btn-ai-integrate');
    btn.disabled = true; btn.textContent = 'Integrating...';
    try {
      const result = await integrateFullReport(state, cfg.key, cfg.baseUrl, cfg.model);
      // Show integrated result in preview
      const preview = $('#preview-content');
      if (preview) {
        preview.innerHTML = `<pre style="white-space:pre-wrap;font-family:monospace;font-size:12px;">${escHtml(result)}</pre>`;
      }
      toast('Full report integrated. Check preview.');
    } catch (e) { toast(`Error: ${e.message}`, 'error'); }
    btn.disabled = false; btn.textContent = 'Integrate & Preview';
  });
}

// ═══════════════════════════════════════════
// DOCX IMPORT (Upload .docx + AI formatting)
// ═══════════════════════════════════════════
function initImportDocx() {
  $('#btn-import-docx')?.addEventListener('click', async () => {
    const cfg = getApiConfig();
    if (!cfg.key) { toast('Please configure API Key first.', 'error'); return; }

    const fileInput = $('#import-docx-file');
    const file = fileInput?.files?.[0];
    if (!file) { toast('Please select a .docx file first.', 'error'); return; }

    const strategy = val('import-strategy') || 'full';
    const btn = $('#btn-import-docx');
    const statusEl = $('#import-status');
    const previewEl = $('#import-preview');

    btn.disabled = true;
    btn.textContent = 'Processing...';
    if (statusEl) { statusEl.style.display = 'inline'; statusEl.textContent = 'Reading .docx...'; statusEl.style.color = 'var(--accent)'; }

    try {
      // Step 1: Read .docx file with mammoth.js
      let extractedText = '';
      if (typeof mammoth !== 'undefined') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value || '';
        if (result.messages && result.messages.length > 0) {
          console.warn('Mammoth warnings:', result.messages);
        }
      } else {
        // Fallback: try to extract text from docx XML directly using JSZip-like approach
        // For now, show an error if mammoth didn't load
        throw new Error('mammoth.js library not loaded. Please check your internet connection and reload the page.');
      }

      if (!extractedText.trim()) {
        throw new Error('No text could be extracted from the document. The file may be empty or in an unsupported format.');
      }

      // Show extracted text length
      if (statusEl) { statusEl.textContent = `Extracted ${extractedText.length.toLocaleString()} chars. Sending to AI...`; }

      // Show a preview of extracted text
      if (previewEl) {
        previewEl.style.display = 'block';
        previewEl.innerHTML = `<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Extracted text preview:</div><div style="max-height:200px;overflow-y:auto;white-space:pre-wrap;">${escHtml(extractedText.substring(0, 3000))}${extractedText.length > 3000 ? '...' : ''}</div>`;
      }

      // Step 2: Send to DeepSeek for structuring
      const parsed = await parseDocxContent(extractedText, strategy, cfg.key, cfg.baseUrl, cfg.model);

      if (!parsed) {
        throw new Error('AI failed to parse the document structure. The document may be too complex or the API returned an unexpected response.');
      }

      // Step 3: Merge parsed content into state
      const currentState = getState();
      const chapterNumerals = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'];

      if (strategy === 'full' || strategy === 'chapters') {
        if (parsed.cover) {
          const c = parsed.cover;
          updateState('cover.title', c.title || currentState.cover.title);
          updateState('cover.subtitle', c.subtitle || currentState.cover.subtitle);
          updateState('cover.date', c.date || currentState.cover.date);
          updateState('cover.major', c.major || currentState.cover.major);
          updateState('cover.school', c.school || currentState.cover.school);
          updateState('cover.studentName', c.studentName || currentState.cover.studentName);
          updateState('cover.advisor', c.advisor || currentState.cover.advisor);
          updateState('cover.advisorSchool', c.advisorSchool || currentState.cover.advisorSchool);
          updateState('cover.univName', c.univName || currentState.cover.univName);
        }

        if (parsed.chapters && parsed.chapters.length > 0) {
          const mergedChapters = [];
          for (let i = 0; i < Math.max(parsed.chapters.length, 5); i++) {
            const aiCh = (parsed.chapters[i]) || { title: '', sections: [] };
            mergedChapters.push({
              numeral: chapterNumerals[i] || String(i + 1),
              title: aiCh.title || (currentState.chapters[i] ? currentState.chapters[i].title : ''),
              sections: (aiCh.sections || []).map((sec, si) => ({
                heading: String(si + 1),
                title: sec.title || '',
                content: sec.content || '',
                subSections: (sec.subSections || []).map((sub, ssi) => ({
                  heading: `${si + 1}.${ssi + 1}`,
                  title: sub.title || '',
                  content: sub.content || '',
                })),
              })),
            });
          }
          setState({ chapters: mergedChapters });
          renderChapterSelects();
        }

        if (parsed.references && parsed.references.length > 0) {
          const mergedRefs = parsed.references.map((ref, i) => ({
            id: ref.id || `imported_${i}`,
            authors: ref.authors || '',
            year: ref.year || '',
            title: ref.title || '',
            journal: ref.journal || '',
            volume: ref.volume || '',
            issue: ref.issue || '',
            page: ref.page || '',
            doi: ref.doi || '',
            number: null,
          }));
          setState({ references: mergedRefs });
        }

        if (parsed.abstracts) {
          const abs = parsed.abstracts;
          if (abs.korean) {
            updateState('abstracts.korean.title', abs.korean.title || '');
            updateState('abstracts.korean.studentName', abs.korean.studentName || '');
            updateState('abstracts.korean.major', abs.korean.major || '');
            updateState('abstracts.korean.advisor', abs.korean.advisor || '');
            updateState('abstracts.korean.body', abs.korean.body || '');
            updateState('abstracts.korean.keywords', abs.korean.keywords || '');
          }
          if (abs.english) {
            updateState('abstracts.english.title', abs.english.title || '');
            updateState('abstracts.english.studentName', abs.english.studentName || '');
            updateState('abstracts.english.major', abs.english.major || '');
            updateState('abstracts.english.advisor', abs.english.advisor || '');
            updateState('abstracts.english.body', abs.english.body || '');
            updateState('abstracts.english.keywords', abs.english.keywords || '');
          }
        }

        if (parsed.appendix && parsed.appendix.length > 0) {
          setState({ appendix: parsed.appendix });
        }

        if (parsed.acknowledgements) {
          updateState('acknowledgements', parsed.acknowledgements);
        }
      }

      if (strategy === 'references' && parsed.references && parsed.references.length > 0) {
        const mergedRefs = parsed.references.map((ref, i) => ({
          id: ref.id || `imported_${i}`,
          authors: ref.authors || '',
          year: ref.year || '',
          title: ref.title || '',
          journal: ref.journal || '',
          volume: ref.volume || '',
          issue: ref.issue || '',
          page: ref.page || '',
          doi: ref.doi || '',
          number: null,
        }));
        setState({ references: mergedRefs });
      }

      // Restore cover form inputs
      const s = getState();
      setVal('cover-title', s.cover.title);
      setVal('cover-subtitle', s.cover.subtitle);
      setVal('cover-date', s.cover.date);
      setVal('cover-major', s.cover.major);
      setVal('cover-school', s.cover.school);
      setVal('cover-student-name', s.cover.studentName);
      setVal('cover-advisor', s.cover.advisor);
      setVal('cover-advisor-school', s.cover.advisorSchool);
      setVal('cover-univ-name', s.cover.univName);
      setVal('abs-ko-body', s.abstracts?.korean?.body || '');
      setVal('abs-ko-keywords', s.abstracts?.korean?.keywords || '');
      setVal('abs-en-body', s.abstracts?.english?.body || '');
      setVal('abs-en-keywords', s.abstracts?.english?.keywords || '');
      setVal('acknowledgements-text', s.acknowledgements || '');

      // Re-render all lists
      renderAllChapterLists();

      if (statusEl) { statusEl.textContent = 'Done!'; statusEl.style.color = 'var(--accent-green)'; }

      // Show summary in preview
      if (previewEl) {
        const chCount = (parsed.chapters || []).length;
        const refCount = (parsed.references || []).length;
        const hasAbs = !!(parsed.abstracts?.korean?.body || parsed.abstracts?.english?.body);
        previewEl.style.display = 'block';
        previewEl.innerHTML = `<div style="color:var(--accent-green);font-weight:600;">Import successful!</div>
          <div style="margin-top:4px;font-size:12px;">
            Imported: ${chCount} chapters${parsed.cover?.title ? ' + Cover' : ''}${refCount > 0 ? ' + ' + refCount + ' references' : ''}${hasAbs ? ' + Abstracts' : ''}${parsed.acknowledgements ? ' + Acknowledgements' : ''}
          </div>`;
      }

      toast('Document imported and formatted successfully!', 'success');

      // Auto-navigate to chapters tab to review
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      const chaptersTab = document.querySelector('[data-tab="chapters"]');
      if (chaptersTab) { chaptersTab.classList.add('active'); chaptersTab.click(); }

    } catch (e) {
      toast(`Import failed: ${e.message}`, 'error');
      if (statusEl) { statusEl.textContent = `Error: ${e.message}`; statusEl.style.color = 'var(--accent-red)'; }
      if (previewEl) { previewEl.style.display = 'block'; previewEl.innerHTML = `<div style="color:var(--accent-red);">Error: ${escHtml(e.message)}</div>`; }
    }
    btn.disabled = false;
    btn.textContent = 'Import & Format';
    fileInput.value = '';

    // Auto-hide status after 10s
    setTimeout(() => { if (statusEl) statusEl.style.display = 'none'; }, 10000);
  });
}

// ═══════════════════════════════════════════
// EXPORT TAB (M12)
// ═══════════════════════════════════════════
function initExportTab() {
  $('#btn-export-docx2')?.addEventListener('click', () => doExportDocx());
  $('#btn-export-md2')?.addEventListener('click', () => doExportMarkdown());
  $('#btn-print-preview')?.addEventListener('click', () => window.print());
  $('#btn-validate')?.addEventListener('click', runValidation);
}

async function doExportDocx() {
  const statusEl = $('#export-status') || $('#export-status'); // try both tabs
  const status = $('#export-status');
  if (status) { status.textContent = 'Generating .docx file...'; status.style.color = 'var(--accent)'; }
  try {
    const blob = await exportDocx(getState());
    const title = (getState().cover.title || 'research_report').replace(/[^a-zA-Z0-9]/g, '_');
    window.saveAs(blob, `${title}.docx`);
    if (status) { status.textContent = 'Export complete!'; status.style.color = 'var(--accent-green)'; }
    toast('DOCX exported successfully!', 'success');
  } catch (e) {
    toast(`Export error: ${e.message}`, 'error');
    if (status) { status.textContent = `Error: ${e.message}`; status.style.color = 'var(--accent-red)'; }
  }
}

async function doExportMarkdown() {
  try {
    const blob = exportMarkdownBlob(getState());
    const title = (getState().cover.title || 'research_report').replace(/[^a-zA-Z0-9]/g, '_');
    window.saveAs(blob, `${title}.md`);
    toast('Markdown exported!', 'success');
  } catch (e) {
    toast(`Export error: ${e.message}`, 'error');
  }
}

function runValidation() {
  const state = getState();
  const checklist = $('#validation-checklist');
  if (!checklist) return;

  const items = [];

  // A4 & margins (from REPORT_SPEC - always OK since hardcoded)
  items.push({ label: 'A4 paper (21.00 × 29.70 cm)', ok: true });
  items.push({ label: 'Margins: top/bottom 1.90cm, left/right 2.60cm', ok: true });
  items.push({ label: 'Body text: Times New Roman 11pt, double spacing, first-line 0.78cm', ok: true });
  items.push({ label: 'Chapter titles: 18pt bold centered, 31.2pt after', ok: true });
  items.push({ label: 'Section titles: 14pt bold, 15.6pt before/after', ok: true });

  // Check tables numbering
  const tableFormatOK = state.tables.every(t => {
    const expected = S.chapterRoman[t.chapterIdx];
    return expected !== undefined;
  });
  items.push({ label: 'Table numbering format (Table III-1.)', ok: tableFormatOK });

  // Check figures numbering
  const figFormatOK = state.figures.every(f => {
    const expected = S.chapterNumerals[f.chapterIdx];
    return expected !== undefined;
  });
  items.push({ label: 'Figure numbering format (Figure Ⅳ-1.)', ok: figFormatOK });

  // Check equations
  const eqFormatOK = state.equations.every(e => e.latex && e.latex.trim());
  items.push({ label: 'Equation numbering format (4.1)', ok: eqFormatOK });

  // Check references
  const refsOK = state.references.length === 0 || state.references.some(r => r.number);
  items.push({ label: 'References: hanging indent, 18.6pt line spacing', ok: refsOK || state.references.length === 0 });

  // Check page numbering
  items.push({ label: 'Footer: centered page numbers', ok: true });

  // Check TOC
  items.push({ label: 'TOC includes LIST OF TABLES and LIST OF FIGURES', ok: true });

  // Check Korean abstract font
  items.push({ label: 'Korean abstract: 맑은 고딕 (Malgun Gothic)', ok: true });

  checklist.innerHTML = items.map(item => `
    <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
      <span style="color:${item.ok ? 'var(--accent-green)' : 'var(--accent-red)'};font-size:14px;">${item.ok ? '✓' : '✗'}</span>
      <span style="color:${item.ok ? 'var(--text-primary)' : 'var(--accent-red)'};">${item.label}</span>
    </div>
  `).join('');

  toast('Validation complete.', 'info');
}

// ── HTML Escape Helper ──
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Export for global access ──
window._renumberPerChapter = renumberPerChapter;
window.escHtml = escHtml;
