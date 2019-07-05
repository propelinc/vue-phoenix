import { mount, createLocalVue } from '@vue/test-utils';
import { compileToFunctions } from 'vue-template-compiler';
import Vue from 'vue';

import CmsContent from '@/components/CmsContent';

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

  it('shows the default slot when html is empty', async (): Promise<void> => {
    const wrapper = mount(CmsContent, {
      localVue,
      slots: { default: '<div>Default Content</div>' },
    });

    expect(wrapper.text()).toMatch('Default Content');
  });
});
