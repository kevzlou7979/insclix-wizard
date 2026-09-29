// Walk every concept x product to "Contract created" at desktop + phone widths.
// usage: node scripts/e2e.mjs [slugFilter]
import { chromium } from 'playwright';
import path from 'node:path';

const SLUGS = ['horizontal-stepper', 'vertical-rail', 'workbench', 'product-first', 'one-question', 'mobile-native', 'task-list', 'drawer', 'keyboard-first', 'timeline'];
const PRODUCTS = ['wearpass', 'vsc', 'gap', 'tirewheel'];
const SIZES = [
	[1440, 900],
	[390, 844]
];
const ADVANCE = /^(next|continue|start|create contract|save and return|review and create)/i;
const filter = process.argv[2] ?? '';

const exe = path.join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const browser = await chromium.launch({ executablePath: exe });
const results = [];

for (const slug of SLUGS.filter((s) => s.includes(filter))) {
	for (const product of PRODUCTS) {
		for (const [w, h] of SIZES) {
			const page = await browser.newPage({ viewport: { width: w, height: h } });
			const errors = [];
			page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
			await page.goto(`http://localhost:5180/concept/${slug}?product=${product}`, { waitUntil: 'networkidle' });
			await page.waitForTimeout(400);
			if (slug === 'drawer') {
				await page.getByRole('button', { name: /new contract/i }).first().click();
				await page.waitForTimeout(400);
			}
			await page.evaluate(() => window.postMessage({ type: 'fill' }, location.origin));
			await page.waitForTimeout(200);
			let ok = false;
			let clicks = 0;
			for (let i = 0; i < 30; i++) {
				if (await page.getByText('Contract created').first().isVisible().catch(() => false)) {
					ok = true;
					break;
				}
				const btns = page.getByRole('button', { name: ADVANCE });
				const n = await btns.count();
				let clicked = false;
				for (let k = n - 1; k >= 0; k--) {
					const b = btns.nth(k);
					if ((await b.isVisible().catch(() => false)) && (await b.isEnabled().catch(() => false))) {
						await b.click({ timeout: 2000 }).catch(() => {});
						clicked = true;
						clicks++;
						break;
					}
				}
				if (!clicked) break;
				await page.waitForTimeout(250);
			}
			if (!ok) await page.screenshot({ path: `C:/Users/Mark/AppData/Local/Temp/claude/C--insclix-insclix-wizard/0938ddcb-d88d-4f38-8e1b-64cf7e2e05be/scratchpad/fail-${slug}-${product}-${w}.png` });
			results.push({ slug, product, w, ok, clicks, errors: errors.length ? errors[0] : '' });
			console.log(`${ok ? 'PASS' : 'FAIL'} ${slug.padEnd(18)} ${product.padEnd(9)} ${w}  clicks=${clicks} ${errors[0] ?? ''}`);
			await page.close();
		}
	}
}
const failed = results.filter((r) => !r.ok || r.errors);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
await browser.close();
