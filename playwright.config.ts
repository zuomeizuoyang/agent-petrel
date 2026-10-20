import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 20000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4178', browserName: 'chromium', viewport: { width: 1440, height: 900 },
    launchOptions: { executablePath: process.env.PETREL_BROWSER || (process.platform === 'win32' ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined) } },
  webServer: { command: 'npm run dev -- --port 4178 --strictPort', url: 'http://127.0.0.1:4178', reuseExistingServer: true },
});
