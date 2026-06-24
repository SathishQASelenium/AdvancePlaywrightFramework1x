import { test, expect } from '@playwright/test';

test.describe('RCA Demo @p1 @ai', () => {
    test('dummy failing test — wrong status code assertion', async ({ request }) => {
        const response = await request.get('https://restful-booker.herokuapp.com/booking/99999999');
        // intentional wrong assertion: 99999999 does not exist, returns 404, we assert 200
        expect(response.status()).toBe(200);
    });
});
