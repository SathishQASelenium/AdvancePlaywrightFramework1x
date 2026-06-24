import * as fs from 'fs';
import * as path from 'path';
import { LLMGateway } from '../gateway/LLMGateway';

export interface RunSnapshot {
    runId: string;
    timestamp: string;
    tests: { title: string; file: string; status: string }[];
}

export interface FlakyAnalysis {
    flaky: string[];
    alwaysFailing: string[];
    stable: string[];
    summary: string;
    run1Id: string;
    run2Id: string;
}

const RUNS_DIR = path.resolve('tta-report/runs');

export class FlakyTestAnalyzerAgent {

    static saveSnapshot(runId: string, tests: { title: string; file: string; status: string }[]): void {
        fs.mkdirSync(RUNS_DIR, { recursive: true });
        const snapshot: RunSnapshot = { runId, timestamp: new Date().toISOString(), tests };
        fs.writeFileSync(path.join(RUNS_DIR, `run_${runId}.json`), JSON.stringify(snapshot, null, 2));
    }

    static async analyse(): Promise<FlakyAnalysis | null> {
        if (!fs.existsSync(RUNS_DIR)) return null;

        const files = fs.readdirSync(RUNS_DIR)
            .filter(f => f.startsWith('run_') && f.endsWith('.json'))
            .sort()
            .reverse();

        if (files.length < 2) return null;

        const run1 = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, files[0]), 'utf-8')) as RunSnapshot;
        const run2 = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, files[1]), 'utf-8')) as RunSnapshot;

        // Build status maps keyed by test title
        const map1 = new Map(run1.tests.map(t => [t.title, t.status]));
        const map2 = new Map(run2.tests.map(t => [t.title, t.status]));
        const allTitles = new Set([...map1.keys(), ...map2.keys()]);

        const flaky: string[] = [];
        const alwaysFailing: string[] = [];
        const stable: string[] = [];

        for (const title of allTitles) {
            const s1 = map1.get(title) ?? 'missing';
            const s2 = map2.get(title) ?? 'missing';
            const bothFailed = (s1 === 'failed' || s1 === 'timedOut') && (s2 === 'failed' || s2 === 'timedOut');
            const different = s1 !== s2;
            if (bothFailed) alwaysFailing.push(title);
            else if (different) flaky.push(title);
            else stable.push(title);
        }

        // LLM summary
        let summary = 'LLM summary unavailable.';
        if (process.env.LLM_API_KEY) {
            try {
                const prompt = `Analyse these Playwright test results across 2 runs.
Flaky tests (inconsistent): ${JSON.stringify(flaky)}
Always failing: ${JSON.stringify(alwaysFailing)}
Stable: ${JSON.stringify(stable)}
Write 2-3 sentences: overall health, flakiness risk, and top recommendation. Plain text only.`;
                summary = await LLMGateway.complete(prompt, 'You are a QA lead reviewing test stability. Be concise and direct.');
            } catch { /* keep default */ }
        }

        return { flaky, alwaysFailing, stable, summary, run1Id: run1.runId, run2Id: run2.runId };
    }
}
