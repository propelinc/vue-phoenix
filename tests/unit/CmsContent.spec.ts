import { mount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';
import { compileToFunctions } from 'vue-template-compiler';

import CmsContent from '@/components/CmsContent';
import { pluginOptions } from '@/plugins/cms';

Vue.compile = compileToFunctions;
const localVue = createLocalVue();

describe('CmsContent.vue', (): void => {
  it('creates a dynamic component that allows templating variables', async (): Promise<void> => {
    const context = { foo: 'bar' };
    const html = '<div>Content {{ context.foo }}</div>';
    const wrapper = mount(CmsContent, {
      localVue,
      propsData: { html, context },
    });

    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Content bar');

    wrapper.setProps({ context: { foo: 'tar' } });
    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Content tar');
  });

  it('allows invoking functions from the context', async (): Promise<void> => {
    const html = '<div>Content {{ context.bus() }}</div>';
    const context = { bus: jest.fn(() => 'bar') };
    const wrapper = mount(CmsContent, {
      localVue,
      propsData: { html, context },
    });

    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Content bar');
  });

  it('shows the default slot when html is empty', async (): Promise<void> => {
    const wrapper = mount(CmsContent, {
      localVue,
      slots: { default: '<div>Default Content</div>' },
    });

    expect(wrapper.text()).toMatch('Default Content');
  });

  it('initializes the context by calling setup', async (): Promise<void> => {
    const html = '<div :run="setup({k: 5})">Content {{ context.k }}</div>';
    const wrapper = mount(CmsContent, { localVue, propsData: { html } });
    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Content 5');
  });

  it('cannot re-initialize the context', async (): Promise<void> => {
    const html = '<div :run="setup({k: 5})"><span :run="setup({k: 2})>Content {{ context.k }}</span></div>';
    const wrapper = mount(CmsContent, { localVue, propsData: { html } });
    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Content 5');
  });

  it('tracks analytics events', async (): Promise<void> => {
    pluginOptions.trackAnalytics = jest.fn();
    const html = `<div :run="setup({k: 5})"><div :run="trackEvent('foo', context)">Foo</div></div>`;
    const wrapper = mount(CmsContent, { localVue, propsData: { html } });
    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Foo');
    expect(pluginOptions.trackAnalytics).toHaveBeenCalled();
  });
});
