import _Vue, { VNode } from 'vue';
import Router from 'vue-router';
import { DirectiveBinding } from 'vue/types/options';

import { ContentFor, YieldTo } from './components/capture';
import CmsContent from './components/CmsContent';
import CmsCarousel from './components/CmsCarousel.vue';
import CmsZone from './components/CmsZone.vue';
import { addDirectives, TrackClickDataAttributes, trackClickHandlerFunction } from './directives';

export { getClosest } from './utils';
export { TrackClickDataAttributes } from './directives';

export interface Captable {
}

export interface ZoneCaptable {
  zoneId?: Captable;
}

export interface CMSZoneResponse {
  content: Content[];
  captable: Captable;
  zone_type: string;
  zone_header: string | null;
  zone_footer: string | null;
}

export interface HTMLContent {
  html: string;
}

export interface Content extends HTMLContent {
  tracker: string;
  track_on?: string;
  tracked?: boolean;
  extra?: {
    track_on?: string;
    external_trackers?: string[];
  }
}

export interface ContentTracker {
  trackOn: string;
  content: any; // eslint-disable-line @propelinc/no-explicit-any
  zoneId: string;
}

interface DestroyHTMLElement extends HTMLElement {
  $destroy: () => void;
}

export interface CmsOptions {
  baseUrl?: string;
  globalCssCacheMs?: number;
  router?: Router;

  setCaptable?: ((captable: Captable) => void);
  getCaptable?: (() => Captable);
  getSiteVars?: (() => object);

  /* eslint-disable-next-line @propelinc/no-explicit-any */
  beforeFetchZone?: null | (() => Promise<any>);
  checkConnection?: (() => boolean);
  onCarouselSwipe?: ((zoneId: string, index: number) => void);

  trackClickHandler?: trackClickHandlerFunction;
}

export interface PluginOptions extends CmsOptions {
  baseUrl: string;
  checkConnection: (() => boolean);
  getCaptable: (() => Captable);
  getSiteVars: (() => object);
  globalCssCacheMs: number;
  setCaptable: ((captable: Captable) => void);
  trackClickHandler: trackClickHandlerFunction;
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
    } catch(e) {
      return {};
    }
  },
  getSiteVars(): object {
    return {};
  },
  trackClickHandler(attrs: TrackClickDataAttributes): void {
    if (!attrs['event-name']) {
      throw new Error('v-track-click: "event-name" attribute is required.');
    }
  },
};
export var finalPluginOptions: PluginOptions;

const plugin = function install(Vue: typeof _Vue, options?: CmsOptions) {
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

  addDirectives(Vue, pluginOptions.trackClickHandler);

  if (options && options.router) {
    const router = options.router;
    router.afterEach(() => {
      router.app.$emit('router.change', window.location.hash);
    });
  }
};

export default { install: plugin };
