import { t } from 'kensington';

import { code, exLink } from '../../components/ui.js';

export function reactivityInTemplates() {
  return [
    t.section({ id: 'signals-content' }, [
      t.h2('Content'),
      t.p(`Pass a signal as an element's content (or anywhere in a content array) and the text node updates in place when the signal changes.`),
      code('javascript', `const count = signal(0);
const label = computed(() => count.get() === 1 ? 'item' : 'items');

t.p([count, ' ', label]).toElement();

count.set(3);  // renders "3 items"`),
      t.p([
        'A signal returning an array replaces its placeholder nodes on each change. A signal returning ',
        t.code('null'),
        ' or ',
        t.code('undefined'),
        ' renders nothing.',
      ]),
    ]),

    t.section({ id: 'signals-attributes' }, [
      t.h2('Attributes'),
      t.p([
        'Pass a signal as any attribute value. ',
        'The attribute is set, removed, or toggled automatically when the signal changes.',
      ]),
      code('javascript', `const isLoading = signal(false);
const cls = computed(() => isLoading.get() ? 'btn-secondary' : 'btn-primary');

t.button({ class: cls, disabled: isLoading }, 'Save').toElement();

isLoading.set(true);   // disables button and changes class
isLoading.set(false);  // restores it`),
      t.p([
        exLink('?page=examples#character-counter', 'Character counter example'),
        ' ',
        exLink('?page=examples#dark-mode', 'Dark mode example'),
      ]),
    ]),

    t.section({ id: 'signals-style-props' }, [
      t.h2('Reactive style properties'),
      t.p([
        'Two reactive shapes are supported. Use whichever fits the data flow.',
      ]),
      t.h3('Per-property signals'),
      t.p([
        'Individual properties inside a ',
        t.code('style'),
        ' object accept signals. Only the changed property is written to the DOM on each update. All other properties are left untouched.',
      ]),
      code('javascript', `const color = signal('red');
const opacity = signal(1);

t.div({
  style: {
    color,             // reactive. Only color is updated when the signal changes
    opacity,           // reactive. Only opacity is updated when the signal changes
    fontSize: '1rem',  // static. Set once at render time
  },
}).toElement();

color.set('blue');   // writes el.style.setProperty('color', 'blue')
opacity.set(0.5);    // writes el.style.setProperty('opacity', '0.5')`),
      t.p([
        'A signal that resolves to ',
        t.code('null'),
        ', ',
        t.code('undefined'),
        ', ',
        t.code('false'),
        ', or ',
        t.code("''"),
        ' calls ',
        t.code('removeProperty'),
        ' on that property.',
      ]),
      t.h3('Whole-style signals'),
      t.p([
        'The ',
        t.code('style'),
        ' slot also accepts a signal that yields the entire style object. Each emission is diffed per-property against the previous; properties that changed are written, properties that disappeared from the new object are cleared via ',
        t.code('removeProperty'),
        '. Use this when one derived signal naturally produces the whole bundle, such as a computed position.',
      ]),
      code('javascript', `const pointer = signal({ x: 0, y: 0 });

const position = computed(() => ({
  position: 'absolute',
  top: \`\${pointer.get().y}px\`,
  left: \`\${pointer.get().x}px\`,
}), 'position');

t.div({ id: 'cursor', style: position }).toElement();

// pointer.set({ x: 40, y: 80 }) writes top + left in one emission;
// properties removed from a later emission are cleared from el.style.`),
      t.p([
        'The same shape works at any depth inside ',
        t.code('data'),
        ', ',
        t.code('aria'),
        ', and any other namespaced-attribute slot. ',
        t.code('data: signal({foo: \'bar\'})'),
        ' flattens to ',
        t.code('data-foo="bar"'),
        ', and ',
        t.code('data: { bs: signal({toggle: \'collapse\'}) }'),
        ' flattens to ',
        t.code('data-bs-toggle="collapse"'),
        '. ',
        t.code('prop'),
        ' and ',
        t.code('on'),
        ' do not support whole-object signals; use per-property signals there.',
      ]),
      t.p([
        'In ',
        t.code('.toString()'),
        ', all signal values are resolved to their current value inline.',
      ]),
      t.aside([
        t.p([
          'Devtools shows each reactive property as a separate binding in the DOM tab, labelled ',
          t.code('style:color'),
          ', ',
          t.code('style:opacity'),
          ', etc., matching the ',
          t.code('prop:propName'),
          ' convention.',
        ]),
      ]),
    ]),

    t.section({ id: 'signals-dom-props' }, [
      t.h2('DOM properties'),
      t.p([
        'Sets a property instead of an attribute. ',
        t.code('input.value'),
        ' reflects what the user typed, while ',
        t.code("getAttribute('value')"),
        ' still returns the original default. Use the ',
        t.code('prop'),
        ' key to assign directly to DOM properties via ',
        t.code('el[name] = value'),
        ', bypassing ',
        t.code('setAttribute'),
        ':',
      ]),
      code('javascript', `const userInput = signal('');

// Assigns el.value = '' reactively, keeping the live property in sync
t.input({ type: 'text', prop: { value: userInput } }).toElement();

// Resetting
userInput.set('');  // el.value resets immediately

// Properties with no HTML attribute equivalent
const isMuted = signal(true);

t.video({ src: '/intro.mp4', prop: { muted: isMuted, playbackRate: 1.5 } }).toElement();

isMuted.set(false); // unmutes video`),
      t.aside([
        t.p([
          t.code('prop'),
          ' is silently ignored in ',
          t.code('.toString()'),
          '. Known writable properties on the element\'s DOM interface are typed in TypeScript. Expando properties are also accepted. Property existence and writability are validated at render time.',
        ]),
      ]),
    ]),

    t.section({ id: 'signals-literal' }, [
      t.h2('With .literal and .inlineComment'),
      code('javascript', `const html = signal('<b>bold</b>');
t.div(t.literal(html)).toElement();
// element is replaced when html changes

const note = signal('draft');
t.div([t.p('content'), t.inlineComment(note)]).toElement();
// comment nodeValue updates live`),
    ]),
  ];
}
