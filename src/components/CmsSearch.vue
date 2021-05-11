<template>
  <!-- Search Bar -->
  <div class="search-bar">
    <v-text-field
      v-model="typedQuery"
      filled
      rounded
      placeholder="Search..."
      class="search-text"
      @keydown.enter="updateSearchQuery()"
    >
      <template #prepend-inner>
        <slot name="magnify-icon" />
      </template>
      <template #append>
        <div class="close-icon" @click="updateSearchQuery()">
          <slot v-if="displayCloseIcon()" name="close-icon" />
        </div>
      </template>
    </v-text-field>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';

@Component({
  name: 'cms-search',
})
export default class CmsSearch extends Vue {
  public searchQuery: string = '';
  public typedQuery: string = '';

  public displayCloseIcon(): boolean {
    return !!this.searchQuery && this.searchQuery === this.typedQuery;
  }

  public updateSearchQuery() {
    if (this.searchQuery === this.typedQuery) {
      this.searchQuery = '';
      this.typedQuery = '';
    } else {
      this.searchQuery = this.typedQuery;
    }

    this.$emit('updateSearchQuery', this.searchQuery);
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
  position: relative;
  padding-inline-end: 44px;
  padding-inline-start: 52px;
}

.search-icon {
  position: absolute;
  height: 100%;
  margin: 15px;
  top: 0;
  left: 25px;
}

.close-icon {
  position: absolute;
  height: 100%;
  margin: 15px;
  top: 0;
  right: 25px;
}
</style>
