import { t } from 'kensington';

import { code } from '../../components/ui.js';

export function reactivityBatching() {
  return t.section({ id: 'signals-batching' }, [
    t.h2('Batching updates'),
    t.p([
      'Signal writes normally update effects and DOM bindings synchronously. Use ',
      t.code('batch(fn)'),
      ' when several related writes should appear as one commit, without exposing their intermediate states.',
    ]),
    code('javascript', `import { batch, computed, effect, signal, t } from 'kensington';

const firstName = signal('Ada');
const lastName = signal('Lovelace');
const fullName = computed(() => \`\${firstName.get()} \${lastName.get()}\`);
const element = t.p(fullName).toElement();
document.body.append(element);

effect(() => console.log(fullName.get())); // "Ada Lovelace"

batch(() => {
  firstName.set('Grace');
  lastName.set('Hopper');
});
// The effect runs once with "Grace Hopper"`),

    t.h3({ id: 'batch-what-is-deferred' }, 'What a batch defers'),
    t.p([
      t.code('batch'),
      ' runs its callback immediately. Signal values and computed values remain current inside the callback, while effect re-runs and signal-backed DOM writes wait until the outermost batch returns.',
    ]),
    code('javascript', `batch(() => {
  firstName.set('Katherine');
  lastName.set('Johnson');

  console.log(fullName.get());       // current value is "Katherine Johnson"
  console.log(element.textContent);  // previous DOM value. It is not committed yet
});

console.log(element.textContent);    // "Katherine Johnson"`),
    t.p([
      'Pending effects are deduplicated, so an effect dirtied by several writes runs once with the final values. Computeds still recompute as their sources change so reads made inside the batch are never stale.',
    ]),

    t.h3({ id: 'nested-batches' }, 'Nested batches'),
    t.p([
      'Nested batches share the outer boundary. This makes batched helpers composable. A helper can protect its own related writes without needing to know whether its caller already opened a larger batch.',
    ]),
    code('javascript', `function updateName(first, last) {
  batch(() => {
    firstName.set(first);
    lastName.set(last);
  });
}

batch(() => {
  updateName('Dorothy', 'Vaughan'); // the inner batch does not commit yet
  status.set('ready');
}); // one commit for all three writes`),

    t.h3({ id: 'batch-errors-and-async' }, 'Errors and async code'),
    t.p([
      'A batch controls notification timing. It is not a rollback transaction. If the callback throws, pending updates still commit before the error is rethrown. The callback return value is preserved.',
    ]),
    code('javascript', `const result = batch(() => {
  count.set(1);
  return 'saved';
});
console.log(result); // "saved"`),
    t.p([
      t.code('batch()'),
      ' accepts only callbacks that finish while the call is running. Kensington rejects async functions and generator functions before their bodies run. If an ordinary function returns a Promise, Kensington throws after that function returns. Synchronous writes made by the function are already complete. Promise work that it scheduled is not cancelled. Any writes from that later work happen outside the batch. TypeScript catches Promise returning callbacks while the runtime also protects JavaScript callers.',
    ]),
    t.p([
      'Await the work first, then batch the signal changes that follow.',
    ]),
    code('javascript', `const profile = await loadProfile();

batch(() => {
  firstName.set(profile.firstName);
  lastName.set(profile.lastName);
});`),
    t.p([
      t.code('batch()'),
      ' also works inside ',
      t.code('renderForHydration'),
      ' on the server because it does not depend on browser APIs. Server rendering still treats signal state as read only. Wrapping ',
      t.code('.set()'),
      ' in a batch does not make a render time mutation safe.',
    ]),
    t.p([
      'See ',
      t.a({ href: '?page=api#api-batch' }, 'batch in the API reference'),
      ' for the signature.',
    ]),
  ]);
}
