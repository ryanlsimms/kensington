
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { default: Kensington, t } = require('kensington');
const { divAttributes, inputAttributes, formAttributes } = require('kensington/attributes');

// ─── require syntax ────────────────────────────────────────────────────────

describe('require syntax', () => {
  it('default export is the Kensington class', () => {
    assert.strictEqual(typeof Kensington, 'function');
    assert.ok(new Kensington() instanceof Kensington);
  });

  it('named t export is a Kensington instance', () => {
    assert.ok(t instanceof Kensington);
  });

  it('attributes sub-path export works', () => {
    assert.strictEqual(typeof divAttributes, 'object');
    assert.strictEqual(typeof inputAttributes, 'object');
    assert.strictEqual(typeof formAttributes, 'object');
  });

  it('t is the same instance on repeated require (module cache)', () => {
    const { t: t2 } = require('kensington');
    assert.strictEqual(t, t2);
  });
});

// ─── core output ───────────────────────────────────────────────────────────

describe('core output', () => {
  it('generates a content tag', () => {
    assert.strictEqual(t.div('hello').toString(), '<div>hello</div>');
  });

  it('generates a void tag', () => {
    assert.strictEqual(t.br().toString(), '<br>');
    assert.strictEqual(t.input({ type: 'text' }).toString(), '<input type="text">');
  });

  it('nested elements', () => {
    assert.strictEqual(
      t.ul([t.li('one'), t.li('two')]).toString(),
      '<ul>\n  <li>one</li>\n  <li>two</li>\n</ul>',
    );
  });

  it('htmlWithDocType prepends doctype', () => {
    assert.ok(t.htmlWithDocType(t.body('hi')).toString().startsWith('<!DOCTYPE html>'));
  });

  it('literal embeds raw html', () => {
    assert.strictEqual(t.literal('<hr>').toString(), '<hr>');
  });

  it('literal throws on script tag with validationLevel error', () => {
    const te = new Kensington({ validationLevel: 'error' });
    assert.throws(() => te.literal('<script>alert(1)</script>').toString());
  });

  it('unsafeLiteral allows script tag', () => {
    assert.strictEqual(t.unsafeLiteral('<script>x</script>').toString(), '<script>x</script>');
  });
  it('pre and script join content array items with newlines', () => {
    assert.strictEqual(t.pre(['line1', 'line2']).toString(), '<pre>line1\nline2</pre>');
    assert.strictEqual(t.script(['var a = 1;', 'var b = 2;']).toString(), '<script>var a = 1;\nvar b = 2;</script>');
  });
});

// ─── attributes ────────────────────────────────────────────────────────────

describe('attributes', () => {
  it('string attribute', () => {
    assert.strictEqual(t.div({ id: 'app' }).toString(), '<div id="app"></div>');
  });

  it('camelCase converts to kebab-case', () => {
    assert.strictEqual(t.div({ dataBsToggle: 'collapse' }).toString(), '<div data-bs-toggle="collapse"></div>');
  });

  it('nested object flattens to kebab-case', () => {
    assert.strictEqual(
      t.div({ data: { bs: { toggle: 'collapse', target: '#x' } } }).toString(),
      '<div data-bs-toggle="collapse" data-bs-target="#x"></div>',
    );
  });

  it('boolean true includes attribute', () => {
    assert.strictEqual(t.input({ type: 'checkbox', checked: true }).toString(), '<input type="checkbox" checked>');
  });

  it('boolean false omits attribute', () => {
    assert.strictEqual(t.input({ type: 'checkbox', checked: false }).toString(), '<input type="checkbox">');
  });

  it('class as array joins with space', () => {
    assert.strictEqual(t.div({ class: ['a', 'b', 'c'] }).toString(), '<div class="a b c"></div>');
  });

  it('style as object converts camelCase keys to css properties', () => {
    assert.strictEqual(
      t.div({ style: { backgroundColor: 'red', fontSize: '14px' } }).toString(),
      '<div style="background-color: red; font-size: 14px"></div>',
    );
  });
  it('style as object drops null, undefined, false values', () => {
    assert.strictEqual(
      t.div({ style: { color: null, fontWeight: 'bold' } }).toString(),
      '<div style="font-weight: bold"></div>',
    );
  });
  it('style as object still accepts a plain string', () => {
    assert.strictEqual(t.div({ style: 'color: red' }).toString(), '<div style="color: red"></div>');
  });
});

// ─── method binding ────────────────────────────────────────────────────────

describe('method binding', () => {
  it('methods survive destructuring from t', () => {
    const { div, p, span } = t;
    assert.strictEqual(div('hi').toString(), '<div>hi</div>');
    assert.strictEqual(p('text').toString(), '<p>text</p>');
    assert.strictEqual(span(42).toString(), '<span>42</span>');
  });

  it('methods survive destructuring from a custom instance', () => {
    const engine = new Kensington({ indentationLevel: 4 });
    const { div } = engine;
    assert.strictEqual(div(div()).toString(), '<div>\n    <div></div>\n</div>');
  });
});

// ─── subclassing ───────────────────────────────────────────────────────────

describe('subclassing', () => {
  it('createCustomTag produces a working method', () => {
    class MyEngine extends Kensington {
      myCard = this.createCustomTag('my-card', { 'card-type': ['primary', 'secondary'] });
    }
    const engine = new MyEngine();
    assert.strictEqual(
      engine.myCard({ 'card-type': 'primary' }, 'hi').toString(),
      '<my-card card-type="primary">hi</my-card>',
    );
  });

  it('custom tag method is bound and survives destructuring', () => {
    class MyEngine extends Kensington {
      myWidget = this.createCustomTag('my-widget');
    }
    const engine = new MyEngine();
    const { myWidget } = engine;
    assert.strictEqual(myWidget('content').toString(), '<my-widget>content</my-widget>');
  });

  it('additionalNamespaces passes validation', () => {
    const engine = new Kensington({ additionalNamespaces: ['hx'], validationLevel: 'error' });
    assert.doesNotThrow(() => engine.div({ hxBoost: 'true' }).toString());
  });
  it('logger option receives warning messages', () => {
    const messages = [];
    const engine = new Kensington({ validationLevel: 'warn', logger: m => messages.push(m) });
    engine.div({ id: '123-abc' }).toString();
    assert.ok(messages.length >= 1);
    assert.ok(messages[0].includes('123-abc'));
  });
  it('throws on invalid attribute value at error level', () => {
    const engine = new Kensington({ validationLevel: 'error' });
    assert.throws(() => engine.form({ method: 'delete' }).toString());
  });
  it('custom tag validates allowed attribute values', () => {
    class MyEngine extends Kensington {
      myEl = this.createCustomTag('my-el', { size: ['sm', 'lg'] });
    }
    const engine = new MyEngine({ validationLevel: 'error' });
    assert.doesNotThrow(() => engine.myEl({ size: 'sm' }).toString());
    assert.throws(() => engine.myEl({ size: 'xl' }).toString());
  });

  it('subclass inherits all built-in tag methods', () => {
    class MyEngine extends Kensington {}
    const engine = new MyEngine();
    assert.strictEqual(engine.section(engine.p('hi')).toString(), '<section>\n  <p>hi</p>\n</section>');
  });
});

// ─── attributes exports ────────────────────────────────────────────────────

describe('attributes exports', () => {
  it('formAttributes contains expected keys', () => {
    assert.ok('method' in formAttributes);
    assert.ok('action' in formAttributes);
  });

  it('inputAttributes contains expected keys', () => {
    assert.ok('type' in inputAttributes);
    assert.ok('checked' in inputAttributes);
  });
});
