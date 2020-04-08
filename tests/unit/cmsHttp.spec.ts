import cmsClient from '../../src/cmsHttp';
import { pluginOptions } from '../../src/main';

describe('cmsHttp.ts', () => {
  it('can update the base URL', () => {
    pluginOptions.baseUrl = '/test/url';
    expect(cmsClient.axios.defaults.baseURL).toBe('/test/url');
    
    cmsClient.setBaseUrl('/new/test/url')
    expect(cmsClient.axios.defaults.baseURL).toBe('/new/test/url');
  })
});
