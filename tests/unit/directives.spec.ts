import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';

import { addDirectives } from '@/directives';
import { pluginOptions } from '@/plugins/cms';

const localVue = createLocalVue();
addDirectives(localVue);

describe('v-track-click tests', (): void => {
  beforeEach((): void => {
    window.onerror = jest.fn();
    pluginOptions.trackAnalytics = jest.fn();
  });

  it('does not track an event on click', (): void => {
    const component = Vue.extend({ template: '<div v-track-click></div>' });
    const wrapper = shallowMount(component, { localVue });
    expect(pluginOptions.trackAnalytics).not.toHaveBeenCalled();

    console.error = jest.fn();
    wrapper.find('div').trigger('click');

    expect(window.onerror).toHaveBeenCalled();
    expect(pluginOptions.trackAnalytics).not.toHaveBeenCalled();
  });

  it('tracks an event on click', async (): Promise<void> => {
    const testCase = {
      template: `<div v-track-click event-name="kamehameha" :event-props="eventProps"></div>`,
      eventName: 'kamehameha',
      eventProps: { foo: 'bar' },
    };

    const component = Vue.extend({
      data: () => ({ eventProps: testCase.eventProps }),
      template: testCase.template,
    });
    const wrapper = shallowMount(component, { localVue });
    expect(pluginOptions.trackAnalytics).not.toHaveBeenCalled();

    console.error = jest.fn();
    wrapper.find('div').trigger('click');

    expect(pluginOptions.trackAnalytics).toHaveBeenCalledWith(testCase.eventName, { foo: 'bar' });
    testCase.eventProps.foo = 'car';
    await Vue.nextTick();

    expect(pluginOptions.trackAnalytics).toHaveBeenCalledWith(testCase.eventName, { foo: 'car' });
  });

  it('tracks an event on click even if element is removed from the DOM', async (): Promise<void> => {
    const testCase = {
      template: `<div v-if="eventProps.foo == 'bar'" @click="eventProps.foo = 'car'" v-track-click event-name="kamehameha" :event-props="eventProps"></div>`,
      eventName: 'kamehameha',
      eventProps: { foo: 'bar' },
    };

    const component = Vue.extend({
      data: () => ({ eventProps: testCase.eventProps }),
      template: testCase.template,
    });
    const wrapper = shallowMount(component, { localVue });
    expect(pluginOptions.trackClickHandler).not.toHaveBeenCalled();

    console.error = jest.fn();
    wrapper.find('div').trigger('click');

    await Vue.nextTick();
    expect(pluginOptions.trackClickHandler).toHaveBeenCalledWith(testCase.eventName, { foo: 'car' });
  });

  it('tracks when the event name is the value of the directive', async (): Promise<void> => {
    const testCase = {
      template: `<div v-if="eventProps.foo == 'bar'" @click="eventProps.foo = 'car'" v-track-click="'kamehameha'" :event-props="eventProps"></div>`,
      eventName: 'kamehameha',
      eventProps: { foo: 'bar' },
    };

    const component = Vue.extend({
      data: () => ({ eventProps: testCase.eventProps }),
      template: testCase.template,
    });
    const wrapper = shallowMount(component, { localVue });
    expect(pluginOptions.trackAnalytics).not.toHaveBeenCalled();

    console.error = jest.fn();
    wrapper.find('div').trigger('click');

    await Vue.nextTick();
    expect(pluginOptions.trackAnalytics).toHaveBeenCalledWith(testCase.eventName, { foo: 'car' });
  });
});

describe('v-track-render tests', (): void => {
  beforeEach((): void => {
    pluginOptions.trackClickHandler = jest.fn();
  });

  it('tracks an event when inserted into the DOM (technically, its parent)', async (): Promise<void> => {
    const testCase = {
      template: `<div v-if="eventProps.foo == 'car'" @click="eventProps.foo = 'bar'" v-track-render="'kamehameha'" :event-props="eventProps"></div>`,
      eventName: 'kamehameha',
      eventProps: { foo: 'bar' },
    };

    const component = Vue.extend({
      data: () => ({ eventProps: testCase.eventProps }),
      template: testCase.template,
    });
    const wrapper = shallowMount(component, { localVue });

    expect(pluginOptions.trackClickHandler).not.toHaveBeenCalled();

    wrapper.setData({ eventProps: { foo: 'car' } });

    await Vue.nextTick();
    expect(pluginOptions.trackClickHandler).toHaveBeenCalledWith(testCase.eventName, { foo: 'car' });
  });
});

describe('v-init', () => {
  it('v-init sets the correct values', () => {
    const testComponent = Vue.extend({
      data: function() {
        return { context: {} };
      },
      template: '<div v-init="{ context: context, value: { hello: \'world\'}}"></div>',
    });
    const wrapper = shallowMount(testComponent, { localVue });
    expect(wrapper.vm.$data.context).toEqual({ hello: 'world' });
  });
});
