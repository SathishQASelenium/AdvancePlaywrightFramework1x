/**
 * JSON Schema validation with Ajv against the Restful Booker PUT /booking/{id}
 * response. Schema lives in src/testdata/schemas/put-booking.schema.json.
 *
 * Three checks:
 *   1. A static sample payload validates (schema sanity).
 *   2. A LIVE PUT /booking/{id} response validates (contract test).
 *   3. A deliberately broken object is asserted to FAIL, proving the schema bites.
 */

import { test, expect } from '@fixtures/booker.fixture';
import { buildBooking } from '@testdata/booking.data';
import { validateSchema } from '@utils/schemaValidator';
import { createLogger } from '@utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const log = createLogger('schema-validation-put');

const schema = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '../../../testdata/schemas/put-booking.schema.json'),
        'utf-8',
    ),
);

test.describe('@P0 @regression Ajv schema validation - PUT /booking/{id}', () => {
    test('validates the put-booking contract', async ({ bookingApi, bookerToken }, testInfo) => {
        // 1 — static sample (the exact shape the API documents).
        await test.step('Static sample matches the schema', async () => {
            const sample = {
                firstname: 'Jim',
                lastname: 'Brown',
                totalprice: 111,
                depositpaid: true,
                bookingdates: { checkin: '2018-01-01', checkout: '2019-01-01' },
                additionalneeds: 'Breakfast',
            };
            const { valid, errorText } = validateSchema(schema, sample);
            log.info(`Step 1: static sample valid=${valid}`);
            expect(valid, errorText).toBe(true);
        });

        // 2 — live response: create booking, full-replace with PUT, validate response.
        await test.step('Live PUT /booking/{id} response matches the schema', async () => {
            const created = await bookingApi.createBooking(buildBooking({ firstname: 'PutSchema' }));
            const updatePayload = buildBooking({ firstname: 'PutUpdated', lastname: 'Schema' });
            const body = await bookingApi.updateBooking(created.bookingid, updatePayload, bookerToken);
            const { valid, errorText } = validateSchema(schema, body);
            log.info(`Step 2: put booking ${created.bookingid} valid=${valid}`);

            await testInfo.attach('validated-response', {
                body: JSON.stringify(body, null, 2),
                contentType: 'application/json',
            });

            expect(valid, errorText).toBe(true);
        });

        // 3 — negative: a bad object must be rejected.
        await test.step('Invalid object is rejected by the schema', async () => {
            const broken = {
                firstname: 'Jim',
                // lastname missing
                totalprice: 'not-a-number', // wrong type
                depositpaid: 'yes',          // wrong type
                bookingdates: { checkin: 'nope', checkout: '2019-01-01' }, // bad date format
            };
            const { valid, errors } = validateSchema(schema, broken);
            log.info(`Step 3: broken object valid=${valid}, ${errors.length} errors`);
            expect(valid).toBe(false);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
