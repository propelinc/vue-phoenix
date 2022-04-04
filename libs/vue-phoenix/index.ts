import { PlanoutEvent as PlanoutEventType, PlanoutConfig as PlanoutConfigType } from 'planout';

import { Content, HTMLContent } from './src/api';
import VueCmsPlugin from './src/plugins/cms';
import VuePlanoutPlugin, {
  PlanoutPlugin as PlanoutPluginType,
  PlanoutOverrides as PlanoutOverridesType,
} from './src/plugins/planout';

export { getClosest } from './src/utils';
export { planout } from './src/plugins/planout';

export type CmsContent = Content;
export type CmsHtmlContent = HTMLContent;
export type PlanoutEvent = PlanoutEventType;
export type PlanoutOverrides = PlanoutOverridesType;
export type PlanoutPlugin = PlanoutPluginType;
export type PlanoutConfig = PlanoutConfigType;

export default {
  cms: VueCmsPlugin,
  planout: VuePlanoutPlugin,
};
