import { JSONPath } from 'jsonpath-plus';
import { test, expect } from '@fixtures/booker.fixture';
import { buildBooking } from '@testdata/booking.data';
import { createLogger } from '@utils/logger';

const log = createLogger('jsonpath-queries');

test.describe.serial('@e2e @P0 Level 4 - JSONPath queries on booking responses', () => {
    let bookingId: number;

    test('create a booking and read fields with JSONPath', async ({ bookingApi }, testInfo) => {
        const payload = buildBooking({
            firstname: 'Json',
            lastname: 'Path',
            totalprice: 777,
            additionalneeds: 'Breakfast',
        });

        await test.step('POST /booking and capture the full response body', async () => {
            log.info('Step 1: creating booking for Json Path');
            const body = await bookingApi.createBooking(payload);
            bookingId = body.bookingid;
            log.info(`Step 1: booking created with id ${bookingId}`);

            await testInfo.attach('created-booking', {
                body: JSON.stringify(body, null, 2),
                contentType: 'application/json',
            });
        });

        await test.step('JSONPath $.booking.firstname → single nested value', async () => {
            log.info('Step 2: querying $.booking.firstname via JSONPath');
            const body = await bookingApi.getBooking(bookingId);

            // Wrap in the same shape POST returns so path stays identical
            const envelope = { bookingid: bookingId, booking: body };
            const firstname = JSONPath({ path: '$.booking.firstname', json: envelope })[0];
            log.info(`Step 2: firstname resolved to "${firstname}"`);
            expect(firstname).toBe('Json');
        });

        await test.step('JSONPath $.booking.bookingdates.checkin → deep nested value', async () => {
            log.info('Step 3: querying $.booking.bookingdates.checkin via JSONPath');
            const body = await bookingApi.getBooking(bookingId);
            const envelope = { bookingid: bookingId, booking: body };
            const checkin = JSONPath({ path: '$.booking.bookingdates.checkin', json: envelope })[0];
            log.info(`Step 3: checkin resolved to "${checkin}"`);
            expect(checkin).toBe('2026-02-01');
        });

        await test.step('JSONPath $.bookingid → top-level id value', async () => {
            log.info('Step 4: querying $.bookingid via JSONPath');
            const body = await bookingApi.createBooking(payload);
            const id = JSONPath({ path: '$.bookingid', json: body })[0];
            log.info(`Step 4: bookingid resolved to ${id}`);
            expect(id).toBeGreaterThan(0);

            // clean up the extra booking created for this step
            await testInfo.attach('id-query-result', {
                body: JSON.stringify({ bookingid: id }, null, 2),
                contentType: 'application/json',
            });
        });
    });

    test('wildcard + recursive-descent queries', async ({ bookingApi }, testInfo) => {
        let body: Awaited<ReturnType<typeof bookingApi.createBooking>>;

        await test.step('POST /booking to get a fresh payload for wildcard tests', async () => {
            log.info('Step 1: creating booking for Wild Card wildcard tests');
            body = await bookingApi.createBooking(
                buildBooking({ firstname: 'Wild', lastname: 'Card', totalprice: 540 }),
            );
            log.info(`Step 1: booking created with id ${body.bookingid}`);

            await testInfo.attach('wildcard-source-booking', {
                body: JSON.stringify(body, null, 2),
                contentType: 'application/json',
            });
        });

        await test.step('JSONPath $.booking.* → wildcard across all direct children', async () => {
            log.info('Step 2: querying $.booking.* — every direct child value of booking');
            const allBookingValues = JSONPath({ path: '$.booking.*', json: body });
            log.info(`Step 2: wildcard returned ${allBookingValues.length} values`);

            await testInfo.attach('wildcard-values', {
                body: JSON.stringify(allBookingValues, null, 2),
                contentType: 'application/json',
            });

            expect(allBookingValues).toContain('Wild');
            expect(allBookingValues).toContain(540);
        });

        await test.step('JSONPath $..totalprice → recursive descent for price anywhere', async () => {
            log.info('Step 3: querying $..totalprice — find price no matter how deeply nested');
            const prices = JSONPath({ path: '$..totalprice', json: body });
            log.info(`Step 3: recursive descent found prices: ${JSON.stringify(prices)}`);
            expect(prices).toEqual([540]);
        });

        await test.step('JSONPath $..bookingdates → recursive descent for date object', async () => {
            log.info('Step 4: querying $..bookingdates — grab date object without manual chaining');
            const dates = JSONPath({ path: '$..bookingdates', json: body })[0];
            log.info(`Step 4: bookingdates resolved to ${JSON.stringify(dates)}`);

            await testInfo.attach('bookingdates-result', {
                body: JSON.stringify(dates, null, 2),
                contentType: 'application/json',
            });

            expect(dates).toHaveProperty('checkin');
            expect(dates).toHaveProperty('checkout');
        });
    });

    test('array queries: index, slice and filter on GET /booking', async ({ bookingApi }, testInfo) => {
        let list: Awaited<ReturnType<typeof bookingApi.getAllBookings>>;

        await test.step('GET /booking → fetch full booking list', async () => {
            log.info('Step 1: fetching GET /booking list');
            list = await bookingApi.getAllBookings();
            log.info(`Step 1: list contains ${list.length} bookings`);

            expect(Array.isArray(list)).toBe(true);

            await testInfo.attach('booking-list-sample', {
                body: JSON.stringify(list.slice(0, 5), null, 2),
                contentType: 'application/json',
            });
        });

        await test.step('JSONPath $[0].bookingid → index: first element id', async () => {
            log.info('Step 2: querying $[0].bookingid — first booking id by index');
            const firstId = JSONPath({ path: '$[0].bookingid', json: list })[0];
            log.info(`Step 2: first id is ${firstId}`);
            expect(typeof firstId).toBe('number');
        });

        await test.step('JSONPath $[-1:].bookingid → slice: last element id', async () => {
            log.info('Step 3: querying $[-1:].bookingid — last booking id via negative slice');
            const lastId = JSONPath({ path: '$[-1:].bookingid', json: list })[0];
            log.info(`Step 3: last id is ${lastId}`);
            expect(typeof lastId).toBe('number');
        });

        await test.step('JSONPath $[*].bookingid → wildcard: every id in array', async () => {
            log.info('Step 4: querying $[*].bookingid — all booking ids in one shot');
            const allIds = JSONPath({ path: '$[*].bookingid', json: list }) as number[];
            log.info(`Step 4: wildcard returned ${allIds.length} ids`);

            expect(allIds.length).toBe(list.length);
            expect(allIds.every((n) => Number.isInteger(n))).toBe(true);
        });

        await test.step('JSONPath $[?(@.bookingid > 0)] → filter: only positive ids', async () => {
            log.info('Step 5: querying $[?(@.bookingid > 0)] — filter bookings by id > 0');
            const positives = JSONPath({
                path: '$[?(@.bookingid > 0)]',
                json: list,
            }) as Array<{ bookingid: number }>;
            log.info(`Step 5: filter returned ${positives.length} matching bookings`);

            await testInfo.attach('filter-result-sample', {
                body: JSON.stringify(positives.slice(0, 5), null, 2),
                contentType: 'application/json',
            });

            expect(positives.length).toBe(list.length);
            expect(positives.every((o) => o.bookingid > 0)).toBe(true);
        });
    });

    test('clean up the booking created above', async ({ bookingApi, bookerToken }) => {
        await test.step('DELETE /booking/{id} with the fixture token', async () => {
            log.info(`Step 1: deleting booking ${bookingId}`);
            const status = await bookingApi.deleteBooking(bookingId, bookerToken);
            log.info(`Step 1: DELETE responded with status ${status}`);
            expect(status).toBe(201);
        });

        await test.step('GET /booking/{id} should now return 404', async () => {
            log.info(`Step 2: confirming booking ${bookingId} is gone (expect 404)`);
            const ghost = await bookingApi.getBookingResponse(bookingId);
            expect(ghost.status()).toBe(404);
            log.info(`Step 2: booking ${bookingId} returns 404 as expected`);
        });
    });
});
