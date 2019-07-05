import { mount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';

import { ContentFor, YieldTo } from '@/components/capture';

const localVue = createLocalVue();

describe('CmsZone.vue', (): void => {

  it('content-for specifies yield-to', async (): Promise<void> => {
    const component = Vue.extend({
      components: { ContentFor, YieldTo },
      data: (): any => ({ replace: false }), // eslint-disable-line @propelinc/no-explicit-any
      template: `
        <div>
          <yield-to name="foo">Default Content</yield-to>
          <content-for v-if="replace" name="foo">New Content</content-for>
        </div>
      `,
    });

    const wrapper = mount(component, { localVue });
    expect(wrapper.text()).toMatch('Default Content');

    wrapper.vm.replace = true;
    expect(wrapper.text()).toMatch('New Content');

    wrapper.vm.replace = false;
    expect(wrapper.text()).toMatch('Default Content');
  });
});
