import { test, expect } from '@playwright/test';

test('Request fixtures is a thin HTTP client', async ({ request }) => {
    const responseData = await request.get('https://restful-booker.herokuapp.com/ping');
    console.log(responseData);
    expect(responseData.ok()).toBeTruthy();
    expect(responseData.status()).toBe(201);
    const text = await responseData.text();
    expect(text).toBe('Created');
});