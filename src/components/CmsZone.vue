<template>
  <div
    :id="this.id"
    v-infinite-scroll="{ action: next, enabled: isScrolling }"
    :class="{ 'scrollable-content': isScrolling, 'cms-zone--inspect': isInspectOverlayEnabled }"
  >
    <button
      v-if="isInspectOverlayEnabled"
      class="cms-zone__zone-label"
      @click.stop.prevent="shouldShowInspectModal = true"
    >
      {{ zoneId }}
    </button>

    <cms-inspect-sheet
      v-if="shouldShowInspectModal"
      v-model="shouldShowInspectModal"
      :zone-id="zoneId"
      :render-context="renderContext"
      :contents="contents"
      :zone-status="zoneStatus"
      :zone-type="zoneType"
    />

    <slot v-if="!zoneType && !contents.length" />
    <slot v-if="zoneStatus === 'error'" name="error" />
    <slot v-if="zoneStatus === 'offline'" name="offline" />
    <slot v-if="zoneStatus === 'loading'" name="loading" />
    <slot v-if="!zoneStatus && !contents.length" name="empty" />
    <div v-if="contents.length">
      <cms-content
        v-if="zoneHeader"
        :html="zoneHeader"
        :context="renderContext"
        :zone-id="zoneId"
      />
      <cms-carousel
        v-if="zoneType === 'carousel'"
        :key="`${nonce}-${zoneId}`"
        :center-padding="contents.length > 1 ? '20px' : '0'"
        :zone-id="zoneId"
      >
        <cms-content
          v-for="(content, index) in contents"
          :id="`cms-zone-content-${zoneId}-${index}`"
          :key="`${nonce}-${content.delivery}`"
          :class="{
            [`cms-zone-content-${zoneId}-${index}`]: true,
            'cms-zone-content--tracked': content.tracked,
          }"
          class="cms-zone-content cms-zone-carousel-content"
          tag="div"
          :html="content.html"
          :context="renderContext"
          :zone-id="zoneId"
        />
      </cms-carousel>
      <div v-else class="zone-contents">
        <cms-content
          v-for="(content, index) in contents"
          :id="`cms-zone-content-${zoneId}-${index}`"
          :key="`${nonce}-${content.delivery}`"
          class="cms-zone-content"
          :class="{
            [`cms-zone-content-${zoneId}-${index}`]: true,
            'cms-zone-content--tracked': content.tracked,
          }"
          tag="div"
          :html="content.html"
          :context="renderContext"
          :zone-id="zoneId"
        />
      </div>
      <slot v-if="cursorLoading" name="cursor" />
      <cms-content
        v-if="zoneFooter"
        :html="zoneFooter"
        :context="renderContext"
        :zone-id="zoneId"
      />
    </div>
  </div>
</template>

<script lang="ts">
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

import { Content } from '../api';
import cmsClient from '../cmsHttp';
import { pluginOptions } from '../plugins/cms';

import CmsCarousel from './CmsCarousel.vue';
import CmsContent from './CmsContent';
import CmsInspectSheet from './CmsInspectSheet.vue';

const durationVisibleToBeTrackedMs = 1000;
const percentVisible = 0.5;

const zones: { [key: string]: () => Promise<void> } = {};

const trackers: { [key: string]: () => void } = {};

let fetchObserver: IntersectionObserver;
let trackObserver: IntersectionObserver;
let checkObserver: IntersectionObserver;
let observersCreated = false;

function createObservers() {
  if (observersCreated) {
    return;
  }

  observersCreated = true;
  fetchObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && zones[entry.target.id]) {
        observer.unobserve(entry.target);
        zones[entry.target.id]();
      }
    });
  }, { rootMargin: '25%' });

  trackObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio >= percentVisible && trackers[entry.target.id]) {
        setTimeout(() => checkObserver.observe(entry.target), durationVisibleToBeTrackedMs);
      }
    });
  }, { threshold: percentVisible });

  checkObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio >= percentVisible && trackers[entry.target.id]) {
        observer.unobserve(entry.target);
        trackers[entry.target.id]();
        trackObserver.unobserve(entry.target);
        delete trackers[entry.target.id];
      }
    });
  }, { threshold: percentVisible });
}

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
  components: { CmsCarousel, CmsContent, CmsInspectSheet },
})
export default class CmsZone extends Vue {
  @Prop(String) public zoneId!: string;
  @Prop(Object) public extra!: {};
  @Prop(Object) public context!: {};

  public zoneStatus: string | null = null;
  public zoneType: string = '';
  public zoneHeader: string = '';
  public zoneFooter: string = '';
  public contents: Content[] = [];
  public cursor: string = '';
  public scrollable: Element | null = null;

