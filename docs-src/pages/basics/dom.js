import { t } from 'kensington';

import { code, exLink } from '../../components/ui.js';

export function basicsDom() {
  return t.section({ id: 'dom' }, [
    t.h2('Browser DOM'),
    t.p([
      'Standard event handler attributes (',
      t.code('onclick'),
      ', ',
      t.code('oninput'),
      ', etc.) accept a function (wired via ',
      t.code('addEventListener'),
      ') or a string (set via ',
      t.code('setAttribute'),
      '). For custom events, use the ',
      t.code('on'),
      ' key with a plain object mapping event names verbatim to handlers. SVG and MathML elements get the correct namespace automatically. The shared a, script, style, and title methods select HTML or SVG from their parent context, and xlink, xml, and xmlns attributes receive their standard namespace URI.',
    ]),
    code('javascript', `import { t } from 'kensington';

const button = t.button({ type: 'button' }, 'Click me').toElement();
document.body.append(button);

// custom events: names are passed verbatim to addEventListener
const el = t.div({
  on: {
    bricksSelectorChange: e => console.log(e.detail),
    'my-custom-event':    e => console.log(e.detail),
  },
}).toElement();

// SVG gets the correct SVGElement namespace
const svg = t.svg({ viewBox: '0 0 100 100' }, [
  t.circle({ cx: 50, cy: 50, r: 40, fill: 'steelblue' }),
]).toElement();

document.body.append(svg);`),
    t.p([
      'Use ',
      t.code('.toElement()'),
      ' to get a live DOM element. It is safe to call before the element is mounted.',
    ]),
    t.p(exLink('?page=examples#counter', 'Counter example')),
  ]);
}
