import { shallowMount, createLocalVue } from '@vue/test-utils';

import cmsClient from '@/cmsHttp';
import CmsServerRequest from '@/components/CmsServerRequest.vue';
import CmsPlugin from '@/plugins/cms';

import { supressPromiseRejection } from './util';

const localVue = createLocalVue();
localVue.use(CmsPlugin);

const template = `
  <div
    slot-scope="props"
    class="test"
    @click="props.request({ url: '/foo' })"
  >Click</div>`;

describe('CmsServerRequest.vue', (): void => {
  let response: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let resolvePromise: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let rejectPromise: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach((): void => {
    response = new Promise((resolve, reject): void => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    cmsClient.axios.request = jest.fn().mockImplementation(() => response);
  });

  it('handles the request succeeding', async (): Promise<void> => {
    const wrapper = shallowMount(CmsServerRequest, {
      localVue,
      scopedSlots: { default: template },
      propsData: {},
    });

    resolvePromise({ status: 200, data: {} });
    expect(wrapper.text()).toMatch('Click');
    wrapper.find('div.test').trigger('click');

    await localVue.nextTick();
    expect(cmsClient.axios.request).toHaveBeenCalledWith({ url: '/foo' });
    expect(wrapper.emitted().loading).toBeTruthy();
    expect(wrapper.emitted().success).toBeTruthy();
    expect(wrapper.emitted().done).toBeTruthy();
    expect(wrapper.emitted().error).toBeFalsy();
  });

  it('handles the request failing', async (): Promise<void> => {
    const wrapper = shallowMount(CmsServerRequest, {
      localVue,
      scopedSlots: { default: template },
      propsData: {},
    });

    expect(wrapper.text()).toMatch('Click');
    wrapper.find('div.test').trigger('click');
    rejectPromise({});
    supressPromiseRejection(response);

    await localVue.nextTick();
    expect(cmsClient.axios.request).toHaveBeenCalledWith({ url: '/foo' });
    expect(wrapper.emitted().loading).toBeTruthy();
    expect(wrapper.emitted().success).toBeFalsy();
    expect(wrapper.emitted().done).toBeTruthy();
    expect(wrapper.emitted().error).toBeTruthy();
  });
});
