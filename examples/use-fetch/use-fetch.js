import { effect,signal } from 'kensington';

function useFetch(urlSignal) {
  const data = signal(null);
  const loading = signal(true);
  const error = signal(null);
  let controller;

  effect(() => {
    if (controller) {controller.abort();} // cancel any in-flight request before starting a new one
    controller = new AbortController();
    loading.set(true);
    error.set(null);

    fetch(urlSignal.get(), { signal: controller.signal })
      .then(r => r.json())
      .then(json => { data.set(json); loading.set(false); })
      .catch(err => {
        if (err.name !== 'AbortError') { error.set(err.message); loading.set(false); } // AbortError is expected when we cancel; not a real failure
      });
  });

  return { data, loading, error };
}

export { useFetch };
