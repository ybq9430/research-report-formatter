// ── DeepSeek API Wrapper ──

export async function callDeepSeek(systemPrompt, userContent, apiKey, baseUrl = 'https://api.deepseek.com', model = 'deepseek-chat') {
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      stream: false,
    }),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API Error ${response.status}: ${errText}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

export async function testConnection(apiKey, baseUrl, model) {
  const result = await callDeepSeek(
    'Reply with exactly: OK',
    'Test connection. Reply OK.',
    apiKey, baseUrl, model
  );
  return result && result.trim().toUpperCase().includes('OK');
}

// ── AI Functions ──

export async function polishParagraph(text, apiKey, baseUrl, model) {
  const system = `You are an academic English editor. Polish the following text for a research report:
- Maintain the original meaning and technical accuracy
- Improve academic tone and clarity
- Use formal academic English appropriate for a master's thesis
- Do NOT change citations like [1], [2], [ref:xxx]
- Return ONLY the polished text, no explanations.`;
  return callDeepSeek(system, text, apiKey, baseUrl, model);
}

export async function expandSection(outline, apiKey, baseUrl, model, targetWords = 300) {
  const system = `You are an academic researcher writing a master's thesis section. Write a complete academic section based on the given outline/keywords:
- Write in formal academic English (Times New Roman style, double-spaced structure)
- Target approximately ${targetWords} words
- Include appropriate technical depth
- Use proper paragraph structure with topic sentences
- Return the complete section text, no meta-commentary.`;
  return callDeepSeek(system, outline, apiKey, baseUrl, model);
}

export async function checkFormatting(fullText, specSummary, apiKey, baseUrl, model) {
  const system = `You are a formatting checker for a master's thesis. Review the text against these specifications:
${specSummary}

Identify issues:
1. Heading level inconsistencies (wrong font size, alignment, spacing)
2. Missing or broken reference numbers
3. Figure/table numbering gaps or errors
4. Missing keywords in abstracts
5. Inconsistent paragraph formatting

Return a JSON array of issues: [{"type":"heading|reference|figure|table|keyword|format","location":"...","description":"...","severity":"error|warning"}]
Return ONLY valid JSON, no markdown code blocks.`;
  const result = await callDeepSeek(system, fullText, apiKey, baseUrl, model);
  try {
    return JSON.parse(result);
  } catch {
    // Try to extract JSON from markdown code block
    const match = result.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]);
    return [{ type: 'format', location: 'unknown', description: 'Could not parse AI response', severity: 'error' }];
  }
}

export async function matchReferencesToBody(bodyText, refList, apiKey, baseUrl, model) {
  const refSummary = refList.map((r, i) =>
    `[${i}] ${r.authors} (${r.year}). ${r.title}. ${r.journal}.`
  ).join('\n');

  const system = `You are a citation matching assistant. Given a document body and a reference list, identify which [ref:KEYWORD] markers in the body correspond to which references.

Return a JSON object mapping ref-keywords to reference indices:
{"keyword1": refIndex, "keyword2": refIndex, ...}

Rules:
- Match based on author names, topic keywords, or context
- A refIndex of -1 means no match found
- Each [ref:xxx] marker should map to exactly one reference
- Return ONLY valid JSON, no markdown code blocks.`;

  const user = `BODY TEXT:\n${bodyText}\n\nREFERENCE LIST:\n${refSummary}\n\nFind [ref:xxx] markers in the body and match them to the most relevant reference.`;

  const result = await callDeepSeek(system, user, apiKey, baseUrl, model);
  try {
    const cleaned = result.replace(/```json\s*|```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    try {
      return JSON.parse(result);
    } catch {
      return {};
    }
  }
}

export async function integrateFullReport(state, apiKey, baseUrl, model) {
  const system = `You are assembling a complete master's thesis. Combine all sections into a structured document in this order:
1. Cover Page
2. Table of Contents
3. Chapter I through V (with all sections and subsections)
4. References
5. 국문초록 (Korean Abstract)
6. ABSTRACT (English Abstract)
7. Appendix
8. Acknowledgements

Format as clean Markdown with proper heading levels. Preserve all figure/table/equation numbering. Return the complete structured document.`;
  const content = JSON.stringify(state, null, 2);
  return callDeepSeek(system, content, apiKey, baseUrl, model);
}

export async function parseReference(rawText, apiKey, baseUrl, model) {
  const system = `You are a reference parser. Parse the given reference text into structured format.
Return a JSON object: {"authors":"Author1, A., & Author2, B.","year":"2024","title":"Paper Title","journal":"Journal Name","volume":"10","issue":"2","page":"100-120","doi":"https://doi.org/10.xxx/xxx"}

Rules:
- Author format: LastName, FirstInitial., & LastName, FirstInitial.
- If any field is missing, set it to empty string ""
- Return ONLY valid JSON, no markdown code blocks.`;
  const result = await callDeepSeek(system, rawText, apiKey, baseUrl, model);
  try {
    return JSON.parse(result.replace(/```json\s*|```\s*/g, '').trim());
  } catch {
    return null;
  }
}
