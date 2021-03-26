<template>
  <div style="padding: 16px">
    <!-- Search Bar -->
    <div style="display: inline">
      <v-text-field
        v-if="withSearch"
        v-model="typedQuery"
        filled
        rounded
        placeholder="Search..."
        style="display: inline-block; width: 85%"
        @keydown.enter="searchQuery = typedQuery"
      />
      <div class="ml-1" style="display: inline-block; vertical-align: middle; padding-left: 12px">
        <close-icon
          v-if="searchQuery && searchQuery === typedQuery"
          fill-color="#027ac0"
          @click="updateSearchQuery()"
        />
        <magnify-icon v-else fill-color="#027ac0" @click="updateSearchQuery()" />
      </div>
    </div>

    <!-- Filters -->
    <div
      v-if="withCategoryFilters && filters.length > 0"
      class="row"
      style="font-weight: 600; margin-bottom: 10px; clear: both; text-align: center"
    >
      <v-btn
        text
        large
        block
        color="success"
        class="bold"
        style="padding: 16px; height: 50px"
        @click="toggleShowFilters()"
      >
        Filter
        <chevron-up-icon v-if="showFilters" color="#027ac0" class="ml-1" />
        <chevron-down-icon v-else color="#027ac0" class="ml-1" />
      </v-btn>

      <div v-if="showFilters" class="full-width container pb-1">
        <div style="border-bottom: 2px solid #cccccc" />
        <div
          v-for="category in filters"
          style="display: inline; overflow: hidden; overflow-x: scroll; width: 100%"
        >
          <div
            :style="
              category === selectedCategory
                ? 'color: #fff; font-weight: bold; background-color: #004976;'
                : 'background-color: #EFEFEF;'
            "
            style="
              display: inline-block;
              float: left;
              background-color: #efefef;
              border-radius: 28px;
              margin: 6px 12px 6px 0px;
            "
            @click="selectCategory(category)"
          >
            <div style="padding: 4px 4px; margin-right: 12px; margin-left: 12px; line-height: 2.2">
              {{ category }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <cms-zone
      :zone-id="zoneId"
      :extra="{ q: searchQuery, category: selectedCategory, ...extra }"
      :context="context"
    />
  </div>
</template>

<script lang="ts">
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import ChevronUpIcon from 'vue-material-design-icons/ChevronUp.vue';
import CloseIcon from 'vue-material-design-icons/Close.vue';
import MagnifyIcon from 'vue-material-design-icons/Magnify.vue';
import { Vue, Component, Prop } from 'vue-property-decorator';

import cmsClient from '../cmsHttp';

import CmsZone from './CmsZone.vue';

@Component({
  name: 'search-filter-cms-zone',
  components: { CmsZone, ChevronUpIcon, ChevronDownIcon, CloseIcon, MagnifyIcon },
})
export default class SearchFilterCmsZone extends Vue {
  @Prop(String) public zoneId!: string;
  @Prop({ type: Boolean, default: false }) public withSearch;
  @Prop({ type: Boolean, default: false }) public withCategoryFilters;
  @Prop(Object) public extra!: {};
  @Prop(Object) public context!: {};

  public searchQuery: string = '';
  public typedQuery: string = '';
  public showFilters: boolean = false;
  public filters: string[] = [];
  public selectedCategory: string | null = null;

  public updateSearchQuery() {
    if (this.searchQuery === this.typedQuery) {
      this.searchQuery = '';
      this.typedQuery = '';
    } else {
      this.searchQuery = this.typedQuery;
    }
  }

  public selectCategory(category: string) {
    if (this.selectedCategory === category) {
      this.selectedCategory = null;
    } else {
      this.selectedCategory = category;
    }
  }

  private mounted() {
    if (this.withCategoryFilters) {
      this.getFilters();
    }
  }

  private async getFilters() {
    let response;
    try {
      response = await cmsClient.fetchFilterCategories(this.zoneId);
      this.filters = response.data;
    } catch (error) {}
  }

  private toggleShowFilters() {
    this.showFilters = !this.showFilters;
  }
}
</script>
