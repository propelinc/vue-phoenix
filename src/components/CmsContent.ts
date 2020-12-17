import { CreateElement, Component as ComponentType, VNode } from 'vue';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

import CmsCssManager from '@/CmsCssManager';

@Component({ name: 'cms-content' })
export default class CmsContent extends Vue {
  @Prop(String) public html!: string;
  @Prop(String) public css?: string;
  @Prop(Object) public extra!: {};
  @Prop(String) public zoneId!: string;
  @Prop({ default: '' }) public tag!: string;

  public context: object = {};
  private cssManager!: CmsCssManager;

  private created(): void {
    this.context = { ...this.extra };
    this.cssManager = new CmsCssManager();

    if (this.css) {
      this.cssManager.addStyles(this.css);
    }
  }

  private beforeDestroy(): void {
    this.cssManager.removeStyles();
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
      ...compiled,
    };

    return h(dynamic, {
      attrs: this.cssManager.scopeAttrs,
      props: { context: this.context, zoneId: this.zoneId },
    });
  }

  private renderError(h: CreateElement, err: Error): VNode {
    return h('pre', { style: { color: 'red' } }, err.stack);
  }

  @Watch('css')
  private updateCss() {
    if (this.css) {
      this.cssManager.updateStyles(this.css);
    } else {
      this.cssManager.removeStyles();
    }
  }
}
