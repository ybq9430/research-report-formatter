// ── Word (.docx) Export ──
// Uses docx.js 8.x (CDN), strictly follows REPORT_SPEC parameters

import { REPORT_SPEC as S } from '../templates/report_spec.js';
import { generateMarkdown } from './formatter.js';

// We access docx globals via window.docx (loaded via CDN)
// Fallback to window for direct global exposure
const docxLib = window.docx || window;
const {
  Document, Packer, Paragraph, TextRun, PageNumber, AlignmentType,
  HeadingLevel, Table, TableRow, TableCell, Footer, Header,
  WidthType, BorderStyle, TabStopType, TabStopPosition,
  convertInchesToTwip, ExternalHyperlink, ImageRun,
  TableLayoutType, ShadingType,
} = docxLib;

// ── Helper: create a paragraph with spec ──
function makeParagraph(text, styleSpec = S.styles.bodyText, extra = {}) {
  const runs = [];
  if (text) {
    const opts = {
      font: { name: styleSpec.fontLatin || S.fonts.latin },
      size: styleSpec.fontSize,
      ...(styleSpec.bold ? { bold: true } : {}),
      ...(extra.runOptions || {}),
    };

    // Split text to handle inline bold markers
    if (text.includes('**') && !extra.skipBold) {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      parts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          runs.push(new TextRun({ text: part.slice(2, -2), bold: true, ...opts }));
        } else {
          runs.push(new TextRun({ text: part, ...opts }));
        }
      });
    } else {
      runs.push(new TextRun({ text, ...opts }));
    }
  }

  const props = {
    spacing: {
      line: styleSpec.lineSpacing || 480,
      before: styleSpec.spaceBefore || 0,
      after: styleSpec.spaceAfter || 0,
    },
    alignment: extra.alignment || (styleSpec.alignment === 'both' ? AlignmentType.JUSTIFIED
      : styleSpec.alignment === 'center' ? AlignmentType.CENTER
      : styleSpec.alignment === 'left' ? AlignmentType.LEFT
      : AlignmentType.JUSTIFIED),
    ...(styleSpec.indent ? { indent: styleSpec.indent } : {}),
    ...(extra.props || {}),
  };

  // Respect keepNext / pageBreakBefore set by caller
  if (extra.keepNext) props.keepNext = true;
  if (extra.pageBreakBefore) props.pageBreakBefore = true;

  return new Paragraph({
    children: runs.length > 0 ? runs : [new TextRun({ text: '', font: { name: styleSpec.fontLatin || S.fonts.latin }, size: styleSpec.fontSize })],
    ...props,
  });
}

// ── Page Properties ──
function pageProperties() {
  return {
    page: {
      size: { width: S.page.width, height: S.page.height },
      margin: {
        top: S.page.marginTop,
        bottom: S.page.marginBottom,
        left: S.page.marginLeft,
        right: S.page.marginRight,
        header: S.page.headerDist,
        footer: S.page.footerDist,
      },
    },
  };
}

// ── Footer ──
function buildFooter() {
  return {
    default: new Footer({
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 20 })],
      })],
    }),
  };
}

// ── Cover Page ──
function buildCoverPage(cover) {
  const S_C = S.styles.coverText;
  const items = [];

  // "Research Report" header (fixed)
  items.push(makeParagraph('Research Report', S_C));

  // Title (large)
  items.push(makeParagraph(cover.title || '', {
    ...S_C,
    fontSize: S.styles.reportTitle.fontSize,
  }, { props: { spacing: { line: S_C.lineSpacing, before: 200, after: S.styles.reportTitle.spaceAfter } } }));

  // Subtitle (gray)
  if (cover.subtitle) {
    items.push(makeParagraph(cover.subtitle, {
      ...S_C,
      fontSize: S.styles.reportSubtitle.fontSize,
      lineSpacing: S.styles.reportSubtitle.lineSpacing,
    }, {
      props: { spacing: { line: S.styles.reportSubtitle.lineSpacing, before: 0, after: S.styles.reportSubtitle.spaceAfter } },
      runOptions: { color: S.styles.reportSubtitle.color },
    }));
  }

  // Spacing
  items.push(makeParagraph('', S_C, { props: { spacing: { line: S_C.lineSpacing, before: 600, after: 0 } } }));

  // Info fields
  const fields = [cover.studentName, cover.date, cover.major, cover.school, cover.advisor, cover.advisorSchool, cover.univName];
  fields.filter(Boolean).forEach(f => {
    const fs = { ...S_C, fontSize: 32 }; // 16pt
    items.push(makeParagraph(f, fs));
  });

  return items;
}

