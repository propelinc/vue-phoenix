declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    IntersectionObserver: any;
  }
}

type IntersectionObserverCallback = (
  entries?: Partial<IntersectionObserverEntry>[],
  observer?: MockIntersectionObserver
) => void;

export default class MockIntersectionObserver {
  readonly root: Element | null;

  readonly rootMargin: string;

  readonly thresholds: ReadonlyArray<number>;

  readonly callback: IntersectionObserverCallback;

  observed: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.root = null;
    this.rootMargin = '';
    this.thresholds = [];
    this.callback = callback;
  }

  disconnect() {
    this.observed = [];
  }

  observe(el: Element) {
    this.observed.push(el);
    this.callback([{ target: el, intersectionRatio: 1, isIntersecting: true }], this);
  }

  unobserve(el: Element) {
    const index = this.observed.indexOf(el);
    if (index > -1) {
      this.observed.splice(index, 1);
    }
  }
}
