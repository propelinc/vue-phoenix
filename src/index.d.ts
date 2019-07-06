import Vue, { PluginFunction } from 'vue'
import Router from 'vue-router';

import CmsPlugin, { CmsOptions as _CmsOptions } from './main';
export { Content, HTMLContent, Captable, ZoneCaptable, CmsOptions } from './main';

export default CmsPlugin;

// declare module 'vue/types/options' {
//   interface ComponentOptions<V extends Vue> extends _CmsOptions {}
// }