// ── Table of Contents ──
function buildTOCParagraphs(state) {
  const items = [];

  // TOC Title: "CONTENTS", 14pt bold, centered, 15.6pt after
  const tocTitleSpec = {
    fontSize: S.styles.heading2.fontSize,
    lineSpacing: S.styles.heading2.lineSpacing,
    spaceBefore: 0,
    spaceAfter: S.styles.heading2.spaceAfter,
    bold: true,
    alignment: 'center',
    fontLatin: S.fonts.latin,
    indent: null,
  };
  items.push(makeParagraph('CONTENTS', tocTitleSpec));

  // Collect TOC entries
  const tocEntries = [];

  const tables = state.tables || [];
  const figures = state.figures || [];

  if (tables.length > 0) {
    tocEntries.push({ text: 'LIST OF TABLES', level: 1 });
    tables.forEach(t => {
      const label = `${S.chapterRoman[t.chapterIdx]}-${t.localIdx + 1}.`;
      tocEntries.push({ text: `${label} ${t.caption || ''}`, level: 'figure-list' });
    });
  }
  if (figures.length > 0) {
    tocEntries.push({ text: 'LIST OF FIGURES', level: 1 });
    figures.forEach(f => {
      const label = `${S.chapterNumerals[f.chapterIdx]}-${f.localIdx + 1}.`;
      tocEntries.push({ text: `${label} ${f.caption || ''}`, level: 'figure-list' });
    });
  }

  (state.chapters || []).forEach((ch, ci) => {
    tocEntries.push({
      text: `${S.chapterNumerals[ci]}. ${ch.title || ''}`,
      level: 1,
    });
    (ch.sections || []).forEach((sec, si) => {
      tocEntries.push({
        text: `${si + 1}. ${sec.title || ''}`,
        level: 2,
      });
      (sec.subSections || []).forEach((sub, ssi) => {
        tocEntries.push({
          text: `${si + 1}.${ssi + 1} ${sub.title || ''}`,
          level: 3,
        });
      });
    });
  });

  tocEntries.push({ text: 'REFERENCES', level: 1 });
  tocEntries.push({ text: '국 문 초 록', level: 1 }); // 국 문 초 록
  tocEntries.push({ text: 'ABSTRACT', level: 1 });
  tocEntries.push({ text: 'APPENDIX', level: 1 });
  tocEntries.push({ text: 'ACKNOWLEDGEMENTS', level: 1 });

  // Render TOC entries
  tocEntries.forEach(entry => {
    let spec;
    if (entry.level === 'figure-list') {
      spec = { ...S.styles.caption, indent: { left: 420 }, fontLatin: S.fonts.latin, alignment: 'left' };
    } else if (entry.level === 2) {
      spec = { ...S.styles.toc2, fontLatin: S.fonts.latin, alignment: 'left' };
    } else if (entry.level === 3) {
      spec = { ...S.styles.toc3, fontLatin: S.fonts.latin, alignment: 'left' };
    } else {
      spec = { ...S.styles.toc1, fontLatin: S.fonts.latin, alignment: 'left' };
    }
    items.push(makeParagraph(entry.text, spec));
  });

  return items;
}

