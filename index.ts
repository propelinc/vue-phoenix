import CmsPlugin from './src/plugins/cms';
import PlanoutPlugin, { PlanoutOverrides as _PlanoutOverrides } from './src/plugins/planout';
import { PlanoutConfig as _PlanoutConfig } from 'planout';
import { Content, HTMLContent } from './src/api';

export { getClosest } from './src/utils';
export { planout } from './src/plugins/planout';

export type CmsContent = Content;
export type CmsHtmlContent = HTMLContent;
export type PlanoutOverrides = _PlanoutOverrides;
export type PlanoutConfig = _PlanoutConfig;

export default {
  cms: CmsPlugin,
  planout: PlanoutPlugin,
};
