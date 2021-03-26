<template>
  <div class="search-filter-content">
    <!-- Search Bar -->
    <div class="search-bar">
      <v-text-field
        v-if="withSearch"
        v-model="typedQuery"
        filled
        rounded
        placeholder="Search..."
        class="search-text"
        @keydown.enter="searchQuery = typedQuery"
      />
      <div class="search-icon ml-1">
        <close-icon
          v-if="searchQuery && searchQuery === typedQuery"
          fill-color="#027ac0"
          @click="updateSearchQuery()"
        />
        <magnify-icon v-else fill-color="#027ac0" @click="updateSearchQuery()" />
      </div>
    </div>

    <!-- Filters -->
    <div v-if="withCategoryFilters && filters.length > 0" class="filters-section row">
      <v-btn
        text
        large
        block
        color="success"
        class="bold filter-dropdown"
        @click="toggleShowFilters()"
      >
        Filter
        <chevron-up-icon v-if="showFilters" color="#027ac0" class="ml-1" />
        <chevron-down-icon v-else color="#027ac0" class="ml-1" />
      </v-btn>

      <div v-if="showFilters" class="full-width container pb-1">
        <div class="border" />
        <div v-for="category in filters" :key="category" class="categories">
          <div
            :style="
              category === selectedCategory
                ? 'color: #fff; font-weight: bold; background-color: #004976;'
                : 'background-color: #EFEFEF;'
            "
            class="category-pill"
            @click="selectCategory(category)"
          >
            <div class="category-pill-text">
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
    >
      <div class="cms-loading">Loading...</div>
      <div class="zone-empty" />
    </cms-zone>
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
  @Prop(Boolean) public withSearch!: false;
  @Prop(Boolean) public withCategoryFilters!: false;
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

<style>
.search-bar {
  display: block;
  position: relative;
  height: 50px;
  margin: 10px;
}

.search-text {
  width: 100%;
  height: 100%;
  margin: 0;
}

.search-icon {
  position: absolute;
  height: 100%;
  margin: 15px;
  top: 0;
  right: 0;
}

.search-filter-content {
  padding: 16px;
}

.filters-section {
  font-weight: 600;
  margin-bottom: 10px;
  clear: both;
  text-align: center;
}

.filter-dropdown {
  padding: 16px;
  height: 50px;
}

.categories {
  display: inline;
  overflow: hidden;
  overflow-x: scroll;
  width: 100%;
}

.category-pill {
  float: left;
  background-color: #efefef;
  border-radius: 28px;
  margin: 6px 12px 6px 0px;
}

.category-pill-text {
  padding: 4px 4px;
  margin-right: 12px;
  margin-left: 12px;
  line-height: 2.2;
}

.border {
  border-bottom: 2px solid #cccccc;
}
</style>
