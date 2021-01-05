import { Content } from '@/api';
import { shallowMount, mount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';
import { compileToFunctions } from 'vue-template-compiler';

import cmsClient from '@/cmsHttp';
import CmsZone from '@/components/CmsZone.vue';
import CmsPlugin from '@/plugins/cms';

Vue.compile = compileToFunctions;
const localVue = createLocalVue();
localVue.use(CmsPlugin);

describe('CmsZone.vue', (): void => {
  let response: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let requestOptions: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let resolvePromise: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let rejectPromise: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  function makeResponse(zoneType: string, content: Content[]) {
    return {
      status: 200,
      data: {
        content,
        zone_type: zoneType,
        zone_header: '<div>Some header</div>',
        zone_footer: '<div>Some footer</div>',
      },
    };
  }

  beforeEach((): void => {
    requestOptions = null;

    response = new Promise((resolve, reject): void => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    Element.prototype.getBoundingClientRect = jest.fn((): DOMRect => {
      return { width: 120, height: 120, top: 0, left: 0, bottom: 0, right: 0 } as DOMRect;
    });

    cmsClient.trackZone = jest.fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cmsClient.fetchZone = jest.fn().mockImplementation((options: any) => {
      requestOptions = options;
      return response;
    });
  });

  it('renders default content on error fetching zone', async (): Promise<void> => {
    const zoneId = '5';
    const extra = { foo: 'bar' };
    const wrapper = shallowMount(CmsZone, {
      localVue,
      slots: { default: '<div>Default Content</div>' },
      propsData: { zoneId, extra },
    });

    expect(cmsClient.fetchZone).toHaveBeenCalled();
    expect(requestOptions.zoneId).toBe(zoneId);
    expect(requestOptions.extra).toBe(extra);
    expect(wrapper.text()).toMatch('Default Content');
    expect(wrapper.classes()).toContain('cms-zone-loading');

    try {
      rejectPromise({});
      await response;
    } catch (e) {
      await localVue.nextTick();
      expect(wrapper.text()).toMatch('Default Content');
      expect(wrapper.classes()).toContain('cms-zone-error');
    }
  });

  ['default', 'carousel', 'scrolling'].forEach((zoneType): void => {
    it(`renders empty state for ${zoneType} zone`, async (): Promise<void> => {
      const zoneId = '5';
      const extra = { foo: 'bar' };
      const wrapper = mount(CmsZone, {
        localVue,
        slots: { default: '<div>Default Content</div>' },
        propsData: { zoneId, extra },
      });

      resolvePromise(makeResponse(zoneType, []));
      await response;
      await localVue.nextTick();
      const expectedClasses = zoneType === 'scrolling' ? ['scrollable-content'] : [];
      expect(wrapper.classes()).toEqual(expectedClasses);
      expect(wrapper.text()).toBe('');
      expect(wrapper.text()).not.toMatch('Some header');
      expect(wrapper.text()).not.toMatch('Some footer');
    });

    it(`renders and tracks received content for '${zoneType}' zones`, async (): Promise<void> => {
      const zoneId = '5';
      const extra = { foo: 'bar' };
      const context = { bar: 'car' };
      const wrapper = mount(CmsZone, {
        localVue,
        slots: { default: '<div>Default Content</div>' },
        propsData: { zoneId, extra, context },
      });

      resolvePromise(makeResponse(zoneType, [{
        html: '<div>Some Content {{ context.bar }}</div>',
        tracker: 'foo',
      }]));

      await response;
      await localVue.nextTick();
      const expectedClasses = zoneType === 'scrolling' ? ['scrollable-content'] : [];
      expect(wrapper.classes()).toEqual(expectedClasses);
      expect(cmsClient.trackZone).toHaveBeenCalled();
      expect(wrapper.find('.cms-zone-contents-5-0')).toBeTruthy();
      expect(wrapper.text()).toMatch('Some header');
      expect(wrapper.text()).toMatch('Some Content car');
      expect(wrapper.text()).toMatch('Some footer');

      wrapper.setProps({ context: { bar: 'tzar' } });
      await localVue.nextTick();
      expect(wrapper.text()).toMatch('Some Content tzar');
    });

    it(`renders but does not track content in scrollable for '${zoneType}' zones`, async (): Promise<void> => {
      const component = Vue.extend({
        components: { CmsZone },
        template: `
          <div class="scrollable">
            <div class="scrollable-content">
              <cms-zone zone-id="5"/>
            </div>
          </div>
        `,
      });

      resolvePromise(makeResponse(zoneType, [{ html: '<div>Some Content</div>', tracker: 'foo' }]));
      const wrapper = mount(component, { localVue });
      await response;
      await localVue.nextTick();
      expect(cmsClient.trackZone).not.toHaveBeenCalled();
      expect(wrapper.find('.cms-zone-contents-5-0')).toBeTruthy();
      expect(wrapper.text()).toMatch('Some header');
      expect(wrapper.text()).toMatch('Some Content');
      expect(wrapper.text()).toMatch('Some footer');
      await new Promise((resolve): number => setTimeout(resolve, 1050));
      expect(cmsClient.trackZone).toHaveBeenCalled();
    });

    it(`supports deferred tracking with extra.track_on for '${zoneType}' zones`, async (): Promise<void> => {
      const zoneId = '5';
      const extra = { foo: 'bar' };
      const wrapper = mount(CmsZone, {
        localVue,
        slots: { default: '<div>Default Content</div>' },
        propsData: { zoneId, extra },
      });

      resolvePromise(makeResponse(zoneType, [{
        html: '<div>Some Content</div>',
        tracker: 'foo',
        extra: { track_on: 'someroute' },
      }]));

      await response;
      await localVue.nextTick();
      expect(cmsClient.trackZone).not.toHaveBeenCalled();
      expect(wrapper.text()).toMatch('Some header');
      expect(wrapper.text()).toMatch('Some Content');
      expect(wrapper.text()).toMatch('Some footer');
      wrapper.vm.$root.$emit('router.change', '#/someroute?foo=bar');
      expect(cmsClient.trackZone).toHaveBeenCalled();
    });

    it(`supports deferred tracking by click with extra.track_on for '${zoneType}' zones`, async (): Promise<void> => {
      const component = Vue.extend({
        components: { CmsZone },
        template: `
          <div>
            <div class="tracker" v-cms-track-zone="5">Byrgenworth</div>
            <cms-zone zone-id="5"/>
          </div>
        `,
      });

      resolvePromise(makeResponse(zoneType, [{
        html: '<div>Some Content</div>',
        tracker: 'foo',
        extra: { track_on: 'click' },
      }]));

      const wrapper = mount(component, { localVue });
      await response;
      await localVue.nextTick();
      expect(cmsClient.trackZone).not.toHaveBeenCalled();
      expect(wrapper.text()).toMatch('Some header');
      expect(wrapper.text()).toMatch('Some Content');
      expect(wrapper.text()).toMatch('Some footer');
      wrapper.find('.tracker').trigger('click');
      expect(cmsClient.trackZone).toHaveBeenCalled();
    });
  });
});

describe('CmsZone.vue isContentVisible tests:', (): void => {
  let cms: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  function getElementWithRect(height: number, top: number, bottom: number): Element {
    const element = document.createElement('div');
    (element as any).getBoundingClientRect = () => ({ height, top, bottom });// eslint-disable-line @typescript-eslint/no-explicit-any
    return element;
  }

  beforeEach((): void => {
    const wrapper = shallowMount(CmsZone, {
      localVue,
      propsData: { zoneId: '5' },
    });
    cms = wrapper.vm;
  });

  it('should only be visible when completely in view', (): void => {
    let el = getElementWithRect(10, 20, 30);
    let viewport = getElementWithRect(20, 0, 20);
    expect(cms.isContentVisible(el, viewport, 100)).toBe(false);

    el = getElementWithRect(10, 11, 21);
    viewport = getElementWithRect(20, 0, 20);
    expect(cms.isContentVisible(el, viewport, 100)).toBe(false);

    el = getElementWithRect(10, 10, 20);
    viewport = getElementWithRect(20, 0, 20);
    expect(cms.isContentVisible(el, viewport, 100)).toBe(true);

    el = getElementWithRect(10, 0, 10);
    viewport = getElementWithRect(20, 0, 20);
    expect(cms.isContentVisible(el, viewport, 100)).toBe(true);

    el = getElementWithRect(10, -1, 9);
    viewport = getElementWithRect(20, 0, 20);
    expect(cms.isContentVisible(el, viewport, 100)).toBe(false);

    el = getElementWithRect(10, -10, 0);
    viewport = getElementWithRect(20, 0, 20);
    expect(cms.isContentVisible(el, viewport, 100)).toBe(false);
  });

  it('should be visible when the minimum percentage is met', (): void => {
    const el = getElementWithRect(10, 19, 29);
    const viewport = getElementWithRect(20, 0, 20);
    expect(cms.isContentVisible(el, viewport, 10)).toBe(true);
    expect(cms.isContentVisible(el, viewport, 11)).toBe(false);
  });
});
