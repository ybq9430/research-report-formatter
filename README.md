# Research Report Auto-Formatter (RRAF)

A pure front-end SPA for intelligent academic research report formatting. Built for master's thesis requirements at Youngsan University — **write your content, get a perfectly formatted Word document with one click**.

## Features

- **Zero-dependency server** — open `index.html` directly in your browser
- **AI-powered** via DeepSeek API (polish, expand, format check, citation matching)
- **Word export** using docx.js with pixel-perfect adherence to template specifications
- **Live preview** with 500ms debounce (left editor, right preview)
- **Free DOI fetching** via CrossRef REST API (no API key required)

### Module Overview

| # | Module | Description |
|---|--------|-------------|
| M1 | API Config | DeepSeek API Key, Base URL, model selection, connection test |
| M2 | Cover Page | Thesis info (28pt title, 16pt body, centered, Times New Roman) |
| M3 | Auto TOC | 3-level TOC with LIST OF TABLES / LIST OF FIGURES |
| M4 | Chapter Editor | 5-chapter structure, add/delete sections and subsections |
| M5 | Tables | Auto-numbered `Table III-1.` format, inline cell editor |
| M6 | Figures | Auto-numbered `Figure Ⅳ-1.` format, image upload (PNG/JPG/SVG) |
| M7 | Equations | LaTeX input with `(4.1)` numbering, MathJax rendering |
| M8 | References | Manual / DOI CrossRef / BibTeX import, `[ref:xxx]` auto-matching |
| M9 | Bilingual Abstract | 국문초록 + ABSTRACT (맑은 고딕 / Times New Roman) |
| M10 | Appendix & Acknowledgements | Code blocks (Courier New 10pt) |
| M11 | AI Assistant | Polish, expand, format check, citation match, full integration |
| M12 | Export | .docx (Word), .md (Markdown), print preview, validation checklist |

## Formatting Specifications

All parameters extracted from the official university Word template:

| Element | Specification |
|---------|--------------|
| **Paper** | A4 (21.00 × 29.70 cm) |
| **Margins** | Top/Bottom: 1.90 cm, Left/Right: 2.60 cm |
| **Body text** | Times New Roman 11pt, double-spacing (480 twips), first-line indent 0.78 cm, justified |
| **Chapter headings** | 18pt bold centered, 31.2pt space after (Times New Roman / DengXian) |
| **Section headings** | 14pt bold, 15.6pt space before/after |
| **Subsection headings** | 12pt bold, 15.6pt space after, 0.85 cm first-line indent |
| **Figure captions** | 11pt, 7.8pt space before, 0.78 cm indent |
| **References** | 11pt, 18.6pt line spacing, 2.14 cm hanging indent |
| **TOC entries** | 11pt, 18.6pt spacing, TOC2 indent 0.74 cm, TOC3 indent 1.48 cm |
| **Code blocks** | Courier New 10pt, single spacing |
| **Korean abstract** | 맑은 고딕 11pt, double-spacing |
| **Cover page** | Times New Roman / 한양신명조, single spacing, centered |
| **Tables** | Single 0.5pt border, 5.4pt cell left/right padding |
| **Footer** | Centered page numbers, no header |

### Numbering System

- **Figures**: `Figure Ⅰ-1.` `Figure Ⅱ-1.` `Figure Ⅲ-1.` (full-width Roman numerals)
- **Tables**: `Table I-1.` `Table II-1.` `Table III-1.` (half-width Roman capitals)
- **Equations**: `(1.1)` `(2.1)` `(4.1)` (chapter.seq), centered + right-aligned number
- **Chapters**: `Ⅰ.` `Ⅱ.` `Ⅲ.` `Ⅳ.` `Ⅴ.` (L1), `1.` `2.` `3.` (L2), `1.1` `1.2` (L3)

### Reference Format

```
[1] Li, X., & Cong, Y. (2024). Paper Title. Journal Name, Vol(Issue), Pages. https://doi.org/xxx
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Vanilla HTML5 + JavaScript (ES6+) | — |
| CSS | TailwindCSS | 3.x (CDN) |
| Doc Export | docx.js | 8.x (CDN) |
| Math | MathJax | 3.x (CDN) |
| AI | DeepSeek API | v1 |
| References | CrossRef REST API | v1 (free) |
| Save | FileSaver.js | 2.x (CDN) |

## Quick Start

### Option 1: Open directly
1. Download or clone this repository
2. Open `index.html` in Chrome/Edge/Firefox
3. Enter your DeepSeek API Key in the top bar
4. Start writing your thesis

### Option 2: Local server (recommended for development)
```bash
cd research-report-formatter
python -m http.server 8080
# Open http://localhost:8080
```

## Project Structure

```
research-report-formatter/
├── index.html              # Main SPA page
├── css/
│   └── style.css           # Custom styles (dark academic theme)
├── js/
│   ├── bundle.js           # Combined bundle for file:// compatibility
│   ├── main.js             # Entry point & UI wiring (ES module)
│   ├── api.js              # DeepSeek API wrapper
│   ├── crossref.js         # CrossRef DOI fetching
│   ├── formatter.js        # Numbering algorithms & formatting logic
│   ├── exporter.js         # Word (.docx) & Markdown export
│   ├── preview.js          # Live preview panel (500ms debounce)
│   └── state.js            # Global state management
├── templates/
│   └── report_spec.js      # All formatting constants (REPORT_SPEC)
└── README.md
```

## Browser Compatibility

| Browser | Minimum Version |
|---------|----------------|
| Chrome  | 90+ (recommended) |
| Edge    | 90+ |
| Firefox | 88+ |
| Safari  | 14+ |

## DeepSeek API Configuration

1. Get your API Key from [platform.deepseek.com](https://platform.deepseek.com)
2. Enter the key in the top bar of the app
3. Click **Test** to verify connectivity
4. The key is stored in `localStorage` (never uploaded)

### API Endpoint
```
POST ${baseUrl}/v1/chat/completions
Headers: Authorization: Bearer ${apiKey}
Body: { model, messages, temperature: 0.3, max_tokens: 4096 }
```

## Export Validation Checklist

The exported .docx is validated against:
- [x] A4 paper, margins 1.90cm (top/bottom), 2.60cm (left/right)
- [x] Body: Times New Roman 11pt, double-spaced, 0.78cm first-line indent, justified
- [x] Chapter titles: 18pt bold centered, 31.2pt spacing after
- [x] Section titles: 14pt bold, 15.6pt spacing before/after
- [x] Table numbering: `Table III-1.` format
- [x] Figure numbering: `Figure Ⅳ-1.` format
- [x] Equation numbering: `(4.1)` centered + right-aligned
- [x] References: hanging indent, 18.6pt line spacing
- [x] Footer: centered page numbers
- [x] TOC with LIST OF TABLES and LIST OF FIGURES
- [x] Korean abstract: 맑은 고딕

## Author

**

## License

MIT
