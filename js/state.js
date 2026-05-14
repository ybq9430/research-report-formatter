// ── Global State Management ──

export const initialState = {
  apiConfig: {
    key:     '',
    baseUrl: 'https://api.deepseek.com',
    model:   'deepseek-chat',
    connected: false,
  },

  cover: {
    title:       '',
    subtitle:    '',
    date:        'August 2026',
    major:       'Major of Computer Science and Technology',
    school:      'Graduate School of Youngsan University',
    studentName: '',
    advisor:     'Supervised by Jinwhan Kim',
    advisorSchool: '',
    univName:    '',
  },

  chapters: [
    {
      numeral: 'Ⅰ',
      title: 'Introduction',
      sections: [
        { heading: '1', title: 'Research Background', content: '', subSections: [] },
        { heading: '2', title: 'Research Significance & Objectives', content: '', subSections: [] },
        { heading: '3', title: 'Research Methods & Contributions', content: '', subSections: [] },
        { heading: '4', title: 'Thesis Organization', content: '', subSections: [] },
      ],
    },
    {
      numeral: 'Ⅱ',
      title: 'Literature Review',
      sections: [],
    },
    {
      numeral: 'Ⅲ',
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
      numeral: 'Ⅳ',
      title: '',
      sections: [],
    },
    {
      numeral: 'Ⅴ',
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

  figures:    [],  // { chapterIdx, localIdx, caption, imageData, width }
  tables:     [],  // { chapterIdx, localIdx, caption, rows: [[cell]], headerRows: 1 }
  equations:  [],  // { chapterIdx, localIdx, latex }
  references: [],  // { id, authors, year, title, journal, vol, issue, page, doi, number }
  abstracts: {
    korean:  { title: '', studentName: '', major: '', advisor: '', body: '', keywords: '' },
    english: { title: '', studentName: '', major: '', advisor: '', body: '', keywords: '' },
  },
  appendix:      [],    // { chapterIdx, chapterName, requires: string, imports: string, code: string }
  acknowledgements: '',

  // UI state
  activeTab: 'cover',
  previewVisible: true,
};

// Simple pub/sub state store
let state = JSON.parse(JSON.stringify(initialState));
const listeners = new Set();

export function getState() {
  return state;
}

export function setState(partial) {
  state = { ...state, ...partial };
  listeners.forEach(fn => fn(state));
}

export function updateState(path, value) {
  const keys = path.split('.');
  let obj = state;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetState() {
  state = JSON.parse(JSON.stringify(initialState));
  listeners.forEach(fn => fn(state));
}

// Load API config from localStorage
export function loadApiConfig() {
  try {
    const saved = localStorage.getItem('rrf_api_config');
    if (saved) {
      const cfg = JSON.parse(saved);
      state.apiConfig = { ...state.apiConfig, ...cfg };
    }
  } catch (e) { /* ignore */ }
}

// Save API config to localStorage
export function saveApiConfig() {
  try {
    localStorage.setItem('rrf_api_config', JSON.stringify({
      key: state.apiConfig.key,
      baseUrl: state.apiConfig.baseUrl,
      model: state.apiConfig.model,
    }));
  } catch (e) { /* ignore */ }
}
