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
    const options = this.options || {};
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) {
        this.$emit('intersect', this.observer);
      }
    }, options);

    this.observer.observe(this.$el);
  }

  destroyed() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
</script>
