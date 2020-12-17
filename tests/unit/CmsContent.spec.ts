import { mount, createLocalVue } from '@vue/test-utils';
import { mocked } from 'ts-jest';
import Vue from 'vue';
import { compileToFunctions } from 'vue-template-compiler';

import CmsCssManager from '@/CmsCssManager';
import CmsContent from '@/components/CmsContent';

jest.mock('@/CmsCssManager');
const mockedCmsCssManager = mocked(CmsCssManager, true);

Vue.compile = compileToFunctions;
const localVue = createLocalVue();

describe('CmsContent.vue', (): void => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates a dynamic component that allows templating variables', async (): Promise<void> => {
    const extra = { foo: 'bar' };
    const html = '<div>Content {{ context.foo }}</div>';
    const wrapper = mount(CmsContent, {
      localVue,
      propsData: { html, extra },
    });

    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Content bar');
  });

  it('allows invoking functions from the context', async (): Promise<void> => {
    const extra = { bus: jest.fn(() => 'bar') };
    const html = '<div>Content {{ context.bus() }}</div>';
    const wrapper = mount(CmsContent, {
      localVue,
      propsData: { html, extra },
    });

    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Content bar');
  });

  it('shows the default slot when html is empty', () => {
    const wrapper = mount(CmsContent, {
      localVue,
      slots: { default: '<div>Default Content</div>' },
    });

    expect(wrapper.text()).toMatch('Default Content');
  });

  it('creates adds correctly scoped styles when rendered', () => {
    mount(CmsContent, {
      localVue,
      propsData: { css: 'h1 {color: blue;}', html: '<div></div>' },
    });

    expect(mockedCmsCssManager.mock.instances[0].addStyles).toBeCalledWith('h1 {color: blue;}');
  });

  it('updates scoped styles tag when css is changed', async () => {
    const wrapper = mount(CmsContent, {
      localVue,
      propsData: { css: 'h1 {color: blue;}', html: '<div></div>' },
    });

    await wrapper.setProps({ css: 'h1 {color: pink;}' });

    expect(mockedCmsCssManager.mock.instances[0].updateStyles).toBeCalledWith('h1 {color: pink;}');
  });

  it('updates scoped styles tag when css is removed', async () => {
    const wrapper = mount(CmsContent, {
      localVue,
      propsData: { css: 'h1 {color: blue;}', html: '<div></div>' },
    });

    await wrapper.setProps({ css: null });

    expect(mockedCmsCssManager.mock.instances[0].removeStyles).toHaveBeenCalled();
  });

  it('removes scoped styles when component is destroyed', () => {
    const wrapper = mount(CmsContent, {
      localVue,
      propsData: { css: 'h1 {color: blue;}' },
    });

    wrapper.destroy();

    expect(mockedCmsCssManager.mock.instances[0].removeStyles).toHaveBeenCalled();
  });
});
