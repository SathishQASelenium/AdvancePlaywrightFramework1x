// This will be an isolated testcase to test gorest.in API with newContext() method of request fixture. 
// This will be a separate test case to test the newContext() method of request fixture.
import { test, expect, request } from '@playwright/test';

test('newContext for isolated headers', async () => {
    const ctx = await request.newContext({
        baseURL: 'https://gorest.in/',
        extraHTTPHeaders: { 'X-Trace-Id': 'demo-123' },
        timeout: 15_000,
    });

    const ping = await ctx.get('/public/v2/users/1001?page=1&per_page=10');
    expect(ping.status()).toBe(200);
    await ctx.dispose();
});