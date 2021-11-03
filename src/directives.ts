import Vue, { VNode, VueConstructor } from 'vue';
import { DirectiveBinding, DirectiveOptions } from 'vue/types/options';

import { pluginOptions } from './plugins/cms';
import { getClosest } from './utils';

interface DestroyHTMLElement extends HTMLElement {
  $destroy?: () => void;
  bound?: boolean;
  attrs?: object;
}

interface DestroyHTMLInputElement extends HTMLInputElement {
  $destroy?: () => void;
}

function destroy(el: DestroyHTMLElement): void {
  if (el.$destroy) {
    el.$destroy();
  }
}

/**
 * Scroll input into view when focused.
 *
 * Example usage:
 * <input type="text" value="foo" v-scroll-on-focus />
 */
const scrollOnFocus: DirectiveOptions = {
  bind(el: DestroyHTMLInputElement): void {
    const target = el.querySelector('input,textarea');
    if (!target) {
      return;
    }

    const scrollTo = (
      target: HTMLElement,
      scrollable: HTMLElement,
      scrollableContent: HTMLElement,
      marginTop = 0
    ): void => {
      while (target.offsetParent && target.offsetParent !== scrollable) {
        marginTop -= target.offsetTop;
        target = target.offsetParent as HTMLElement;
      }
      scrollableContent.scrollTop = target.offsetTop - marginTop;
    };

    const handler = (): void => {
      const scrollable = getClosest(el, '.scrollable');
      const scrollableContent = getClosest(el, '.scrollable-content');
      if (scrollable && scrollableContent) {
        const height = scrollableContent.offsetHeight;
        window.setTimeout((): void => {
          // If scrollableContent height is reduced in half second
          // since an input got focus we assume soft keyboard is showing.
          if (height > scrollableContent.offsetHeight) {
            scrollTo(target as HTMLElement, scrollable, scrollableContent, 20);
          }
        }, 500);
      }
    };

    target.addEventListener('focus', handler);
    el.$destroy = (): void => {
      target.removeEventListener('focus', handler);
    };
  },
  unbind: destroy,
};

/**
 * Track an event to amplitude on click.
 *
 * Example usage:
 * <div v-track-click event-name="foo" :event-props="{ bar: 'tzar' }">Click me</div>
 */
const trackClick: DirectiveOptions = {
  bind(el: DestroyHTMLElement, binding: DirectiveBinding, vnode: VNode): void {
    el.attrs = vnode.data && vnode.data.attrs ? vnode.data.attrs : {};
    const eventName = binding.value || el.attrs['event-name'];
    const wrappedHandler = (): void => {
      if (!eventName) {
        throw new Error('v-track-click: "event-name" attribute is required.');
      }
      pluginOptions.trackAnalytics(eventName, (el.attrs || {})['event-props'] || {});
    };
    el.addEventListener('click', wrappedHandler);
    el.$destroy = (): void => {
      el.removeEventListener('click', wrappedHandler);
      delete el.attrs;
    };
  },
  update(el: DestroyHTMLElement, binding: DirectiveBinding, vnode: VNode): void {
    el.attrs = vnode.data && vnode.data.attrs ? vnode.data.attrs : {};
  },
  unbind(el: DestroyHTMLElement): void {
    // A race condition occurs when using both a v-track-click directive and an @click handler.
    // If the @click handler removes the element from the DOM, the directive unbind
    // runs before the track-click handler can run. This leads to the v-track-click handler
    // being removed before it can fire.

    // The setTimeout allows the click handler to execute before it is removed.
    window.setTimeout((): void => destroy(el), 0);
  },
};

/**
 * Track an event to amplitude on render (or, more specifically, when it's inserted into its parent).
 *
 * Example usage:
 * <div v-track-render event-name="foo" :event-props="{ bar: 'tzar' }">I rendered.</div>
 */
const trackRender: DirectiveOptions = {
  inserted(el: DestroyHTMLElement, binding: DirectiveBinding, vnode: VNode): void {
    el.attrs = vnode.data && vnode.data.attrs ? vnode.data.attrs : {};
    const eventName = binding.value || el.attrs['event-name'];
    if (!eventName) {
      throw new Error('v-track-render: "event-name" attribute is required.');
    }
    pluginOptions.trackAnalytics(eventName, el.attrs['event-props'] || {});
  },
};

/**
 * Directive used by the CMS to initialize new data.
 *
 * Example usage:
 * <div v-init="{context: context, value: {k: 'Hi'}}">
 *   <span v-if="context.k" v-html="context.k"></span>
 * </div>
 */
const init: DirectiveOptions = {
  bind(el: HTMLElement, binding: DirectiveBinding): void {
    if (binding.value) {
      Object.keys(binding.value.value).forEach((k): void => {
        Vue.set(binding.value.context, k, binding.value.value[k]);
      });
    }
  },
};

export function addDirectives(Vue: VueConstructor): void {
  Vue.directive('infinite-scroll', infiniteScroll);
  Vue.directive('scroll-on-focus', scrollOnFocus);
  Vue.directive('track-click', trackClick);
  Vue.directive('track-render', trackRender);
  Vue.directive('init', init);
}
