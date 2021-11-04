// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function supressPromiseRejection(promise: Promise<any>) {
  try {
    await promise;
  } catch (e) {
    // Suppress.
  }
}

// NOTE(mohan): This helper makes sure all promises are resolved and everything is rendered.
// This is useful in cases where you have to call Vue.nextTick many times.
// Unceremoniously copied from: https://github.com/kentor/flush-promises/blob/master/index.js.
export async function settled(): Promise<void> {
  return new Promise(function (resolve) {
    setTimeout(resolve);
  });
}
