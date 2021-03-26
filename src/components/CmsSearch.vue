<template>
  <div style="display: inline">
    <v-text-field
      v-if="withSearch"
      v-model="typedQuery"
      filled
      rounded
      placeholder="Search..."
      style="display: inline-block; width: 85%"
      @keydown.enter="updateSearchQuery()"
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
</template>

<script lang="ts">
import CloseIcon from 'vue-material-design-icons/Close.vue';
import MagnifyIcon from 'vue-material-design-icons/Magnify.vue';
import { Vue, Component } from 'vue-property-decorator';

@Component({ name: 'cms-search' })
export default class CmsSearch extends Vue {
  public searchQuery: string = '';
  public typedQuery: string = '';

  public updateSearchQuery(): void {
    if (this.searchQuery === this.typedQuery) {
      this.searchQuery = '';
      this.typedQuery = '';
    } else {
      this.searchQuery = this.typedQuery;
      this.$emit('searchEvent', this.searchQuery);
    }
  }
}
</script>
