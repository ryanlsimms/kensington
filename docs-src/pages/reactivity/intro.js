import { headerGithubLink } from '../../components/ui.js';

export function reactivityIntro(t) {
  return t.header([
    headerGithubLink(t),
    t.h1('Reactive data'),
    t.p([
      'Pass a ',
      t.code('signal()'),
      ' anywhere a static value is accepted (as an attribute value, content, or DOM property) and Kensington wires up live DOM updates automatically. When the signal changes, only the affected attribute or text node is updated in place.',
    ]),
  ]);
}
