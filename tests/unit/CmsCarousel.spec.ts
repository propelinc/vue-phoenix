import { mount, createLocalVue } from '@vue/test-utils';

import CmsCarousel from '@/components/CmsCarousel.vue';

const localVue = createLocalVue();

describe('CmsCarousel.vue', (): void => {
  it('uses the default slot to make a slick carousel', async (): Promise<void> => {
    const wrapper = mount(CmsCarousel, {
      localVue,
      slots: {
        default: ['<div>Slide 1</div>', '<div>Slide 2</div>'],
      },
    });

    const component = wrapper.vm as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(component.index).toBe(0);
    expect(wrapper.find('.slick-slider').exists()).toBe(true);
    expect(wrapper.find('.slick-current').text()).toMatch('Slide 1');

    component.next(0);
    await new Promise((resolve): number => window.setTimeout(resolve, 550));
    expect(wrapper.find('.slick-current').text()).toMatch('Slide 2');
    await new Promise((resolve): number => window.setTimeout(resolve, 550));
    expect(component.index).toBe(1);
  });
});
