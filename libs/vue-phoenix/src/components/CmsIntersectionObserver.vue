<template>
  <div class="observer" />
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component({ name: 'cms-intersection-observer' })
export default class CmsIntersectionObserver extends Vue {
  @Prop({ type: Object, default: () => ({}) }) options!: { root?: null | Element };

  observer: IntersectionObserver | null = null;

  getScrollParent(): Element | null {
    const position = getComputedStyle(this.$el).position;
    if (position === 'fixed') {
      return null;
    }

    let parent: Element | null = this.$el;
    while ((parent = parent.parentElement)) {
      const parentStyle = getComputedStyle(parent);
      if (position === 'absolute' && parentStyle.position === 'static') {
        continue;
      }
      const parentOverflow = parentStyle.overflow + parentStyle.overflowY + parentStyle.overflowX;
      if (/(auto|scroll)/.test(parentOverflow)) {
        return parent;
      }
    }

    return null;
  }

  mounted() {
    if (this.options.root === undefined) {
      this.options.root = this.getScrollParent();
    }

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
