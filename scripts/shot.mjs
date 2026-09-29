// QA screenshot helper: node scripts/shot.mjs <path> <width> <height> <out.png> [steps] [dark]
// steps = number of times to fill sample data + click Next before the shot.
import { chromium } from 'playwright';
import path from 'node:path';

const [, , p = '/', w = '1440', h = '900', out = 'shot.png', steps = '0', theme = 'light', pre = ''] = process.argv;
const exe = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const sep = p.includes('?') ? '&' : '?';
await page.goto(`http://localhost:5180${p}${sep}theme=${theme}${+steps > 0 ? '&demo=1' : ''}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
if (pre) { await page.getByRole('button', { name: new RegExp(pre, 'i') }).first().click(); await page.waitForTimeout(500); }
for (let i = 0; i < +steps; i++) {
	const btn = page.getByRole('button', { name: /^(next|continue|start|save and return)/i }).last();
	if (await btn.count()) await btn.click();
	await page.waitForTimeout(350);
}
await page.screenshot({ path: out, fullPage: false });
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
