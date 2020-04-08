import CmsPlugin, { Content, HTMLContent, setBaseUrl } from './src/main';


export { getClosest } from './src/utils';
export { setBaseUrl };

export type CmsContent = Content;
export type CmsHtmlContent = HTMLContent;
export default CmsPlugin;
