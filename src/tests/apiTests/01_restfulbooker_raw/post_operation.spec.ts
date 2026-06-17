import { test, expect } from '@playwright/test';
import { logger } from '@utils/logger';

test.describe('Restful Booker booking API', () => {
    test('TC#1 @p0 - POST : Verify that creating a new booking is working fine.', async ({ request }) => {
        const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };
        const payload = {
            firstname: 'Sathish',
            lastname: 'Kumar',
            totalprice: 111,
            depositpaid: true,
            bookingdates: {
                checkin: '2026-06-01',
                checkout: '2026-06-02',
            },
            additionalneeds: 'Breakfast',
        };

        let token = '';
        let bookingId = 0;

        await test.step('Create auth token', async () => {
            const responseData = await request.post(`${baseUrl}/auth`, {
                headers,
                data: {
                    username: 'admin',
                    password: 'password123',
                },
            });
            expect(responseData.status()).toBe(200);

            const data = await responseData.json();
            token = data.token;
            expect(token).toBeTruthy();
            logger.info('Created auth token for PUT booking flow');
        });

        await test.step('Create booking to update', async () => {
            const responseData = await request.post(`${baseUrl}/booking`, {
                headers,
                data: payload,
            });
            expect(responseData.status()).toBe(200);

            const data = await responseData.json();
            bookingId = data.bookingid;
            expect(bookingId).toBeTruthy();
            logger.info(`Created booking id for update: ${bookingId}`);
        });
    });
});