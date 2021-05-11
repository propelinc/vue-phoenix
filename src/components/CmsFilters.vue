<template>
  <!-- Filters -->
  <div v-if="filters.length > 0" class="filters-section row">
    <div class="full-width container pb-1">
      <div class="categories-container">
        <div v-for="category in filters" :key="category" class="categories">
          <div
            :style="setCategoryStyle(category)"
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
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import cmsClient from '../cmsHttp';

@Component({
  name: 'cms-filters',
})
export default class CmsFilters extends Vue {
  @Prop(String) public zoneId!: string;

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

  private created() {
    this.loadFilters();
  }

  private async loadFilters(): Promise<void> {
    let response;
    try {
      response = await cmsClient.fetchFilterCategories(this.zoneId);
      this.filters = ['All', ...this.shuffleArray<string>(response.data)];
    } catch (error) {}
  }

  private setCategoryStyle(category: string): string {
    if (
      category === this.selectedCategory ||
      (this.selectedCategory === null && category === 'All')
    ) {
      return 'color: #fff; font-weight: bold; background-color: #004976;';
    }
    return 'background-color: #EFEFEF;';
  }

  private shuffleArray<T>(array: Array<T>): Array<T> {
    // Randomization via Fisher-Yates Shuffle
    const newArray = [...array];
    let m = newArray.length;

    // While there remain elements to shuffle…
    while (m) {
      // Pick a remaining element…
      const i = Math.floor(Math.random() * m--);

      // And swap it with the current element.
      const t = newArray[m];
      newArray[m] = newArray[i];
      newArray[i] = t;
    }
    return newArray;
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
.categories-container {
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
}
.categories {
  display: inline;
  overflow: hidden;
  overflow-x: scroll;
  width: 100%;
}

.category-pill {
  background-color: #efefef;
  border-radius: 28px;
  margin: 6px 12px 6px 0px;
  display: inline-block;
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
