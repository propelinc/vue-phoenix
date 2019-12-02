import { VNode, VueConstructor } from 'vue';
import { DirectiveBinding, DirectiveOptions } from 'vue/types/options';

import { getClosest } from './utils';
import { pluginOptions } from './main';

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
    const tolerance = parseInt(binding.arg || '100', 10);
    const action = binding.value;

    el.addEventListener('scroll', (): void => {
      const height = (el.firstChild as DestroyHTMLElement).clientHeight;
      if (el.scrollTop >= height - el.clientHeight - tolerance) {
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

/**
 * Track an event to amplitude on click.
 *
 * Example usage:
 * <div v-track-click event-name="foo" :event-props="{ bar: 'tzar' }">Click me</div>
 */
const trackClick: DirectiveOptions =  {
  bind(el: DestroyHTMLElement, binding: DirectiveBinding, vnode: VNode): void {
    const attrs = vnode.data && vnode.data.attrs ? vnode.data.attrs: {};

    const wrappedHandler = (): void => {
      if (!attrs['event-name']) {
        throw new Error('v-track-click: "event-name" attribute is required.');
      }
      pluginOptions.trackClickHandler(attrs['event-name'], attrs['event-props'] || {} );
    };
    el.addEventListener('click', wrappedHandler);
    el.$destroy = (): void => el.removeEventListener('click', wrappedHandler);
  },
  unbind(el: DestroyHTMLElement): void {
    // unbind is subject to a very specific race condition:
    //
    // If you set up both a v-track-click directive and an @click handler you can run into some issues
    // The @click handler seems to get registered and to fire first.
    // If that @click handler moves you away from the current page immediately, the unbind call will run
    // before the click handler function setup on bind.
    // This will lead to the click handler being removed and the handler not being run
    //
    // To fix that issue, we are using a setTimeout of 0. This yeilds the javascript event loop during the
    // navigation away from the elements page. This allows the other click handlers to run before the
    // event listeners are removed
    setTimeout((): void => {
      el.$destroy();
    }, 0);
  },
};

export function addDirectives(Vue: VueConstructor): void {
  Vue.directive('infinite-scroll', infiniteScroll);
  Vue.directive('scroll-on-focus', scrollOnFocus);
  Vue.directive('track-click', trackClick);
}
