import _Vue, { VNode } from 'vue';
import Router from 'vue-router';
import { DirectiveBinding } from 'vue/types/options';

import { Captable } from '../api';
import CmsCarousel from '../components/CmsCarousel.vue';
import CmsContent from '../components/CmsContent';
import CmsZone from '../components/CmsZone.vue';
import { ContentFor, YieldTo } from '../components/capture';
import { addDirectives } from '../directives';

interface DestroyHTMLElement extends HTMLElement {
  $destroy: () => void;
}

export interface CmsPluginOptions {
  baseUrl?: string;
  globalCssCacheMs?: number;
  router?: Router;

  setCaptable?: ((captable: Captable) => void);
  getCaptable?: (() => Captable);
  getSiteVars?: (() => object);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  beforeFetchZone?: null | (() => Promise<any>);
  checkConnection?: (() => boolean);
  onCarouselSwipe?: ((zoneId: string, index: number) => void);

  trackAnalytics?: (eventName: string, eventProps: {[key: string]: any}) => void; // eslint-disable-line @propelinc/no-explicit-any
}

export interface PluginOptions extends CmsPluginOptions {
  baseUrl: string;
  checkConnection: (() => boolean);
  getCaptable: (() => Captable);
  getSiteVars: (() => object);
  globalCssCacheMs: number;
  setCaptable: ((captable: Captable) => void);
  trackAnalytics: (eventName: string, eventProps: {[key: string]: any}) => void; // eslint-disable-line @propelinc/no-explicit-any
}

export const pluginOptions: PluginOptions = {
  baseUrl: '.',
  globalCssCacheMs: 2 * 60 * 1000,
  checkConnection() {
    return navigator.onLine;
  },
  setCaptable(captable: Captable) {
    localStorage.setItem('captable', JSON.stringify(captable));
  },
  getCaptable(): Captable {
    try {
      const captableStr = localStorage.getItem('captable');
      return JSON.parse(captableStr || '');
    } catch (e) {
      return {};
    }
  },
  getSiteVars(): object {
    return {};
  },
  trackAnalytics(): void {
    return;
  },
};
export var finalPluginOptions: PluginOptions;

const plugin = function install(Vue: typeof _Vue, options?: CmsPluginOptions) {
  Object.assign(pluginOptions, options);
  Vue.component('yield-to', YieldTo);
  Vue.component('content-for', ContentFor);
  Vue.component('cms-content', CmsContent);
  Vue.component('cms-carousel', CmsCarousel);
  Vue.component('cms-zone', CmsZone);

  /**
   * Directive used to track impressions on a zone.
   *
   * Example usage:
   * <div v-cms-track-zone="5">Click me</div>
   */
  Vue.directive('cms-track-zone', {
    bind(el: DestroyHTMLElement, binding: DirectiveBinding, vnode: VNode) {
      const handler = () => {
        if (vnode.context && vnode.context.$root) {
          vnode.context.$root.$emit(`cms.track.${binding.value}`);
        }
      };
      el.addEventListener('click', handler);
      el.$destroy = () => el.removeEventListener('click', handler);
    },
    unbind(el: DestroyHTMLElement) {
      el.$destroy();
    },
  });

  addDirectives(Vue);

  if (options && options.router) {
    const router = options.router;
    router.afterEach(() => {
      router.app.$emit('router.change', window.location.hash);
    });
  }
};

export default { install: plugin };
