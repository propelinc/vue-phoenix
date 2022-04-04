import _Vue from 'vue';

declare module 'vue/types/vue' {
  interface Vue {
    $cms: CmsService;
  }
}

class CmsService {
  isInspectOverlayEnabled: boolean = false;

  changeInspectMode(enabled: boolean): void {
    this.isInspectOverlayEnabled = enabled;
  }
}

const cmsService = _Vue.observable(new CmsService());

export default function installService(Vue: typeof _Vue): void {
  Vue.prototype.$cms = cmsService;
}
