import Vue from 'vue';

import CmsPlugin, { CmsPluginOptions } from './plugins/cms';
import './components/capture';
import './directives';
import './utils';

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> extends CmsPluginOptions {}
}

export default CmsPlugin;
