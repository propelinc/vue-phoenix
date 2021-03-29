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
</template>

<script lang="ts">
import CloseIcon from 'vue-material-design-icons/Close.vue';
import MagnifyIcon from 'vue-material-design-icons/Magnify.vue';
import { Vue, Component } from 'vue-property-decorator';

@Component({
  name: 'cms-search',
  components: { CloseIcon, MagnifyIcon },
})
export default class CmsSearch extends Vue {
  public searchQuery: string = '';
  public typedQuery: string = '';

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
}

.search-icon {
  position: absolute;
  height: 100%;
  margin: 15px;
  top: 0;
  right: 0;
}
</style>
