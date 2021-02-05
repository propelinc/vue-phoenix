import { shallowMount, createLocalVue } from '@vue/test-utils';

import cmsClient from '@/cmsHttp';
import CmsRemoteAction from '@/components/CmsRemoteAction.vue';
import CmsPlugin from '@/plugins/cms';

const localVue = createLocalVue();
localVue.use(CmsPlugin);

const template = `
  <div
    slot-scope="props"
    class="test"
    @click="props.action({ url: '/foo' })"
  >Click</div>`;

describe('CmsRemoteAction.vue', (): void => {
  let response: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let requestOptions: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let resolvePromise: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let rejectPromise: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  function makeResponse(status: number, data: object) {
    return { status, data };
  }

  beforeEach((): void => {
    requestOptions = null;

    response = new Promise((resolve, reject): void => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cmsClient.cmsAction = jest.fn().mockImplementation((options: any) => {
      requestOptions = options;
      return response;
    });
  });

  it('handles the remote action succeeding', async (): Promise<void> => {
    const wrapper = shallowMount(CmsRemoteAction, {
      localVue,
      scopedSlots: { default: template },
      propsData: { },
    });

    resolvePromise(makeResponse(200, {}));
    expect(wrapper.text()).toMatch('Click');
    wrapper.find('div.test').trigger('click');

    await localVue.nextTick();
    expect(cmsClient.cmsAction).toHaveBeenCalled();
    expect(wrapper.emitted().loading).toBeTruthy();
    expect(wrapper.emitted().success).toBeTruthy();
    expect(wrapper.emitted().done).toBeTruthy();
    expect(wrapper.emitted().error).toBeFalsy();
    expect(requestOptions.url).toBe('/foo');
  });

  it('handles the remote action failing', async (): Promise<void> => {
    const wrapper = shallowMount(CmsRemoteAction, {
      localVue,
      scopedSlots: { default: template },
      propsData: { },
    });

    expect(wrapper.text()).toMatch('Click');
    wrapper.find('div.test').trigger('click');
    rejectPromise({});

    try {
      await response;
    } catch (e) {
      // catch promise rejection
    }

    expect(cmsClient.cmsAction).toHaveBeenCalled();
    expect(wrapper.emitted().loading).toBeTruthy();
    expect(wrapper.emitted().success).toBeFalsy();
    expect(wrapper.emitted().done).toBeTruthy();
    expect(wrapper.emitted().error).toBeTruthy();
    expect(requestOptions.url).toBe('/foo');
  });
});
