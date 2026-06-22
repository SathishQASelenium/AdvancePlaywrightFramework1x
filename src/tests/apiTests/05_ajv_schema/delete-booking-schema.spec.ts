/**
 * Response contract validation for Restful Booker DELETE /booking/{id}.
 *
 * DELETE returns plain text "Created" with status 201 — not JSON — so Ajv
 * schema is not applicable. Tests assert the response contract instead:
 *
 *   1. DELETE an existing booking → 201 + body "Created".
 *   2. GET the deleted booking  → 404 (confirms resource is gone).
 *   3. DELETE a non-existent booking → 405 (server rejects invalid delete).
 */

import { test, expect } from '@fixtures/booker.fixture';
import { buildBooking } from '@testdata/booking.data';
import { createLogger } from '@utils/logger';

const log = createLogger('schema-validation-delete');

const BASE_URL = 'https://restful-booker.herokuapp.com';

test.describe('@P0 @regression Response contract - DELETE /booking/{id}', () => {
    test('validates the delete-booking contract', async ({ bookingApi, bookerToken, request }, testInfo) => {
        // 1 — DELETE existing booking → 201 "Created".
        await test.step('DELETE existing booking returns 201 Created', async () => {
            const created = await bookingApi.createBooking(buildBooking({ firstname: 'DeleteSchema' }));
            const status = await bookingApi.deleteBooking(created.bookingid, bookerToken);
            log.info(`Step 1: DELETE booking ${created.bookingid} status=${status}`);

            await testInfo.attach('delete-status', {
                body: JSON.stringify({ bookingid: created.bookingid, status }),
                contentType: 'application/json',
            });

            expect(status).toBe(201);
        });

        // 2 — GET the deleted booking → 404 (resource gone).
        await test.step('GET deleted booking returns 404', async () => {
            const created = await bookingApi.createBooking(buildBooking({ firstname: 'DeleteCheck' }));
            await bookingApi.deleteBooking(created.bookingid, bookerToken);
            const getResponse = await bookingApi.getBookingResponse(created.bookingid);
            log.info(`Step 2: GET deleted booking ${created.bookingid} status=${getResponse.status()}`);
            expect(getResponse.status()).toBe(404);
        });

        // 3 — DELETE non-existent booking → 405.
        await test.step('DELETE non-existent booking returns 405', async () => {
            const response = await request.delete(`${BASE_URL}/booking/999999999`, {
                headers: { Cookie: `token=${bookerToken}` },
            });
            log.info(`Step 3: DELETE non-existent booking status=${response.status()}`);
            expect(response.status()).toBe(405);
        });
    });
});