  public nonce: number = 0;
  public cursorLoading: boolean = false;
  public next = debounce(() => this.getNextPage(), 400);
  public observed: Element[] = [];

  shouldShowInspectModal = false;

  private get id() {
    return `cms-zone-${this.zoneId}`;
  }

  private get isScrolling() {
    return this.zoneType === 'scrolling';
  }

  private get renderContext() {
    return {
      ...this.extra,
      ...this.context,
    };
  }

  private created(): void {
    this.$root.$on('cms.refresh', this.refresh);
    this.$root.$on(`cms.refresh.${this.zoneId}`, this.refresh);
  }

  private mounted(): void {
    createObservers();
    this.refresh();
  }

  private beforeDestroy(): void {
    this.$root.$off('cms.refresh', this.refresh);
    this.$root.$off(`cms.refresh.${this.zoneId}`, this.refresh);
    this.$root.$off(`cms.track.${this.zoneId}`);
    this.disconnectObservers();
    delete zones[this.id];
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

  private disconnectObservers(): void {
    fetchObserver.unobserve(this.$el);
    for (const el of this.observed) {
      delete trackers[el.id];
      checkObserver.unobserve(el);
      trackObserver.unobserve(el);
    }
    this.observed = [];
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

    this.disconnectObservers();
    await Vue.nextTick();
    zones[this.id] = this.fetchZone.bind(this);
    fetchObserver.observe(this.$el);
  }

  private async fetchZone(): Promise<void> {
    // Increment nonce on every request to prevent vue from re-using cms-content components.
    this.nonce++;

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
    this.zoneHeader = data.zone_header
      ? `<div class="zone-header">${data.zone_header || ''}</div>`
      : '';
    this.zoneFooter = data.zone_footer
      ? `<div class="zone-footer">${data.zone_footer || ''}</div>`
      : '';
    this.zoneStatus = null;

    // Circumvent issue where carousel breaks by forcing it to re-render
    this.nonce++;
    await Vue.nextTick();
    this.disconnectObservers();
    this.setupTracking(this.contents);
  }

  private setupTracking(contents: Content[]): void {
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      const trackOn = (content.extra || {}).track_on;
      if (trackOn) {
        this.setupDeferredTracking(content, trackOn);
      } else {
        this.setupIntersectionTracking(content, i);
      }
    }
  }

  private setupDeferredTracking(content: Content, trackOn: string) {
    this.$root.$once(
      `cms.track.${this.zoneId}`,
      async (): Promise<void> => {
        Vue.set(content, 'tracked', true);
        await cmsClient.trackZone({ content, zoneId: this.zoneId });
        this.$root.$emit(`cms.refresh.${this.zoneId}`);
      }
    );

    this.$root.$once('router.change', (hash: string): void => {
      const regex = new RegExp(trackOn);
      if (regex.test(hash)) {
        this.$root.$emit(`cms.track.${this.zoneId}`);
      }
    });
  }

  private setupIntersectionTracking(content: Content, index: number) {
    const el = this.$el.querySelector(`.cms-zone-content-${this.zoneId}-${index}`)!;
    trackers[el.id] = () => {
      if (!content.tracked) {
        Vue.set(content, 'tracked', true);
        cmsClient.trackZone({ content, zoneId: this.zoneId });
      }
    };
    trackObserver.observe(el);
    this.observed.push(el);
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
      response = await cmsClient.fetchZone({
        zoneId: this.zoneId,
        extra: this.extra,
        cursor: this.cursor,
      });
      if (!response.data || !response.data.content) {
        throw new Error('No data');
      }
      this.cursor = response.data.cursor;
      const newContents = response.data.content as Content[];
      this.contents.push(...newContents);
      this.setupTracking(newContents);
    } finally {
      this.cursorLoading = false;
    }
  }

  get isInspectOverlayEnabled(): boolean {
    return this.$cms.isInspectOverlayEnabled;
  }
}
</script>

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

<style lang="less" scoped>
.zone-inspect-overlay(@color-light, @color-dark) {
  border: 1px solid @color-dark;

  .cms-zone__zone-label {
    background: fade(@color-light, 70%);
  }

  .cms-zone-content {
    border: 1px dashed @color-light;

    &.cms-zone-content--tracked {
      border-style: solid;
    }
  }
}

.cms-zone--inspect {
  .zone-inspect-overlay(#a3b0f9, #5560cb);

  & & {
    .zone-inspect-overlay(#b3f6a2, #51d156);
  }

  & & & {
    .zone-inspect-overlay(#fdcab7, #FC8247);
  }
}

.cms-zone__zone-label {
  padding: 4px 8px;
  white-space: nowrap;
  font-size: 12px;
  color: black;
  font-weight: bold;
  min-width: 40px;
  backdrop-filter: blur(1px);
}
</style>
