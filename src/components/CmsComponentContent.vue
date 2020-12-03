<template>
  <component
    :is="componentName"
    :zone-id="zoneId"
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>

<script lang="ts">
import httpVueLoader from 'http-vue-loader';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

@Component
export default class CmsComponentContent extends Vue {
  @Prop({ type: String }) url?: string;
  @Prop({ required: true, type: Number }) deliveryId!: number;
  @Prop({ required: true, type: String }) zoneId!: string;

  componentName: string | null = null;

  mounted() {
    this.loadVueComponent();
  }

  @Watch('url')
  onUrlChanged(): void {
    this.loadVueComponent();
  }

  loadVueComponent() {
    if (this.url) {
      const componentName = `cms-content-${this.zoneId}-${this.deliveryId}`;
      Vue.component(componentName, httpVueLoader.load(this.url, componentName));
      this.componentName = componentName;
    }
  }
}
</script>
