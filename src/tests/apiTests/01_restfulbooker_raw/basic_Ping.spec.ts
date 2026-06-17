import { test, expect } from '@playwright/test';

test('Ping Request', async ({ request }) => {
    const responseData = await request.get('https://restful-booker.herokuapp.com/ping');
    console.log(responseData);
    expect(responseData.status()).toBe(201);
});