import CmsContent from '@/components/CmsContent';
import { mount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';
import { compileToFunctions } from 'vue-template-compiler';

Vue.compile = compileToFunctions;
const localVue = createLocalVue();

describe('CmsContent.vue', (): void => {
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

  it('shows the default slot when html is empty', async (): Promise<void> => {
    const wrapper = mount(CmsContent, {
      localVue,
      slots: { default: '<div>Default Content</div>' },
    });

    expect(wrapper.text()).toMatch('Default Content');
  });
});
