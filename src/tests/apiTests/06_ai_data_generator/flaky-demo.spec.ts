/**
 * Flaky Demo — tests deliberately alternate pass/fail across runs
 * using a counter file so FlakyTestAnalyzerAgent can detect them.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const RUNS_DIR = path.resolve('tta-report/runs');

// Count completed run snapshots to know which run we are on (1-indexed)
function getRunNumber(): number {
    if (!fs.existsSync(RUNS_DIR)) return 1;
    const count = fs.readdirSync(RUNS_DIR).filter(f => f.startsWith('run_') && f.endsWith('.json')).length;
    return count + 1;
}

const runNumber = getRunNumber();

test.beforeAll(() => {
    console.log(`[FlakyDemo] Run #${runNumber}`);
});

// Always passes
test('stable-test: booking API health check @p1 @ai', async ({ request }) => {
    const res = await request.get('https://restful-booker.herokuapp.com/ping');
    expect(res.status()).toBe(201);
});

// Flaky: fails on odd runs, passes on even runs
test('flaky-test-A: unstable login check @p1 @ai', async () => {
    const passThisRun = runNumber % 2 === 0;
    expect(passThisRun, `[Run ${runNumber}] flaky-test-A fails on odd runs`).toBe(true);
});

// Flaky: passes on odd runs, fails on even runs (opposite of A)
test('flaky-test-B: unstable booking count check @p1 @ai', async () => {
    const passThisRun = runNumber % 2 !== 0;
    expect(passThisRun, `[Run ${runNumber}] flaky-test-B fails on even runs`).toBe(true);
});

// Flaky: fails every 3rd run
test('flaky-test-C: intermittent response time check @p1 @ai', async () => {
    const passThisRun = runNumber % 3 !== 0;
    expect(passThisRun, `[Run ${runNumber}] flaky-test-C fails every 3rd run`).toBe(true);
});

// Always fails
test('always-failing-test: wrong endpoint assertion @p1 @ai', async ({ request }) => {
    const res = await request.get('https://restful-booker.herokuapp.com/booking/99999999');
    expect(res.status()).toBe(200); // intentional: 404 expected but we assert 200
});
