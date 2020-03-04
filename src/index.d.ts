import Vue from 'vue';

import CmsPlugin, { CmsOptions } from './main';
import './components/capture';
import './directives';
import './utils';

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> extends CmsOptions {}
}

export default CmsPlugin;