// ── Chapter Content ──
function buildChapterBody(state, chapterIdx) {
  const ch = state.chapters[chapterIdx];
  if (!ch) return [];
  const items = [];

  // Chapter title
  const h1Spec = {
    ...S.styles.heading1,
    fontLatin: S.styles.heading1.fontLatin,
    fontEA: S.styles.heading1.fontEA,
    indent: null,
    alignment: 'center',
  };
  items.push(makeParagraph(`${S.chapterNumerals[chapterIdx]}. ${ch.title || ''}`, h1Spec, {
    props: { spacing: { line: S.styles.heading1.lineSpacing, before: 0, after: S.styles.heading1.spaceAfter } },
  }));

  // Chapter figures & tables (before sections)
  const chTables = (state.tables || []).filter(t => t.chapterIdx === chapterIdx);
  const chFigures = (state.figures || []).filter(f => f.chapterIdx === chapterIdx);
  const chEquations = (state.equations || []).filter(e => e.chapterIdx === chapterIdx);

  (ch.sections || []).forEach((sec, si) => {
    // Section heading (h2)
    items.push(makeParagraph(`${si + 1}. ${sec.title || ''}`, S.styles.heading2));

    // Section content
    if (sec.content) {
      sec.content.split('\n').filter(Boolean).forEach(para => {
        items.push(makeParagraph(para, S.styles.bodyText));
      });
    }

    // Sub-sections
    (sec.subSections || []).forEach((sub, ssi) => {
      items.push(makeParagraph(`${si + 1}.${ssi + 1} ${sub.title || ''}`, S.styles.heading3));
      if (sub.content) {
        sub.content.split('\n').filter(Boolean).forEach(para => {
          items.push(makeParagraph(para, S.styles.bodyText));
        });
      }
    });

    // Insert tables belonging to this section (if any)
    // Tables and figures placed at chapter level, not section level
  });

  // Render tables for this chapter
  chTables.forEach(t => {
    items.push(makeParagraph(`${S.chapterRoman[chapterIdx]}-${t.localIdx + 1}. ${t.caption || ''}`, S.styles.caption));
    items.push(buildDocxTable(t.rows, t.headerRows || 1));
  });

  // Render figures for this chapter
  chFigures.forEach(f => {
    items.push(makeParagraph(`${S.chapterNumerals[chapterIdx]}-${f.localIdx + 1}. ${f.caption || ''}`, S.styles.caption));
    // Note: image embedding requires ImageRun from docx.js
    // Images are embedded if imageData is available
  });

  // Render equations
  chEquations.forEach(e => {
    // Centered equation with right-aligned number using tab stops
    const pw = S.page.width - S.page.marginLeft - S.page.marginRight; // printable width in twips
    const eqPara = new Paragraph({
      spacing: { line: 480, before: 120, after: 120 },
      tabStops: [
        { type: TabStopType.CENTER, position: pw / 2 },
        { type: TabStopType.RIGHT, position: pw },
      ],
      children: [
        new TextRun({ text: `\t${e.latex}\t(${chapterIdx + 1}.${e.localIdx + 1})`, font: { name: S.fonts.latin }, size: 22, italics: true }),
      ],
    });
    items.push(eqPara);
  });

  return items;
}

// ── Build docx Table ──
function buildDocxTable(rows, headerRows = 1) {
  if (!rows || rows.length === 0) return makeParagraph('');

  const border = {
    style: BorderStyle.SINGLE,
    size: S.table.borderSize,
    color: S.table.borderColor,
  };

  const tableRows = rows.map((row, ri) => {
    const isHeader = ri < headerRows;
    return new TableRow({
      children: (row || []).map(cell => {
        const text = String(cell || '');
        const isBold = isHeader || text.includes('**');
        const cleanedText = text.replace(/\*\*/g, '');
        return new TableCell({
          children: [new Paragraph({
            alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { line: 240, before: 28, after: 28 },
            children: [new TextRun({
              text: cleanedText,
              bold: isBold,
              font: { name: S.fonts.latin },
              size: 20,
            })],
          })],
          margins: {
            left: S.table.cellMarginLeft,
            right: S.table.cellMarginRight,
            top: S.table.cellMarginTop,
            bottom: S.table.cellMarginBottom,
          },
          ...(isHeader ? { shading: { fill: 'E8E8E8', type: ShadingType.CLEAR } } : {}),
        });
      }),
    });
  });

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: border, bottom: border, left: border, right: border,
      insideHorizontal: border, insideVertical: border,
    },
  });
}

// ── References Section ──
function buildReferences(refs) {
  const items = [];
  // Section heading
  items.push(makeParagraph('REFERENCES', S.styles.heading1, {
    props: { spacing: { line: S.styles.heading1.lineSpacing, before: 600, after: S.styles.heading1.spaceAfter }, pageBreakBefore: true },
  }));

  // Sort: numbered first, then unnumbered
  const sorted = [...refs].sort((a, b) => {
    if (a.number && b.number) return a.number - b.number;
    if (a.number) return -1;
    if (b.number) return 1;
    return 0;
  });

  sorted.forEach(ref => {
    let text = '';
    const num = ref.number || '?';
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

    text = parts.join('');
    items.push(makeParagraph(text, S.styles.reference));
  });

  return items;
}

