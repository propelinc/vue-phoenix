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

  it('does not track an event on click', (): void => {
    const component = Vue.extend({ template: '<div v-track-click></div>' });
    const wrapper = shallowMount(component, { localVue });
    expect(pluginOptions.trackClickHandler).not.toHaveBeenCalled();

    console.error = jest.fn();
    wrapper.find('div').trigger('click');

    expect(window.onerror).toHaveBeenCalled();
    expect(pluginOptions.trackClickHandler).not.toHaveBeenCalled();
  });

  it('tracks an event on click', async (): Promise<void> => {
    const testCase = {
      template: `<div v-track-click event-name="kamehameha" :event-props="eventProps"></div>`,
      eventName: 'kamehameha',
      eventProps: { foo: 'bar' },
    };

    const component = Vue.extend({
      template: testCase.template,
      data: () => ({ eventProps: testCase.eventProps }),
    });
    const wrapper = shallowMount(component, { localVue });
    expect(pluginOptions.trackClickHandler).not.toHaveBeenCalled();

    console.error = jest.fn();
    wrapper.find('div').trigger('click');

    expect(pluginOptions.trackClickHandler).toHaveBeenCalledWith(testCase.eventName, { foo: 'bar' });
    testCase.eventProps.foo = 'car';
    await Vue.nextTick();

    expect(pluginOptions.trackClickHandler).toHaveBeenCalledWith(testCase.eventName, { foo: 'car' });
  });

  it('tracks an event on click', async (): Promise<void> => {
    const testCase = {
      template: `<div v-if="eventProps.foo == 'bar'" v-track-click @click="eventProps.foo = 'car'" event-name="kamehameha" :event-props="eventProps"></div>`,
      eventName: 'kamehameha',
      eventProps: { foo: 'bar' },
    };

    const component = Vue.extend({
      template: testCase.template,
      data: () => ({ eventProps: testCase.eventProps }),
    });
    const wrapper = shallowMount(component, { localVue });
    expect(pluginOptions.trackClickHandler).not.toHaveBeenCalled();

    console.error = jest.fn();
    wrapper.find('div').trigger('click');

    await Vue.nextTick();
    expect(pluginOptions.trackClickHandler).toHaveBeenCalledWith(testCase.eventName, { foo: 'car' });
  });
});
