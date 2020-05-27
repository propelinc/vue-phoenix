import Vue from 'vue';

import _CmsPlugin, { CmsPluginOptions } from './plugins/cms';
import _PlanoutPlugin, { PlanoutPluginOptions } from './plugins/planout';
import './components/capture';
import './directives';
import './utils';

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> extends CmsPluginOptions, PlanoutPluginOptions {}
}

interface phoenix {
  cms: typeof _CmsPlugin;
  planout: typeof _PlanoutPlugin;
}

export default phoenix;
