<template>
  <slick ref="slick" :options="slickOptions" @afterChange="onIndexChanged">
    <slot />
  </slick>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Slick from 'vue-slick';

import { pluginOptions } from '../plugins/cms';

type Slick = typeof Slick;

@Component({
  components: {
    Slick,
  },
})
export default class CmsCarousel extends Vue {
  @Prop(String) public zoneId!: string;
  @Prop(String) public centerPadding!: string;
  public index = 0;

  public get slickOptions(): {[key:string]: string | boolean | number} {
    return {
      infinite: true,
      slidesToShow: 1,
      slidesToScroll: 1,
      lazyLoad: 'ondemand',
      arrows: false,
      currentIndex: this.index,
      centerMode: true,
      dots: !!(this.$slots.default && this.$slots.default.length > 1),
      centerPadding: this.centerPadding || '0',
    };
  }

  public next(delay: number): void {
    setTimeout((): void => (this.$refs.slick as Slick).next(), delay);
  }

  public onIndexChanged(event: object, slick: Slick, currentSlide: number): void {
    if (currentSlide !== this.index) {
      this.$emit('change', currentSlide);
      this.index = currentSlide;
      if (pluginOptions.onCarouselSwipe) {
        pluginOptions.onCarouselSwipe(this.zoneId, this.index);
      }
    }
  }
}
</script>
