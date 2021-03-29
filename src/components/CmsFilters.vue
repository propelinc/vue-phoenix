<template>
  <!-- Filters -->
  <div v-if="filters.length > 0" class="filters-section row">
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
</template>

<script lang="ts">
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import ChevronUpIcon from 'vue-material-design-icons/ChevronUp.vue';
import { Vue, Component, Prop } from 'vue-property-decorator';

import cmsClient from '../cmsHttp';

@Component({
  name: 'cms-filters',
  components: { ChevronUpIcon, ChevronDownIcon },
})
export default class CmsFilters extends Vue {
  @Prop(String) public zoneId!: string;
  // @Prop(Array) public filters: string[] = [];

  public filters: string[] = [];
  public showFilters: boolean = false;
  public selectedCategory: string | null = null;

  public selectCategory(category: string) {
    if (this.selectedCategory === category) {
      this.selectedCategory = null;
    } else {
      this.selectedCategory = category;
    }
    this.$emit('updateSelectedCategory', this.selectedCategory);
  }

  public toggleShowFilters() {
    this.showFilters = !this.showFilters;
  }

  private created() {
    this.loadFilters();
  }

  private async loadFilters() {
    let response;
    try {
      response = await cmsClient.fetchFilterCategories(this.zoneId);
      this.filters = response.data;
    } catch (error) {}
  }
}
</script>

<style>
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
