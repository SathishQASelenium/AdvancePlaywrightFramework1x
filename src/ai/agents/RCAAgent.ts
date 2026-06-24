import { LLMGateway } from '../gateway/LLMGateway';

export interface RCAResult {
    testTitle: string;
    severity: string;
    priority: string;
    rootCause: string;
    fixes: string[];
}

const SYSTEM_PROMPT = `You are a QA automation expert performing Root Cause Analysis on failed Playwright tests.
Return ONLY a raw JSON object — no markdown, no explanation.
Schema: { "severity": "Critical|High|Medium|Low", "priority": "P0|P1|P2|P3", "rootCause": "one sentence", "fixes": ["fix 1","fix 2","fix 3"] }`;

export class RCAAgent {
    static async analyse(title: string, error: string, stack: string, file: string): Promise<RCAResult> {
        const prompt = `Test: ${title}
File: ${file}
Error: ${error}
Stack: ${stack.substring(0, 800)}`;

        const raw = await LLMGateway.complete(prompt, SYSTEM_PROMPT);
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

        const parsed = JSON.parse(cleaned) as { severity: string; priority: string; rootCause: string; fixes: string[] };
        return { testTitle: title, ...parsed };
    }
}
