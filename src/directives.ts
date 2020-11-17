import Vue, { VNode, VueConstructor } from 'vue';
import { DirectiveBinding, DirectiveOptions } from 'vue/types/options';

import { pluginOptions } from './plugins/cms';
import { getClosest } from './utils';

interface DestroyHTMLElement extends HTMLElement {
    $destroy: () => void;
}

interface DestroyHTMLInputElement extends HTMLInputElement {
  $destroy: () => void;
}

/**
 * Triggers action when scroll gets close to the bottom.
 *
 * Example usage:
 * <div v-infinite-scroll="action()">Scroll me</div>
 */
const infiniteScroll: DirectiveOptions = {
  bind(el: DestroyHTMLElement, binding: DirectiveBinding): void {
    const params = typeof binding.value === 'object'
      ? binding.value
      : { action: binding.value, enabled: true };

    if (!params.enabled) {
      console.info('DISABLED inf scrolling');
      return;
    }

    const tolerance = parseInt(binding.arg || '100', 10);
    const action = params.action;

    console.info('SETUP inf scrolling');
    el.addEventListener('scroll', (): void => {
      console.info('SCROLLEVENT inf scrolling');
      const height = (el.firstChild as DestroyHTMLElement).clientHeight;
      if (el.scrollTop >= height - el.clientHeight - tolerance) {
        console.info('CALC SUCCESS inf scrolling');
        action();
      }
    });
  },
};

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

    const scrollTo = (target: HTMLElement, scrollable: HTMLElement, scrollableContent: HTMLElement, marginTop: number = 0): void => {
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
        setTimeout((): void => {
          // if scrollableContent height is reduced in half second
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
  unbind(el: DestroyHTMLElement): void {
    el.$destroy();
  },
};

interface DestroyHTMLElementWithAttrs extends DestroyHTMLElement {
  attrs?: object;
}

/**
 * Track an event to amplitude on click.
 *
 * Example usage:
 * <div v-track-click event-name="foo" :event-props="{ bar: 'tzar' }">Click me</div>
 */
const trackClick: DirectiveOptions = {
  bind(el: DestroyHTMLElementWithAttrs, binding: DirectiveBinding, vnode: VNode): void {
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
  update(el: DestroyHTMLElementWithAttrs, binding: DirectiveBinding, vnode: VNode): void {
    el.attrs = vnode.data && vnode.data.attrs ? vnode.data.attrs : {};
  },
  unbind(el: DestroyHTMLElementWithAttrs): void {
    // A race condition occurs when using both a v-track-click directive and an @click handler.
    // If the @click handler removes the element from the DOM, the directive unbind
    // runs before the track-click handler can run. This leads to the v-track-click handler
    // being removed before it can fire.

    // The setTimeout allows the click handler to execute before it is removed.
    setTimeout((): void => {
      el.$destroy();
    }, 0);
  },
};

/**
 * Track an event to amplitude on render (or, more specifically, when it's inserted into its parent).
 *
 * Example usage:
 * <div v-track-render event-name="foo" :event-props="{ bar: 'tzar' }">I rendered.</div>
 */
const trackRender: DirectiveOptions = {
  inserted(el: DestroyHTMLElementWithAttrs, binding: DirectiveBinding, vnode: VNode): void {
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
