<template>
  <div class="search-filter-content">
    <!-- Search Bar -->
    <cms-search v-if="withSearch" @updateSearchQuery="updateSearchQuery($event)" />

    <!-- Filters -->
    <cms-filters
      v-if="withCategoryFilters"
      :zone-id="zoneId"
      @updateSelectedCategory="updateSelectedCategory($event)"
    />

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
import { Vue, Component, Prop } from 'vue-property-decorator';

import CmsFilters from './CmsFilters.vue';
import CmsSearch from './CmsSearch.vue';
import CmsZone from './CmsZone.vue';

@Component({
  name: 'search-filter-cms-zone',
  components: { CmsZone, CmsFilters, CmsSearch, ChevronUpIcon, ChevronDownIcon },
})
export default class SearchFilterCmsZone extends Vue {
  @Prop(String) public zoneId!: string;
  @Prop(Boolean) public withSearch!: false;
  @Prop(Boolean) public withCategoryFilters!: false;
  @Prop(Object) public extra!: {};
  @Prop(Object) public context!: {};

  public searchQuery: string = '';
  public selectedCategory: string | null = null;

  public updateSearchQuery(newSearchQuery: string) {
    this.searchQuery = newSearchQuery;
  }

  public updateSelectedCategory(newCategory: string | null) {
    this.selectedCategory = newCategory;
  }
}
</script>

<style>
.search-filter-content {
  padding: 16px;
}

.border {
  border-bottom: 2px solid #cccccc;
}
</style>
