import { test, expect } from '@playwright/test';
import { ApiHelper } from '@utils/ApiHelper';
import { createLogger } from '@utils/logger';

const log = createLogger('update_Booking.spec.ts');

test.describe('@P0 @regression Level 2 (APIHelper) - PUT update booking', () => {

    test('PUT /booking/{id} replaces the booking with a Coockie token', async ({ request }) => {

        const api = new ApiHelper(request);

        let token: string;
        let bookingid: number;
        let updated: { firstname: string; lastname: string; totalprice: number; depositpaid: boolean; additionalneeds: string };

        // Step 1: Create auth token
        await test.step('Create auth token', async () => {
            log.info('Requesting auth token');
            const authRes = await api.post('/auth', { username: 'admin', password: 'password123' });
            log.info(`Auth response status: ${authRes.status()}`);
            ({ token } = await api.parseJsonResponse<{ token: string }>(authRes));
            expect(token).toBeTruthy();
            log.info('Auth token received');
        });

        // Step 2: Create booking to update
        await test.step('Create booking to update', async () => {
            log.info('Creating initial booking');
            const created = await api.post('/booking', {
                firstname: 'Before',
                lastname: 'Helper',
                totalprice: 111,
                depositpaid: false,
                bookingdates: {
                    checkin: '2026-06-01',
                    checkout: '2026-06-02',
                },
                additionalneeds: 'Breakfast',
            });
            log.info(`Create booking response status: ${created.status()}`);
            expect(api.isSuccess(created)).toBe(true);
            ({ bookingid } = await api.parseJsonResponse<{ bookingid: number }>(created));
            log.info(`Created booking id: ${bookingid}`);
        });

        // Step 3: PUT update booking
        await test.step('PUT update booking', async () => {
            log.info(`Sending PUT /booking/${bookingid}`);
            const response = await api.put(`/booking/${bookingid}`, {
                firstname: 'After',
                lastname: 'Helper',
                totalprice: 120,
                depositpaid: true,
                bookingdates: {
                    checkin: '2026-06-01',
                    checkout: '2026-06-02',
                },
                additionalneeds: 'Extra Bed',
            }, {
                headers: {
                    'Cookie': `token=${token!}`,
                    'Content-Type': 'application/json',
                },
            });
            log.info(`PUT response status: ${response.status()}`);
            expect(api.isSuccess(response)).toBe(true);
            updated = await api.parseJsonResponse<{ firstname: string; lastname: string; totalprice: number; depositpaid: boolean; additionalneeds: string }>(response);
        });

        // Step 4: Validate updated booking response
        await test.step('Validate updated booking response', async () => {
            log.info('Validating updated booking fields');
            expect(updated.firstname).toBe('After');
            expect(updated.lastname).toBe('Helper');
            expect(updated.totalprice).toBe(120);
            expect(updated.depositpaid).toBe(true);
            expect(updated.additionalneeds).toBe('Extra Bed');
            log.info('All booking assertions passed');
        });
    });
});