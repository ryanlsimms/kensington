import assert from 'node:assert/strict';
import { basename, dirname, join } from 'node:path';
import { test } from 'node:test';

import { parseAll } from '@webref/idl';
import ts from 'typescript';

import buildDeclarations from '../../generate/build-declarations.js';
import buildHtmlElementFallbacks from '../../generate/build-html-element-fallbacks.js';
import htmlData from '../../generate/fetched-data/html.json' with { type: 'json' };

const { html } = await parseAll();
const selectedContent = htmlData.htmlElements.find(({ tag }) => tag === 'selectedcontent');
const declarationsFile = join(import.meta.dirname, '../../types.d.ts');
const emptyFallbacks = 'type HtmlElementFallbacks = {};';
const fallbackProbe = { tag: 'kensington-fallback-probe', interfaces: selectedContent.interfaces };

function checkTypes(generated, code, omitNavigation = false) {
  const fixture = join(dirname(declarationsFile), 'element-fallbacks-fixture.ts');
  const options = {
    strict: true,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    paths: { kensington: [declarationsFile] },
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const readFile = host.readFile;
  host.readFile = file => {
    if (file === fixture) { return code; }
    if (file === declarationsFile) { return generated; }
    if (omitNavigation && basename(file) === 'lib.dom.d.ts') {
      return readFile(file)?.replace(/\bNavigation\b/gu, 'UnavailableNavigation');
    }
    return readFile(file);
  };
  const program = ts.createProgram([fixture], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(ts.formatDiagnostics(diagnostics, host), '');
}

test('uses the namespace base for an interface with only a constructor', () => {
  assert.deepEqual(selectedContent.interfaces, ['HTMLSelectedContentElement']);
  const constructorOnly = html.map(definition => definition.name === 'HTMLSelectedContentElement'
    ? { ...definition, members: definition.members.filter(member => member.type === 'constructor') }
    : definition);
  assert.equal(buildHtmlElementFallbacks([fallbackProbe], constructorOnly), emptyFallbacks);
});

test('generates spec members and prefers the caller DOM map', () => {
  const [interfaceName] = selectedContent.interfaces;
  const extraMembers = {
    type: 'interface',
    name: interfaceName,
    partial: true,
    members: [
      { type: 'attribute', name: 'selectionLabel', readonly: true, idlType: { idlType: 'DOMString', nullable: true } },
      { type: 'attribute', name: 'selectionIndex', idlType: { idlType: 'long' } },
      { type: 'attribute', name: 'navigation', readonly: true, idlType: { idlType: 'Navigation' } },
      {
        type: 'operation',
        name: 'selectOption',
        idlType: { idlType: 'undefined' },
        arguments: [{ optional: true, idlType: { idlType: 'unsigned long' } }],
      },
    ],
  };
  const input = htmlData.htmlElements.find(({ tag }) => tag === 'input');
  const fallback = buildHtmlElementFallbacks([fallbackProbe, input], [...html, extraMembers]);
  assert.match(fallback, /readonly selectionLabel: string \| null;/u);
  assert.match(fallback, /selectOption\(arg0\?: number\): void;/u);
  assert.doesNotMatch(fallback, /'input'|constructor/u);
  const generated = buildDeclarations({
    elements: [
      {
        ...fallbackProbe,
        attributesTypeName: 'FallbackProbeAttributes',
        globalTypes: ['GlobalEvents'],
        methodName: 'fallbackProbe',
      },
      { tag: 'html', attributesTypeName: 'HtmlAttributes', globalTypes: ['GlobalEvents'], methodName: 'html' },
    ],
    globalAttributes: [],
    globalEvents: [],
    htmlElementFallbacks: fallback,
    svgConditionalAttributes: [],
    svgGlobalAttributes: [],
    svgGlobalEvents: [],
    svgXLinkAttributes: [],
  });

  checkTypes(generated, `
    import { t } from 'kensington';
    const element = t.fallbackProbe().toElement();
    const label: string | null = element.selectionLabel;
    const navigation: Navigation = element.navigation;
    element.selectOption(1);
    // @ts-expect-error Web IDL marks this attribute readonly
    element.selectionLabel = 'new label';
    // @ts-expect-error the fallback constrains the argument type
    element.selectOption('first');
    t.fallbackProbe({ on: { click: event => event.currentTarget.selectOption() } });
    t.fallbackProbe({ prop: { selectionIndex: 1 } });
    // @ts-expect-error prop bindings use the generated member type
    t.fallbackProbe({ prop: { selectionIndex: 'first' } });
  `);

  checkTypes(generated, `
    import { t } from 'kensington';
    declare global {
      interface HTMLElementTagNameMap {
        'kensington-fallback-probe': HTMLElement & { selectionLabel: number };
      }
    }
    const element = t.fallbackProbe().toElement();
    const label: number = element.selectionLabel;
    // @ts-expect-error the DOM map takes precedence over the generated fallback
    element.selectOption();
  `);

  checkTypes(generated, `
    import { t } from 'kensington';
    const element = t.fallbackProbe().toElement();
    const navigation: unknown = element.navigation;
    element.selectOption(1);
    // @ts-expect-error the missing DOM type falls back to unknown
    element.navigation.currentEntry;
  `, true);
});
