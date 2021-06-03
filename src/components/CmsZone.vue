<template>
  <div>
    <div
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
      <div v-if="contents.length || displaySearch()">
        <cms-content
          v-if="zoneHeader"
          :html="zoneHeader"
          :context="renderContext"
          :zone-id="zoneId"
        />
        <!-- Search Bar -->
        <cms-search v-if="displaySearch()" @updateSearchQuery="updateSearchQuery($event)">
          <template #close-icon>
            <slot name="close-icon" />
          </template>
          <template #magnify-icon>
            <slot name="magnify-icon" />
          </template>
        </cms-search>

        <!-- Filters -->
        <cms-filters
          v-if="withCategoryFilters"
          :zone-id="zoneId"
          @updateSelectedCategory="updateSelectedCategory($event)"
        />
        <cms-carousel
          v-if="zoneType === 'carousel'"
          :key="`${nonce}-${zoneId}`"
          :center-padding="contents.length > 1 ? '20px' : '0'"
          :zone-id="zoneId"
          @change="trackIndex"
        >
          <cms-content
            v-for="(content, index) in contents"
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
import CmsFilters from './CmsFilters.vue';
import CmsInspectSheet from './CmsInspectSheet.vue';
import CmsSearch from './CmsSearch.vue';

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
  components: {
    CmsCarousel,
    CmsContent,
    CmsInspectSheet,
    CmsSearch,
    CmsFilters,
  },
})
export default class CmsZone extends Vue {
  @Prop(String) public zoneId!: string;
  @Prop(Object) public extra!: {};
  @Prop(Object) public context!: {};
  @Prop(Boolean) public withSearch!: false;
  @Prop(Boolean) public withCategoryFilters!: false;

  public zoneStatus: string | null = null;
  public zoneType: string = '';
  public zoneHeader: string = '';
  public zoneFooter: string = '';
  public contents: Content[] = [];
  public cursor: string = '';
  public scrollable: Element | null = null;
  public scrollableListeners: EventListener[] = [];

  public nonce: number = 0;
  public cursorLoading: boolean = false;
  public next = debounce(() => this.getNextPage(), 400);

  shouldShowInspectModal = false;

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
    this.refresh();
  }

  private beforeDestroy(): void {
    this.$root.$off('cms.refresh', this.refresh);
    this.$root.$off(`cms.refresh.${this.zoneId}`, this.refresh);
    this.$root.$off(`cms.track.${this.zoneId}`);
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
    if (data.zone_header) {
      this.zoneHeader = `<div class="zone-header">${data.zone_header || ''}</div>`;
    } else if (!data.zone_header && !this.displaySearch()) {
      this.zoneHeader = '';
    }
    this.zoneFooter = data.zone_footer
      ? `<div class="zone-footer">${data.zone_footer || ''}</div>`
      : '';
    this.zoneStatus = null;
    // Circumvent issue where carousel breaks by forcing it to re-render
    this.nonce++;

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
    Vue.set(this.contents, index, { ...content, tracked: true });

    const trackOn = (content.extra || {}).track_on;
    if (trackOn) {
      this.$root.$once(
        `cms.track.${this.zoneId}`,
        async (): Promise<void> => {
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
      return;
    }

    cmsClient.trackZone({ content, zoneId: this.zoneId });
  }

  private trackScrollable(contents: Content[], scrollable: Element): void {
    if (this.zoneType === 'carousel') {
      let timeout: number;
      const listener = (): void => {
        window.clearTimeout(timeout);
        timeout = window.setTimeout((): void => {
          const contentElm = this.$el.querySelector('.slick-current');
          if (contentElm && this.isContentVisible(contentElm, scrollable, percentVisible)) {
            this.trackIndex(0);
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
    return (visibleHeight / elHeight) * 100 >= minPercentVisible;
  }

  get isInspectOverlayEnabled(): boolean {
    return this.$cms.isInspectOverlayEnabled;
  }

  private updateSearchQuery(query: string): void {
    // Doing this rather than a straight property set so that the @Watch on extra fires
    this.extra = { ...this.extra, q: query };
    if (query) {
      pluginOptions.trackAnalytics('search cms conent', { 'search query': query });
    }
  }

  private updateSelectedCategory(filterCategory: string): void {
    if (filterCategory !== 'All') {
      this.extra = { ...this.extra, category: filterCategory };
      pluginOptions.trackAnalytics('filter cms conent', { 'filter category': filterCategory });
    } else {
      // Destructuring assignment
      const { category, ...extrasWithoutCategory } = this.extra;
      this.extra = { ...extrasWithoutCategory };
    }
  }

  private displaySearch(): boolean {
    return this.withSearch && (this.contents.length || this.extra.q !== undefined);
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
