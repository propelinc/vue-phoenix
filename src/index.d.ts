import Vue, { PluginFunction } from 'vue';

import CmsPlugin, { CmsOptions } from './main';

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> extends CmsOptions {}
}

export default CmsPlugin;