import { defineConfig } from '@playwright/test';
import chromium from '@sparticuz/chromium';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: { executablePath: await chromium.executablePath(), args: chromium.args.filter(arg => arg !== '--single-process') },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 30000
  }
});
