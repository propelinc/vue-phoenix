import { mount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';
import { compileToFunctions } from 'vue-template-compiler';

import CmsContent from '@/components/CmsContent';

Vue.compile = compileToFunctions;
const localVue = createLocalVue();

describe('CmsContent.vue', (): void => {
  it('creates a dynamic component that allows templating variables', async (): Promise<void> => {
    const extra = { foo: 'bar' };
    const html = '<div>Content {{ context.foo }} {{ context.bar }}</div>';
    const renderContext = { bar: 'car' };
    const wrapper = mount(CmsContent, {
      localVue,
      propsData: { html, extra, renderContext },
    });

    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Content bar car');

    // Changes to extra should be ignored.
    wrapper.setProps({ extra: { foo: 'tar' }, renderContext: { bar: 'tzar' } });
    await Vue.nextTick();
    expect(wrapper.text()).toMatch('Content bar tzar');
  });

  it('allows invoking functions from the context', async (): Promise<void> => {
    const html = '<div>Content {{ context.bus() }}</div>';
    const renderContext = { bus: jest.fn(() => 'bar') };
    const wrapper = mount(CmsContent, {
      localVue,
      propsData: { html, renderContext },
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
});
