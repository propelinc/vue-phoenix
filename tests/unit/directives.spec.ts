import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';

import { addDirectives } from '@/directives';
import { pluginOptions } from '@/main';

const localVue = createLocalVue();
addDirectives(localVue);

describe('v-track-click directives', (): void => {

  beforeEach((): void => {
    window.onerror = jest.fn();
    pluginOptions.trackClickHandler = jest.fn();
  });

  const specs = [{
    template: `<div v-track-click event-name="kamehameha" :event-props="{ foo: 'bar' }"></div>`,
    eventName: 'kamehameha',
    eventProps: { foo: 'bar' },
  }, {
    template: `<div v-track-click></div>`,
  }];

  specs.forEach((testCase, i): void => {
    it(`tracks an event on click: ${i}`, (): void => {
      const component = Vue.extend({ template: testCase.template });
      const wrapper = shallowMount(component, { localVue });
      expect(pluginOptions.trackClickHandler).not.toHaveBeenCalled();

      console.error = jest.fn();
      wrapper.find('div').trigger('click');

      if (testCase.eventName) {
        expect(pluginOptions.trackClickHandler).toHaveBeenCalledWith(testCase.eventName, testCase.eventProps);
      } else {
        expect(window.onerror).toHaveBeenCalled();
        expect(pluginOptions.trackClickHandler).not.toHaveBeenCalled();
      }
    });
  });
});
