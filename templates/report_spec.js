// ── Research Report Formatting Specification ──
// All values in twips (1 inch = 1440 twips, 1 cm = 567 twips)
// Extracted from the master template .docx

export const REPORT_SPEC = {

  // ── Page Setup ──
  page: {
    width:        11906,  // 21.00 cm (A4)
    height:       16838,  // 29.70 cm (A4)
    marginTop:    1077,   // 1.90 cm
    marginBottom: 1077,   // 1.90 cm
    marginLeft:   1474,   // 2.60 cm
    marginRight:  1474,   // 2.60 cm
    headerDist:   851,    // 1.50 cm
    footerDist:   851,    // 1.50 cm
    gutter:       0,
  },

  // ── Fonts ──
  fonts: {
    latin:    'Times New Roman',
    eastAsia:  'SimSun',
    korean:   '맑은 고딕',     // 맑은 고딕
    cover:    '한양신명조', // 한양신명조
    dengxian:  'DengXian',
  },

  // ── Paragraph Styles ──
  styles: {
    coverText: {
      fontSize:     32,        // 16pt (half-points)
      lineSpacing:  240,       // 12pt single
      spaceBefore:  0,
      spaceAfter:   0,
      alignment:    'center',
      fontLatin:    'Times New Roman',
      fontEA:       '한양신명조', // 한양신명조
    },
    reportTitle: {
      fontSize:     56,        // 28pt
      spaceAfter:   80,        // 4pt
      alignment:    'center',
    },
    reportSubtitle: {
      fontSize:     28,        // 14pt
      lineSpacing:  278,       // 13.9pt
      spaceAfter:   160,       // 8pt
      alignment:    'center',
      color:        '595959',
    },
    heading1: {
      fontSize:     36,        // 18pt
      lineSpacing:  480,       // 24pt double
      spaceBefore:  0,
      spaceAfter:   624,       // 31.2pt
      alignment:    'center',
      bold:         true,
      fontLatin:    'Times New Roman',
      fontEA:       'DengXian',
    },
    heading2: {
      fontSize:     28,        // 14pt
      lineSpacing:  480,       // 24pt
      spaceBefore:  312,       // 15.6pt
      spaceAfter:   312,       // 15.6pt
      bold:         true,
      fontLatin:    'Times New Roman',
    },
    heading3: {
      fontSize:     24,        // 12pt
      lineSpacing:  480,       // 24pt
      spaceBefore:  0,
      spaceAfter:   312,       // 15.6pt
      bold:         true,
      indent:       { firstLine: 480 },
      fontLatin:    'Times New Roman',
    },
    bodyText: {
      fontSize:     22,        // 11pt
      lineSpacing:  480,       // 24pt double
      spaceBefore:  0,
      spaceAfter:   0,
      alignment:    'both',
      indent:       { firstLine: 440 },
      fontLatin:    'Times New Roman',
      fontEA:       'SimSun',
    },
    caption: {
      fontSize:     22,        // 11pt
      lineSpacing:  480,       // 24pt
      spaceBefore:  156,       // 7.8pt
      spaceAfter:   0,
      indent:       { firstLine: 440 },
      fontLatin:    'Times New Roman',
    },
    reference: {
      fontSize:     22,        // 11pt
      lineSpacing:  372,       // 18.6pt ≈ 1.55x
      spaceBefore:  0,
      spaceAfter:   0,
      indent:       { left: 1210, hanging: 1210 },
      fontLatin:    'Times New Roman',
    },
    toc1: {
      fontSize:     22,        // 11pt
      lineSpacing:  372,       // 18.6pt
      indent:       { left: 0 },
    },
    toc2: {
      fontSize:     22,        // 11pt
      lineSpacing:  372,       // 18.6pt
      indent:       { left: 420 },
    },
    toc3: {
      fontSize:     22,        // 11pt
      lineSpacing:  372,       // 18.6pt
      indent:       { left: 840 },
    },
    codeBlock: {
      fontSize:     20,        // 10pt
      lineSpacing:  240,       // 12pt single
      fontLatin:    'Courier New',
    },
    koreanBody: {
      fontSize:     22,        // 11pt
      lineSpacing:  480,       // 24pt
      indent:       { firstLine: 440 },
      fontEA:       '맑은 고딕', // 맑은 고딕
    },
  },

  // ── Table ──
  table: {
    borderStyle:     'single',
    borderSize:      4,        // 0.5pt
    borderColor:     'auto',
    cellMarginLeft:  108,      // 5.4pt
    cellMarginRight: 108,      // 5.4pt
    cellMarginTop:   0,
    cellMarginBottom: 0,
  },

  // ── List ──
  list: {
    bullet: '•',          // •
    level1: { left: 720,  hanging: 360 },
    level2: { left: 1440, hanging: 360 },
    level3: { left: 2160, hanging: 360 },
  },

  // ── Footer ──
  footer: {
    content:   'PAGE_NUMBER',
    alignment: 'center',
    startPage: 1,
  },

  // ── Chapter Numbering System ──
  chapterNumerals: ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ'], // ⅠⅡⅢⅣⅤⅥⅦ
  chapterRoman:    ['I',  'II', 'III', 'IV', 'V',  'VI', 'VII'],

  // ── Default 5-Chapter Structure ──
  defaultChapters: [
    {
      numeral: 'Ⅰ', // Ⅰ
      title: 'Introduction',
      sections: [
        { heading: '1', title: 'Research Background', content: '', subSections: [] },
        { heading: '2', title: 'Research Significance & Objectives', content: '', subSections: [] },
        { heading: '3', title: 'Research Methods & Contributions', content: '', subSections: [] },
        { heading: '4', title: 'Thesis Organization', content: '', subSections: [] },
      ],
    },
    {
      numeral: 'Ⅱ', // Ⅱ
      title: 'Literature Review',
      sections: [],
    },
    {
      numeral: 'Ⅲ', // Ⅲ
      title: '',
      sections: [
        { heading: '1', title: 'Introduction', content: '', subSections: [] },
        { heading: '2', title: 'Related Work', content: '', subSections: [] },
        { heading: '3', title: 'Proposed Method', content: '', subSections: [] },
        { heading: '4', title: 'Experimental Evaluation', content: '', subSections: [] },
        { heading: '5', title: 'Summary', content: '', subSections: [] },
      ],
    },
    {
      numeral: 'Ⅳ', // Ⅳ
      title: '',
      sections: [
        { heading: '1', title: 'Introduction', content: '', subSections: [] },
        { heading: '2', title: 'Related Work', content: '', subSections: [] },
        { heading: '3', title: 'Proposed Method', content: '', subSections: [] },
        { heading: '4', title: 'Experimental Evaluation', content: '', subSections: [] },
        { heading: '5', title: 'Summary', content: '', subSections: [] },
      ],
    },
    {
      numeral: 'Ⅴ', // Ⅴ
      title: 'Conclusion and Future Outlook',
      sections: [
        { heading: '1', title: 'Summary of Achievements', content: '', subSections: [] },
        { heading: '2', title: 'Contributions', content: '', subSections: [] },
        { heading: '3', title: 'Limitations', content: '', subSections: [] },
        { heading: '4', title: 'Future Directions', content: '', subSections: [] },
        { heading: '5', title: 'Conclusion', content: '', subSections: [] },
      ],
    },
  ],
};
