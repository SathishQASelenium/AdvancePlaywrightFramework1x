import { test, expect } from '@playwright/test';
import { logger } from '@utils/logger';

interface BookingDates {
    checkin: string;
    checkout: string;
}

interface BookingPayload {
    firstname: string;
    lastname: string;
    totalprice: number;
    depositpaid: boolean;
    bookingdates: BookingDates;
    additionalneeds: string;
}

interface AuthTokenResponse {
    token: string;
}

interface CreateBookingResponse {
    bookingid: number;
    booking: BookingPayload;
}

interface BookingFlowState {
    token?: string;
    bookingId?: number;
}

test.describe.serial('Restful Booker CRUD API', () => {
    const baseUrl = process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com';
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    const bookingFlowState: BookingFlowState = {};
    const payload: BookingPayload = {
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

    test('TC#1 @p0 - Ping - HealthCheck', async ({ request }) => {
        await test.step('Ping - HealthCheck', async () => {
            const responseData = await request.get(`${baseUrl}/ping`);
            expect(responseData.status()).toBe(201);
            logger.info('Ping - HealthCheck passed');
        });
    });

    test('TC#2 @p0 - Create token', async ({ request }) => {
        await test.step('Create token', async () => {
            const responseData = await request.post(`${baseUrl}/auth`, {
                headers,
                data: {
                    username: 'admin',
                    password: 'password123',
                },
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as AuthTokenResponse;
            expect(data.token).toBeTruthy();

            bookingFlowState.token = data.token;
            logger.info('Created auth token for CRUD flow');
        });
    });

    test('TC#3 @p0 - Create booking', async ({ request }) => {
        await test.step('Create booking', async () => {
            const responseData = await request.post(`${baseUrl}/booking`, {
                headers,
                data: payload,
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as CreateBookingResponse;
            expect(data.bookingid).toBeTruthy();
            expect(data.booking.firstname).toBe(payload.firstname);
            expect(data.booking.lastname).toBe(payload.lastname);

            bookingFlowState.bookingId = data.bookingid;
            logger.info(`Created booking id for CRUD flow: ${bookingFlowState.bookingId}`);
        });
    });

    test('TC#4 @p0 - Update booking', async ({ request }) => {
        await test.step('Update booking', async () => {
            const token = bookingFlowState.token;
            const bookingId = bookingFlowState.bookingId;

            if (!token || !bookingId) {
                throw new Error('Create token and create booking tests must pass before update booking.');
            }

            const responseData = await request.put(`${baseUrl}/booking/${bookingId}`, {
                headers: {
                    ...headers,
                    Cookie: `token=${token}`,
                },
                data: payload,
            });

            expect(responseData.status()).toBe(200);
            const data = await responseData.json() as BookingPayload;
            expect(data.firstname).toBe(payload.firstname);
            expect(data.lastname).toBe(payload.lastname);

            logger.info(`Updated booking id ${bookingId}: ${data.firstname} ${data.lastname}`);
        });
    });

    test('TC#5 @p0 - Delete booking', async ({ request }) => {
        await test.step('Delete booking', async () => {
            const token = bookingFlowState.token;
            const bookingId = bookingFlowState.bookingId;

            if (!token || !bookingId) {
                throw new Error('Create token and create booking tests must pass before delete booking.');
            }

            const responseData = await request.delete(`${baseUrl}/booking/${bookingId}`, {
                headers: {
                    ...headers,
                    Cookie: `token=${token}`,
                },
            });
            expect(responseData.status()).toBe(201);
            logger.info(`Deleted booking id ${bookingId}`);
        });
    });
});