<template>
  <div
    :id="id"
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
        :id="contentId(index)"
        :key="`${nonce}-${zoneId}`"
        :center-padding="contents.length > 1 ? '20px' : '0'"
        :zone-id="zoneId"
      >
        <cms-content
          v-for="(content, index) in contents"
          ref="contents"
          :key="`${nonce}-${content.delivery}`"
          :class="{
            [contentId(index)]: true,
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
          :id="contentId(index)"
          :key="`${nonce}-${content.delivery}`"
          ref="contents"
          class="cms-zone-content"
          :class="{
            [contentId(index)]: true,
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

class ZoneObserverManager {
  static instance: ZoneObserverManager;

  private durationVisibleToBeTrackedMs = 1000;
  private minVisibleRatio = 0.5;

  private pendingZones: { [key: string]: CmsZone } = {};
  private pendingTrackers: { [key: string]: { zone: CmsZone; content: Content } } = {};

  // Fetch zones when they are within the `lazyLoadRootMargin`.
  private fetchObserver: IntersectionObserver;
  // Initiates impression tracking when a content's visibility ratio exceeds `minVisibleRatio`.
  private trackObserver: IntersectionObserver;
  // Tracks an impression `durationVisibleToBeTrackedMs` after initiation.
  private checkObserver: IntersectionObserver;

  private constructor() {
    this.fetchObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((e) => {
          if (e.isIntersecting && this.pendingZones[e.target.id]) {
            observer.unobserve(e.target);
            this.pendingZones[e.target.id].fetchZone();
            delete this.pendingZones[e.target.id];
          }
        });
      },
      { rootMargin: pluginOptions.lazyLoadRootMargin }
    );

    this.trackObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.intersectionRatio >= this.minVisibleRatio && this.pendingTrackers[e.target.id]) {
            setTimeout(
              () => this.checkObserver.observe(e.target),
              this.durationVisibleToBeTrackedMs
            );
          }
        });
      },
      { threshold: this.minVisibleRatio }
    );

    this.checkObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((e) => {
          if (e.intersectionRatio >= this.minVisibleRatio && this.pendingTrackers[e.target.id]) {
            observer.unobserve(e.target);
            const { zone, content } = this.pendingTrackers[e.target.id];
            zone.trackContent(content);
            this.trackObserver.unobserve(e.target);
            delete this.pendingTrackers[e.target.id];
          }
        });
      },
      { threshold: this.minVisibleRatio }
    );
  }

  static getInstance(): ZoneObserverManager {
    if (!ZoneObserverManager.instance) {
      ZoneObserverManager.instance = new ZoneObserverManager();
    }

    return ZoneObserverManager.instance;
  }

  setupFetching(zone: CmsZone) {
    this.pendingZones[zone.id] = zone;
    this.fetchObserver.observe(zone.$el);
  }

  setupTracking(zone: CmsZone, content: Content, el: Element) {
    this.pendingTrackers[el.id] = { zone, content };
    this.trackObserver.observe(el);
    zone.observed.push(el);
  }

  disconnect(zone: CmsZone) {
    delete this.pendingZones[zone.id];
    this.fetchObserver.unobserve(zone.$el);

    for (const el of zone.observed) {
      delete this.pendingTrackers[el.id];
      this.checkObserver.unobserve(el);
      this.trackObserver.unobserve(el);
    }
    zone.observed = [];
  }
}

@Component({
  name: 'cms-zone',
  components: { CmsCarousel, CmsContent, CmsInspectSheet },
})
export default class CmsZone extends Vue {
  @Prop(String) zoneId!: string;
  @Prop(Object) extra!: {};
  @Prop(Object) context!: {};

  zoneStatus: string | null = null;
  zoneType: string = '';
  zoneHeader: string = '';
  zoneFooter: string = '';
  contents: Content[] = [];
  cursor: string = '';
  scrollable: Element | null = null;

  nonce: number = 0;
  cursorLoading: boolean = false;
  next = debounce(() => this.getNextPage(), 400);
  observed: Element[] = [];

  shouldShowInspectModal = false;

  get id() {
    return `cms-zone-${this.zoneId}`;
  }

  get contentId() {
    return (index: number) => `cms-zone-content-${this.zoneId}-${index}`;
  }

  get isScrolling() {
    return this.zoneType === 'scrolling';
  }

  get renderContext() {
    return {
      ...this.extra,
      ...this.context,
    };
  }

  get zoneObserverManager() {
    return ZoneObserverManager.getInstance();
  }

  created(): void {
    this.$root.$on('cms.refresh', this.refresh);
    this.$root.$on(`cms.refresh.${this.zoneId}`, this.refresh);
  }

  mounted(): void {
    this.refresh();
  }

  beforeDestroy(): void {
    this.$root.$off('cms.refresh', this.refresh);
    this.$root.$off(`cms.refresh.${this.zoneId}`, this.refresh);
    this.$root.$off(`cms.track.${this.zoneId}`);
    this.zoneObserverManager.disconnect(this);
  }

  @Watch('zoneId')
  onZoneIdChanged(): void {
    this.refresh();
  }

  @Watch('extra', { deep: true, immediate: true })
  async onExtraChanged(value?: object, oldValue?: object): Promise<void> {
    // Prevent deep watcher for extra from firing too often.
    // See: https://github.com/vuejs/vue/issues/5776
    if (oldValue !== undefined && !isEqual(value, oldValue)) {
      await Vue.nextTick();
      this.refresh();
    }
  }

  async refresh(): Promise<void> {
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

    this.zoneObserverManager.disconnect(this);
    await Vue.nextTick();
    this.zoneObserverManager.setupFetching(this);
  }

  async fetchZone(): Promise<void> {
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

    this.zoneObserverManager.disconnect(this);
    this.setupTracking(this.contents);
  }

  setupTracking(contents: Content[]): void {
    contents.forEach((content, i) => {
      const trackOn = (content.extra || {}).track_on;
      if (trackOn) {
        this.setupDeferredTracking(content, trackOn);
      } else {
        const el = (this.$refs.contents[i] as Vue).$el as Element;
        this.zoneObserverManager.setupTracking(this, content, el);
      }
    });
  }

  setupDeferredTracking(content: Content, trackOn: string) {
    this.$root.$once(
      `cms.track.${this.zoneId}`,
      async (): Promise<void> => {
        await this.trackContent(content);
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

  async trackContent(content: Content) {
    if (!content.tracked) {
      Vue.set(content, 'tracked', true);
      await cmsClient.trackZone({ content, zoneId: this.zoneId });
    }
  }

  async getNextPage() {
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
