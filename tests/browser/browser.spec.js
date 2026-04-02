import { test, expect } from '@playwright/test';

test('renders kitchen sink element', async ({ page }) => {
  await page.goto('http://localhost:9615/kitchen-sink.html');

  const element = page.locator('body');
  const innerHTML = await element.innerHTML();
  const expected = '<div id="a" data-name="b" data-nested-attr="c" data-nested="d" data-camel-case="e" data-deeply-nested-attr="f">some text67<div class="no-content"></div><div class="muted"><div><span>hello from kensington</span></div></div><div>literal content</div><div>content only</div><pre>pre\ntext</pre><svg id="svg" height="10" width="10" xmlns="http://www.w3.org/2000/svg"><circle r="5" cx="5" cy="5" fill="green"></circle></svg><input checked="" type="checkbox"><math xmlns="https://www.w3.org/1998/Math/MathML/"><mfrac><mn>1</mn><mn>2</mn></mfrac></math></div>'

  await expect(page).toHaveScreenshot();
  return expect(innerHTML.trim()).toEqual(expected);
});
