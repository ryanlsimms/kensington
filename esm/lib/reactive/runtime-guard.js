import filterStack from '../util/filter-stack.js';
import { _reactiveRuntime } from './signal.js';

// Enter the policy of the tag being rendered, including an explicit off scope.
// Effects and bindings created here capture the checker for subsequent runs.
// The slim build replaces this module with an off-only scope wrapper.
export function withRuntimeValidation(validationLevel, logger, fn) {
  let check;
  if (validationLevel === 'warn' || validationLevel === 'error') {
    const reported = new Set();
    check = (owner, operation) => {
      if (owner === _reactiveRuntime.token || reported.has(owner)) { return; }
      const message = `kensington: ${operation} crossed reactive runtimes. ` +
        'Use one installation/module format. Tracking and pending updates cannot cross them.';
      if (validationLevel === 'warn') {
        reported.add(owner);
        (logger ?? console.log)(message);
      } else {
        throw filterStack(new Error(message));
      }
    };
  }
  return _reactiveRuntime.run(check, fn);
}
