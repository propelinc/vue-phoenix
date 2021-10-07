import isEqual from 'lodash/isEqual';
import { CreateElement, Component as ComponentType, VNode } from 'vue';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

import { pluginOptions } from '../plugins/cms';
import ContentCssManager from '../services/contentCssManager';

@Component({ name: 'cms-content' })
export default class CmsContent extends Vue {
  @Prop(String) public html!: string;
  @Prop(String) public css?: string;
  @Prop(String) public zoneId!: string;
  @Prop(Object) public context!: {};
  @Prop(String) public tag!: string;

  public mutableContext: object = {};
  public setupComplete: boolean = false;
  private cssManager!: ContentCssManager;

  private created(): void {
    this.mutableContext = { ...this.context };
    this.cssManager = new ContentCssManager(this.css);
  }

  private beforeDestroy(): void {
    this.cssManager.destroy();
  }

  private track(event: string, props: object): void {
    pluginOptions.trackAnalytics(event, props);
  }

  private setup(props: object): void {
    if (!this.setupComplete) {
      Object.keys(props).forEach((k): void => {
        this.$set(this.mutableContext, k, props[k]);
      });
      this.setupComplete = true;
    }
  }

  @Watch('context', { deep: true, immediate: true })
  private updateContext(value?: object, oldValue?: object): void {
    // Prevent deep watcher for context from firing too often.
    // See: https://github.com/vuejs/vue/issues/5776
    if (oldValue !== undefined && !isEqual(value, oldValue)) {
      this.mutableContext = { ...this.mutableContext, ...this.context };
    }
  }

  private render(h: CreateElement): VNode {
    if (!this.html) {
      return h('div', this.$slots.default);
    }

    let html = this.html.trim();
    if (this.tag) {
      html = `<${this.tag}>${html}</${this.tag}>`;
    }

    const compiled = Vue.compile(html);
    const dynamic: ComponentType = {
      name: 'CmsDynamicContent',
      props: { context: Object, zoneId: String },
      computed: {},
      components: {},
      methods: {
        setup: this.setup,
        track: this.track,
        ...pluginOptions.extensions,
      },
      ...compiled,
    };

    return h(dynamic, {
      attrs: this.cssManager.scopeAttrs,
      props: { context: this.mutableContext, zoneId: this.zoneId },
    });
  }

  private renderError(h: CreateElement, err: Error): VNode {
    return h('pre', { style: { color: 'red' } }, err.stack);
  }

  @Watch('css')
  private updateCss() {
    this.cssManager.update(this.css);
  }
}
