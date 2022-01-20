<template>
  <div :id="id" :class="cssClasses">
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
    <div v-if="displayContent">
      <cms-content
        v-if="zoneHeader"
        :html="zoneHeader"
        :context="renderContext"
        :zone-id="zoneId"
      />
      <slot name="search-header" />
      <cms-carousel
        v-if="zoneType === 'carousel'"
        :key="`${nonce}-${zoneId}`"
        :center-padding="contents.length > 1 ? '20px' : '0'"
        :zone-id="zoneId"
      >
        <cms-content
          v-for="(content, index) in contents"
          :id="contentId(index)"
          ref="contents"
          :key="`${nonce}-${content.delivery}`"
          :class="{
            [contentId(index)]: true,
            'cms-zone-content--tracked': content.tracked,
          }"
          class="cms-zone-content cms-zone-carousel-content"
          tag="div"
          :html="content.html"
          :css="content.css"
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
          :css="content.css"
          :context="renderContext"
          :zone-id="zoneId"
        />
      </div>
      <cms-intersection-observer
        v-if="isScrolling"
        :options="{ rootMargin: pluginOptions.lazyLoadRootMargin }"
        @enter="startPaging"
        @leave="stopPaging"
      />
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
import isEqual from 'lodash/isEqual';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

import { CMSZoneResponse, Content } from '../api';
import cmsClient from '../cmsHttp';
import { pluginOptions } from '../plugins/cms';

import CmsCarousel from './CmsCarousel.vue';
import CmsContent from './CmsContent';
import CmsInspectSheet from './CmsInspectSheet.vue';
import CmsIntersectionObserver from './CmsIntersectionObserver.vue';

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
            window.setTimeout(
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
  components: { CmsCarousel, CmsContent, CmsInspectSheet, CmsIntersectionObserver },
})
export default class CmsZone extends Vue {
  @Prop(String) zoneId!: string;
  @Prop(Object) extra!: {};
  @Prop(Object) context!: {};

  pluginOptions = pluginOptions;
  zoneStatus: string | null = null;
  lastResponse: CMSZoneResponse | null = null;
  contents: Content[] = [];
  observed: Element[] = [];
  shouldShowInspectModal = false;
  refreshing = false;

  nonce: number = 0;
  cursorLoading: boolean = false;
  haltPaging: boolean = false;

  async startPaging() {
    if (!this.cursorLoading) {
      this.fetchPages();
    }
  }

  async fetchPages() {
    this.cursorLoading = true;

    try {
      while (!this.haltPaging && !this.allContentLoaded) {
        await this.getNextPage();
      }
    } finally {
      this.cursorLoading = false;
      this.haltPaging = false;
    }
  }

  stopPaging() {
    if (this.cursorLoading) {
      this.haltPaging = true;
    }
  }

  get id() {
    return `cms-zone-${this.zoneId}`;
  }

  get cssClasses() {
    return {
      'cms-zone--inspect': this.isInspectOverlayEnabled,
      'cms-zone-offline': this.zoneStatus === 'offline',
      'cms-zone-error': this.zoneStatus === 'error',
      'cms-zone-loading': this.zoneStatus === 'loading',
    };
  }

  get contentId() {
    return (index: number) => `cms-zone-content-${this.zoneId}-${index}`;
  }

  get allContentLoaded(): boolean {
    return this.lastResponse?.content?.length === 0;
  }

  get zoneType(): string {
    if (!this.lastResponse || this.zoneStatus === 'error') {
      return '';
    }
    return this.lastResponse.zone_type;
  }

  get zoneHeader(): string {
    return this.lastResponse?.zone_header
      ? `<div class="zone-header">${this.lastResponse.zone_header}</div>`
      : '';
  }

  get zoneFooter(): string {
    return this.lastResponse?.zone_footer
      ? `<div class="zone-footer">${this.lastResponse.zone_footer}</div>`
      : '';
  }

  get cursor(): string {
    return this.lastResponse?.cursor || '';
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
    this.haltPaging = false;
    this.cursorLoading = false;
    this.lastResponse = null;
    this.refreshing = true;

    if (!pluginOptions.checkConnection()) {
      this.zoneStatus = 'offline';
      this.contents = [];
      return;
    }

    this.zoneStatus = 'loading';
    this.zoneObserverManager.disconnect(this);
    await Vue.nextTick();
    this.zoneObserverManager.setupFetching(this);
  }

  async fetchZone(): Promise<void> {
    // Increment nonce on every request to prevent vue from re-using cms-content components.
    this.nonce++;

    try {
      await this.getNextPage();
      this.zoneStatus = null;
    } catch (error) {
      this.zoneStatus = 'error';
      this.contents = [];
      return;
    } finally {
      // Circumvent issue where carousel breaks by forcing it to re-render
      this.nonce++;
      this.zoneObserverManager.disconnect(this);
    }
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

  async getNextPage(): Promise<void> {
    if (!pluginOptions.checkConnection()) {
      return;
    }

    if (this.allContentLoaded) {
      return;
    }

    const zoneId = this.zoneId;
    const response = await cmsClient.fetchZone({
      zoneId: zoneId,
      extra: this.extra,
      cursor: this.cursor,
    });

    if (!response.data || !response.data.content) {
      throw new Error('No data');
    }

    if (zoneId !== this.zoneId) {
      return;
    }

    this.lastResponse = response.data;
    if (this.refreshing) {
      this.contents = this.lastResponse.content;
      this.refreshing = false;
    }
    else {
      this.contents.push(...this.lastResponse.content);
    }
    await Vue.nextTick();
    this.setupTracking(this.lastResponse.content);
  }

  get isInspectOverlayEnabled(): boolean {
    return this.$cms.isInspectOverlayEnabled;
  }

  get displayContent(): boolean {
    return !!(this.contents.length || this.forceMargins);
  }

  get forceMargins(): boolean {
    // eslint-disable-next-line dot-notation
    return this.extra && this.extra['force_margins'];
  }
}
</script>

<style lang="scss" scoped>
@mixin zone-inspect-overlay($color-light, $color-dark) {
  border: 1px solid $color-dark;

  .cms-zone__zone-label {
    background: fade($color-light, 70%);
  }

  .cms-zone-content {
    border: 1px dashed $color-light;

    &.cms-zone-content--tracked {
      border-style: solid;
    }
  }
}

.cms-zone--inspect {
  @include zone-inspect-overlay(#a3b0f9, #5560cb);

  & & {
    @include zone-inspect-overlay(#b3f6a2, #51d156);
  }

  & & & {
    @include zone-inspect-overlay(#fdcab7, #fc8247);
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
