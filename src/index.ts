import _Vue, { VNode } from 'vue';
import Router from 'vue-router';
import { DirectiveBinding } from 'vue/types/options';

import { Captable } from './cmsHttp';
import { ContentFor, YieldTo } from './components/capture';
import CmsContent from './components/CmsContent';
import CmsCarousel from './components/CmsCarousel.vue';
import CmsZone from './components/CmsZone.vue';

interface DestroyHTMLElement extends HTMLElement {
  $destroy: () => void;
}

export interface CmsOptions {
  baseUrl: string;
  router?: Router;

  setCaptable: ((captable: Captable) => void);
  getCaptable: (() => Captable);
  getSiteVars: (() => object);

  /* eslint-disable-next-line @propelinc/no-explicit-any */
  beforeFetchZone?: null | (() => Promise<any>);
  checkConnection?: (() => boolean);
}

export interface CmsPlugin extends CmsOptions {
  install: (Vue: typeof _Vue, options?: CmsOptions) => void;
  checkConnection: () => boolean;
}

export default {
  baseUrl: '.',
  checkConnection() {
    return navigator.onLine;
  },
  setCaptable(captable: Captable) {
    console.info('Did not set captable', captable);
    throw new Error('Not implemented');
  },
  getCaptable(): Captable {
    throw new Error('Not implemented');
  },
  getSiteVars(): object {
    return {};
  },
  install(Vue: typeof _Vue, options?: CmsOptions): void {
    Object.assign(this, options);
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
      bind (el: DestroyHTMLElement, binding: DirectiveBinding, vnode: VNode) {
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

    if (options && options.router) {
      const router = options.router;
      router.afterEach(() => {
        router.app.$emit('router.change', window.location.hash);
      });
    }
  },
} as CmsPlugin;
