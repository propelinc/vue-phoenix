import Vue from 'vue';

import CmsPlugin, { CmsPluginOptions } from './plugins/cms';
import './components/capture';
import './directives';
import './utils';

declare module 'vue/types/options' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type ComponentOptions<V extends Vue> = CmsPluginOptions;
}

export default CmsPlugin;
