<template>
  <div
    v-infinite-scroll="{ action: next, enabled: isScrolling }"
    :class="{ 'scrollable-content': isScrolling }"
  >
    <slot v-if="!zoneType && !contents.length" />
    <slot v-if="zoneStatus === 'error'" name="error" />
    <slot v-if="zoneStatus === 'offline'" name="offline" />
    <slot v-if="zoneStatus === 'loading'" name="loading" />
    <div v-if="contents.length">
      <cms-content v-if="zoneHeader" :html="zoneHeader" :zone-id="zoneId"/>
      <cms-carousel
        v-if="zoneType === 'carousel'"
        :center-padding="contents.length > 1 ? '20px' : '0'"
        :zone-id="zoneId"
        @change="trackIndex"
      >
        <cms-content
          v-for="(content, index) in contents"
          :key="index"
          :class="`cms-zone-content-${zoneId}-${index}`"
          class="cms-zone-carousel-content"
          tag="div"
          :html="content.html"
          :extra="extra"
          :zone-id="zoneId"
          @click.native.stop.prevent="onLogoTapped(content.delivery, zoneId)">
        </cms-content>
      </cms-carousel>
      <div v-else class="zone-contents">
        <cms-content
          v-for="(content, index) in contents"
          :key="index"
          :class="`cms-zone-content-${zoneId}-${index}`"
          tag="div"
          :html="content.html"
          :extra="extra"
          :zone-id="zoneId"
        />
      </div>
      <slot v-if="cursorLoading" name="cursor" />
      <cms-content v-if="zoneFooter" :html="zoneFooter" :zone-id="zoneId" />
    </div>
  </div>
</template>

<style>
.scrollable {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}

.scrollable-header {
  flex: 0 0 auto;
  position: static;
}