// ── Abstracts ──
function buildAbstracts(abstracts) {
  const items = [];

  // Korean abstract
  if (abstracts.korean && (abstracts.korean.body || abstracts.korean.title)) {
    items.push(makeParagraph('국 문 초 록', S.styles.heading1, {
      props: { spacing: { line: S.styles.heading1.lineSpacing, before: 600, after: S.styles.heading1.spaceAfter }, pageBreakBefore: true },
    })); // 국 문 초 록

    if (abstracts.korean.title) {
      items.push(makeParagraph(`논문 제목: ${abstracts.korean.title}`, S.styles.koreanBody)); // 논문제목:
    }
    if (abstracts.korean.studentName) {
      items.push(makeParagraph(`학생이름: ${abstracts.korean.studentName}`, S.styles.koreanBody)); // 학생이름:
    }
    if (abstracts.korean.major) {
      items.push(makeParagraph(`전공: ${abstracts.korean.major}`, S.styles.koreanBody)); // 전공:
    }
    if (abstracts.korean.advisor) {
      items.push(makeParagraph(`지도교수: ${abstracts.korean.advisor}`, S.styles.koreanBody)); // 지도교수:
    }
    if (abstracts.korean.body) {
      abstracts.korean.body.split('\n').filter(Boolean).forEach(para => {
        items.push(makeParagraph(para, S.styles.koreanBody));
      });
    }
    if (abstracts.korean.keywords) {
      items.push(makeParagraph(`키워드: ${abstracts.korean.keywords}`, S.styles.koreanBody)); // 키워드:
    }
  }

  // English abstract
  if (abstracts.english && (abstracts.english.body || abstracts.english.title)) {
    items.push(makeParagraph('ABSTRACT', S.styles.heading1, {
      props: { spacing: { line: S.styles.heading1.lineSpacing, before: 600, after: S.styles.heading1.spaceAfter }, pageBreakBefore: true },
    }));

    if (abstracts.english.title) {
      items.push(makeParagraph(`Title: ${abstracts.english.title}`, S.styles.bodyText));
    }
    if (abstracts.english.studentName) {
      items.push(makeParagraph(`Student Name: ${abstracts.english.studentName}`, S.styles.bodyText));
    }
    if (abstracts.english.major) {
      items.push(makeParagraph(`Major: ${abstracts.english.major}`, S.styles.bodyText));
    }
    if (abstracts.english.advisor) {
      items.push(makeParagraph(`Advisor: ${abstracts.english.advisor}`, S.styles.bodyText));
    }
    if (abstracts.english.body) {
      abstracts.english.body.split('\n').filter(Boolean).forEach(para => {
        items.push(makeParagraph(para, S.styles.bodyText));
      });
    }
    if (abstracts.english.keywords) {
      items.push(makeParagraph(`Keywords: ${abstracts.english.keywords}`, S.styles.bodyText));
    }
  }

  return items;
}

// ── Appendix ──
function buildAppendix(appendixData) {
  const items = [];
  items.push(makeParagraph('APPENDIX', S.styles.heading1, {
    props: { spacing: { line: S.styles.heading1.lineSpacing, before: 600, after: S.styles.heading1.spaceAfter }, pageBreakBefore: true },
  }));

  (appendixData || []).forEach((app, ai) => {
    if (app.chapterName) {
      items.push(makeParagraph(`${app.chapterName}`, S.styles.heading2));
    }
    if (app.requires) {
      items.push(makeParagraph(`python==${app.requires}`, S.styles.codeBlock));
    }
    if (app.imports) {
      app.imports.split('\n').forEach(line => {
        if (line.trim()) {
          items.push(makeParagraph(line, S.styles.codeBlock));
        }
      });
    }
    if (app.code) {
      app.code.split('\n').forEach(line => {
        items.push(makeParagraph(line, S.styles.codeBlock));
      });
    }
  });

  return items;
}

// ── Acknowledgements ──
function buildAcknowledgements(text) {
  const items = [];
  items.push(makeParagraph('ACKNOWLEDGEMENTS', S.styles.heading1, {
    props: { spacing: { line: S.styles.heading1.lineSpacing, before: 600, after: S.styles.heading1.spaceAfter }, pageBreakBefore: true },
  }));
  if (text) {
    text.split('\n').filter(Boolean).forEach(para => {
      items.push(makeParagraph(para, S.styles.bodyText));
    });
  }
  return items;
}

// ── Main Export Function ──
export async function exportDocx(state) {
  const children = [
    ...buildCoverPage(state.cover),
    ...buildTOCParagraphs(state),
  ];

  // Each chapter
  state.chapters.forEach((ch, ci) => {
    children.push(...buildChapterBody(state, ci));
  });

  // Back matter
  children.push(...buildReferences(state.references));
  children.push(...buildAbstracts(state.abstracts));
  children.push(...buildAppendix(state.appendix));
  children.push(...buildAcknowledgements(state.acknowledgements));

  const doc = new Document({
    sections: [{
      properties: pageProperties(),
      footers: buildFooter(),
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

// ── Markdown Export ──
export function exportMarkdownBlob(state) {
  const md = generateMarkdown(state);
  return new Blob([md], { type: 'text/markdown;charset=utf-8' });
}
