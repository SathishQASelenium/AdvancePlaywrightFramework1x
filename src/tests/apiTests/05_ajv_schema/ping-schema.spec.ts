/**
 * Response contract validation for Restful Booker GET /ping (health-check).
 *
 * /ping returns plain text "Created" with status 201 — not JSON — so Ajv
 * schema is not applicable. Tests assert the response contract instead:
 *
 *   1. GET /ping → 201 status (service is up).
 *   2. Response body is exactly "Created".
 *   3. Content-Type header is text/plain (confirms no accidental JSON regression).
 */

import { test, expect } from '@fixtures/booker.fixture';
import { createLogger } from '@utils/logger';

const log = createLogger('schema-validation-ping');

const PING_URL = 'https://restful-booker.herokuapp.com/ping';

test.describe('@P0 @regression Response contract - GET /ping', () => {
    test('validates the ping contract', async ({ request }, testInfo) => {
        // 1 — GET /ping → 201 (service alive).
        await test.step('GET /ping returns status 201', async () => {
            const response = await request.get(PING_URL);
            log.info(`Step 1: GET /ping status=${response.status()}`);

            await testInfo.attach('ping-response', {
                body: JSON.stringify({ status: response.status(), url: PING_URL }),
                contentType: 'application/json',
            });

            expect(response.status()).toBe(201);
        });

        // 2 — Response body is exactly "Created".
        await test.step('GET /ping body is "Created"', async () => {
            const response = await request.get(PING_URL);
            const body = await response.text();
            log.info(`Step 2: GET /ping body="${body}"`);
            expect(body.trim()).toBe('Created');
        });

        // 3 — Content-Type is text/plain (no JSON regression).
        await test.step('GET /ping Content-Type is text/plain', async () => {
            const response = await request.get(PING_URL);
            const contentType = response.headers()['content-type'] ?? '';
            log.info(`Step 3: GET /ping Content-Type="${contentType}"`);
            expect(contentType).toContain('text/plain');
        });
    });
});