.scrollable-content {
  height: 100%;
  width: 100%;
  flex: 1 1 auto;
  position: relative; /* need this to position inner content */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>

<script lang="ts">
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

import { Content } from '../api';
import cmsClient from '../cmsHttp';
import { pluginOptions } from '../plugins/cms';

import CmsCarousel from './CmsCarousel.vue';
import CmsContent from './CmsContent';

const durationVisibleToBeTrackedMs = 1000;
const percentVisible = 50;

export function getClosest(elm: Element, selector: string): HTMLElement | null {
  while (elm && elm.parentNode !== document) {
    if (elm.matches(selector)) {
      return elm as HTMLElement;
    }
    elm = elm.parentNode as HTMLElement;
  }
  return null;
}

@Component({
  name: 'cms-zone',
  components: { CmsCarousel, CmsContent },
})
export default class CmsZone extends Vue {
  @Prop(String) public zoneId!: string;
  @Prop(Object) public extra!: {};

  public zoneStatus: string | null = null;
  public zoneType: string = '';
  public zoneHeader: string = '';
  public zoneFooter: string = '';
  public contents: Content[] = [];
  public cursor: string = '';
  public scrollable: Element | null = null;
  public scrollableListeners: EventListener[] = [];
  public showContentInfo: boolean = false;

  public cursorLoading: boolean = false;
  public next = debounce(() => this.getNextPage(), 400);

  private get isScrolling() {
    return this.zoneType === 'scrolling';
  }

  private created(): void {
    this.$root.$on('cms.refresh', this.refresh);
    this.$root.$on(`cms.refresh.${this.zoneId}`, this.refresh);
  }

  private mounted(): void {
    this.refresh();
  }

  private beforeDestroy(): void {
    this.$root.$off('cms.refresh', this.refresh);
    this.$root.$off(`cms.refresh.${this.zoneId}`, this.refresh);
    this.removeScrollListeners();
  }

  private removeScrollListeners(): void {
    if (this.scrollable) {
      for (const h of this.scrollableListeners) {
        this.scrollable.removeEventListener('scroll', h);
      }
      this.scrollableListeners = [];
      this.scrollable = null;
    }
  }

  private onLogoTapped(delivery_id?: any, zone_id?: any): void {
    // alert()
    alert("Delivery id: " + delivery_id + " Zone id: " +zone_id);
    // this.logoTapCount++;
    // if (this.logoTapCount === 7) {
    //   CoreModule.SET_DEBUG_MODE(true);
    //   this.logoTapCount = 0;
    // }
  }

  @Watch('zoneId')
  private onZoneIdChanged(): void {
    this.refresh();
  }

  @Watch('extra', { deep: true, immediate: true })
  private async onExtraChanged(value?: object, oldValue?: object): Promise<void> {
    // Prevent deep watcher for extra from firing too often.
    // See: https://github.com/vuejs/vue/issues/5776
    if (oldValue !== undefined && !isEqual(value, oldValue)) {
      await Vue.nextTick();
      this.refresh();
    }
  }

  private async refresh(): Promise<void> {
    if (!pluginOptions.checkConnection()) {
      this.zoneStatus = 'offline';
      this.$el.classList.add('cms-zone-offline');
      this.$el.classList.remove('cms-zone-error');
      this.$el.classList.remove('cms-zone-loading');
      this.contents = [];
      return;
    }

    this.zoneStatus = 'loading';
    this.$el.classList.add('cms-zone-loading');
    this.$el.classList.remove('cms-zone-error');
    this.$el.classList.remove('cms-zone-offline');

    let response;
    try {
      response = await cmsClient.fetchZone({ zoneId: this.zoneId, extra: this.extra });
      this.$el.classList.remove('cms-zone-loading');
      if (!response.data || !response.data.content) {
        throw new Error('No data');
      }
    } catch (error) {
      this.zoneStatus = 'error';
      this.$el.classList.remove('cms-zone-loading');
      this.$el.classList.add('cms-zone-error');
      this.zoneType = '';
      this.contents = [];
      return;
    }
    const data = response.data;
    this.zoneType = data.zone_type;
    this.contents = data.content as Content[];
    this.cursor = data.cursor;
    this.zoneHeader = data.zone_header ? `<div class="zone-header">${data.zone_header || ''}</div>` : '';
    this.zoneFooter = data.zone_footer ? `<div class="zone-footer">${data.zone_footer || ''}</div>` : '';
    this.zoneStatus = null;

    if (!this.contents.length) {
      return;
    }

    this.removeScrollListeners();
    this.scrollable = getClosest(this.$el, '.scrollable-content');
    if (this.scrollable) {
      this.trackScrollable(this.contents, this.scrollable);
      return;
    }

    if (this.zoneType === 'carousel') {
      this.trackIndex(0);
    } else {
      this.contents.forEach((c, i): void => this.trackIndex(i));
    }
  }

  private trackIndex(index: number): void {
    const content = this.contents[index];
    if (!content || content.tracked) {
      return;
    }
    content.tracked = true;

    const trackOn = (content.extra || {}).track_on;
    if (trackOn) {
      this.$root.$once(`cms.track.${this.zoneId}`, (): void => {
        cmsClient.trackZone({ content, zoneId: this.zoneId });
        this.$root.$emit('cms.refresh', [this.zoneId]);
      });

      this.$root.$once('router.change', (hash: string): void => {
        const regex = new RegExp(trackOn);
        if (regex.test(hash)) {
          this.$root.$emit(`cms.track.${this.zoneId}`);
        }
      });
      return;
    }

    cmsClient.trackZone({ content, zoneId: this.zoneId });
  }

  private trackScrollable(contents: Content[], scrollable: Element): void {
    if (this.zoneType === 'carousel') {
      let timeout: number;
      const listener = (): void => {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(():void => {
          const contentElm = this.$el.querySelector('.slick-current');
          if (contentElm && this.isContentVisible(contentElm, scrollable, percentVisible)) {
            this.trackIndex(0);
            contentElm.classList.add('content-viewable-tracked');
            scrollable.removeEventListener('scroll', listener);
          }
        }, durationVisibleToBeTrackedMs);
      };
      scrollable.addEventListener('scroll', listener);
      this.scrollableListeners.push(listener);
      Vue.nextTick(listener);
      return;
    }

    contents.forEach((content, i): void => {
      let timeout: number;
      const listener = (): void => {
        window.clearTimeout(timeout);
        timeout = window.setTimeout((): void => {
          const contentElm = this.$el.querySelector(`.cms-zone-content-${this.zoneId}-${i}`);
          if (contentElm && this.isContentVisible(contentElm, scrollable, percentVisible)) {
            this.trackIndex(i);
            contentElm.classList.add('content-viewable-tracked');
            scrollable.removeEventListener('scroll', listener);
          }
        }, durationVisibleToBeTrackedMs);
      };
      scrollable.addEventListener('scroll', listener);
      this.scrollableListeners.push(listener);
      Vue.nextTick(listener);
    });
  }

  private async getNextPage() {
    if (!pluginOptions.checkConnection()) {
      return;
    }

    if (this.cursorLoading) {
      return;
    }

    this.cursorLoading = true;

    let response;
    try {
      response = await cmsClient.fetchZone({ zoneId: this.zoneId, extra: this.extra, cursor: this.cursor });
      if (!response.data || !response.data.content) {
        throw new Error('No data');
      }
      this.cursor = response.data.cursor;
      const newContents = response.data.content as Content[];
      this.contents.push(...newContents);
      if (this.scrollable) {
        this.trackScrollable(newContents, this.scrollable);
      }
    } finally {
      this.cursorLoading = false;
    }
  }

  private isContentVisible(el: Element, viewport: Element, minPercentVisible: number): boolean {
    const elRect = el.getBoundingClientRect();
    const elTop = elRect.top;
    const elBottom = elRect.bottom;
    const elHeight = elRect.height;

    const vRect = viewport.getBoundingClientRect();
    const vBottom = vRect.bottom;

    const offset = 0;
    const vTop = vRect.top + offset;

    let invisibleHeight = 0;
    if (elTop > vTop) {
      invisibleHeight = elBottom - vBottom;
    } else if (elTop < vTop) {
      invisibleHeight = vTop - elTop;
    }
    const visibleHeight = elHeight - invisibleHeight;
    return visibleHeight / elHeight * 100 >= minPercentVisible;
  }
}
</script>
