import cmsClient from '../../src/cmsHttp';
import { pluginOptions, setBaseUrl } from '../../src/main';

describe('main.ts', () => {
  it('updates the base URL in plugin options and http client', () => {
    pluginOptions.baseUrl = '/test/url';
    cmsClient.setBaseUrl = jest.fn();
    
    setBaseUrl('/new/test/url');

    expect(pluginOptions.baseUrl).toBe('/new/test/url');
    expect(cmsClient.setBaseUrl).toHaveBeenCalledWith('/new/test/url');
  })
});
