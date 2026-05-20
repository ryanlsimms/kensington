import { signal } from 'kensington';

function useReducer(reducer, initialState) {
  const state = signal(initialState);
  function dispatch(action) {
    state.set(s => reducer(s, action)); // updater form: reducer always sees the latest state
  }
  return { state, dispatch };
}

export { useReducer };
