import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '@utils/logger';
import { llmGateway } from '../gateway/LLMGateway';

const log = createLogger('FlakyAnalyzer');

const isFail = (s: string | undefined): boolean => s === 'failed' || s === 'timedOut';
const isPass = (s: string | undefined): boolean => s === 'passed';

export interface RunSnapshot {
    runId: string;
    timestamp: string;
    tests: { title: string; file: string; status: string }[];
}

export interface FlakyAnalysis {
    flaky: string[];
    failingNow: string[];
    alwaysFailing: string[];
    stable: string[];
    counts: { flaky: number; failing: number; total: number };
    summary?: string;
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

    static async analyse(useLlm = true): Promise<FlakyAnalysis | null> {
        if (!fs.existsSync(RUNS_DIR)) return null;

        const files = fs.readdirSync(RUNS_DIR)
            .filter(f => f.startsWith('run_') && f.endsWith('.json'))
            .sort()
            .reverse();

        if (files.length < 2) return null;

        const run1 = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, files[0]), 'utf-8')) as RunSnapshot;
        const run2 = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, files[1]), 'utf-8')) as RunSnapshot;

        const map1 = new Map(run1.tests.map(t => [t.title, t.status]));
        const map2 = new Map(run2.tests.map(t => [t.title, t.status]));
        const allTitles = new Set([...map1.keys(), ...map2.keys()]);

        const flaky: string[] = [];
        const failingNow: string[] = [];
        const alwaysFailing: string[] = [];
        const stable: string[] = [];

        for (const title of allTitles) {
            const s1 = map1.get(title);
            const s2 = map2.get(title);

            if (isFail(s1) && isFail(s2)) {
                alwaysFailing.push(title);
            } else if ((isPass(s1) && isFail(s2)) || (isFail(s1) && isPass(s2))) {
                flaky.push(title);
            } else {
                stable.push(title);
            }

            if (isFail(s2)) failingNow.push(title);
        }

        const result: FlakyAnalysis = {
            flaky,
            failingNow,
            alwaysFailing,
            stable,
            counts: { flaky: flaky.length, failing: failingNow.length, total: allTitles.size },
            run1Id: run1.runId,
            run2Id: run2.runId,
        };

        if (useLlm && flaky.length > 0) {
            try {
                const gw = llmGateway();
                const user =
                    `Two builds of the same Playwright suite were compared.\n` +
                    `FLAKY tests (status flipped between builds):\n${flaky.map(t => `- ${t}`).join('\n')}\n\n` +
                    `Tests failing in the latest build:\n${failingNow.map(t => `- ${t}`).join('\n') || '- none'}\n\n` +
                    `Always-failing tests (failed in both builds):\n${alwaysFailing.map(t => `- ${t}`).join('\n') || '- none'}\n\n` +
                    `In 3-4 short sentences: confirm which tests are flaky, why flakiness like this usually happens, and how to stabilize them. Plain text, no markdown.`;
                const res = await gw.chat({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a senior test-automation engineer judging test flakiness across builds.',
                        },
                        { role: 'user', content: user },
                    ],
                    jsonMode: false,
                });
                result.summary = res.content.trim();
            } catch (e) {
                log.warn(`LLM summary failed: ${(e as Error).message}`);
            }
        }

        log.info(`Flaky: ${result.counts.flaky}, Failing: ${result.counts.failing}, Total: ${result.counts.total}`);
        return result;
    }
}
