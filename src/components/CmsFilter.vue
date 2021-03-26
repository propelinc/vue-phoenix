<template>
  <!-- Filters -->
  <div
    v-if="filters.length > 0"
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
</template>

<script lang="ts">
import ChevronDownIcon from 'vue-material-design-icons/ChevronDown.vue';
import ChevronUpIcon from 'vue-material-design-icons/ChevronUp.vue';
import { Vue, Component, Prop } from 'vue-property-decorator';

import cmsClient from '../cmsHttp';

@Component({ name: 'cms-filter' })
export default class CmsFilter extends Vue {
  @Prop(String) public zoneId!: string;
  public showFilters: boolean = false;
  public filters: string[] = [];
  public selectedCategory: string | null = null;

  public selectCategory(category: string) {
    if (this.selectedCategory === category) {
      this.selectedCategory = null;
    } else {
      this.selectedCategory = category;
      this.$emit('filterEvent', this.selectedCategory);
    }
  }

  private mounted() {
    this.getFilters();
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
