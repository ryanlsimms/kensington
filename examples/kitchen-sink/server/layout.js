import t from '#kensington';

export function layout(body) {
  return t.htmlWithDocType({ lang: 'en' }, [
    t.head([
      t.meta({ charset: 'utf-8' }),
      t.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
      t.title('Kitchen Sink'),
      t.link({ rel: 'icon', href: 'data:image/png;base64,iVBORw0KGgo=' }),
      t.link({ rel: 'stylesheet', href: '/styles.css' }),
      t.script({ type: 'importmap' }, JSON.stringify({
        imports: {
          kensington: '/esm/index.js',
          'kensington/devtools': '/esm/devtools.js',
          '#kensington': '/shared/template-engine.js',
        },
      })),
      t.script({ type: 'module', src: '/client.js' }),
    ]),
    t.body(body),
  ]);
}
