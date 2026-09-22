import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', workers: 1, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:3200', launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    args: ['--no-sandbox'],
  } },
  webServer: { command: 'npm run dev -- --hostname 127.0.0.1 --port 3200', url: 'http://127.0.0.1:3200', timeout: 120000 },
});
