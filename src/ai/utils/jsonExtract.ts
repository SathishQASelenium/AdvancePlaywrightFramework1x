/**
 * Extracts and parses the first JSON object or array from an LLM response.
 * Handles markdown code fences, leading/trailing prose, and partial wrapping.
 */
export function extractJson<T = unknown>(text: string): T {
    // Strip outer markdown fences (```json ... ``` or ``` ... ```)
    let cleaned = text
        .replace(/^```(?:json)?\s*/im, '')
        .replace(/\s*```\s*$/m, '')
        .trim();

    // If the cleaned text is already valid JSON, return it directly
    try {
        return JSON.parse(cleaned) as T;
    } catch {
        // Fall through to extraction
    }

    // Find the outermost JSON object or array in the response
    const objectStart = cleaned.indexOf('{');
    const arrayStart = cleaned.indexOf('[');

    let start = -1;
    let endChar: '}' | ']';

    if (objectStart === -1 && arrayStart === -1) {
        throw new SyntaxError(`[extractJson] No JSON object or array found in LLM response:\n${text}`);
    }

    if (objectStart === -1) {
        start = arrayStart;
        endChar = ']';
    } else if (arrayStart === -1) {
        start = objectStart;
        endChar = '}';
    } else {
        start = Math.min(objectStart, arrayStart);
        endChar = start === objectStart ? '}' : ']';
    }

    const startChar = endChar === '}' ? '{' : '[';
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inString) { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === startChar) depth++;
        else if (ch === endChar) {
            depth--;
            if (depth === 0) {
                return JSON.parse(cleaned.slice(start, i + 1)) as T;
            }
        }
    }

    throw new SyntaxError(`[extractJson] Unterminated JSON in LLM response:\n${text}`);
}
