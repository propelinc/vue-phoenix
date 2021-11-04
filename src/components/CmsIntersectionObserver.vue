<template>
  <div class="observer" />
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component({ name: 'cms-intersection-observer' })
export default class CmsIntersectionObserver extends Vue {
  @Prop({ type: Object, default: () => {} }) options!: object;

  observer: IntersectionObserver | null = null;

  mounted() {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        this.$emit(entry.isIntersecting ? 'enter' : 'leave');
      }
    }, this.options);
    this.observer.observe(this.$el);
  }

  destroyed() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
</script>

<style lang="less" scoped>
.observer {
  height: 1px;
  width: 1px;
}
</style>
