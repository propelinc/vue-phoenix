import { CreateElement, Component as ComponentType, VNode } from 'vue';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

@Component({ name: 'cms-content' })
export default class CmsContent extends Vue {
  @Prop(String) public html!: string;
  @Prop(Object) public extra!: {};
  @Prop(Object) public context!: {};
  @Prop(String) public zoneId!: string;
  @Prop({ default: '' }) public tag!: string;

  private _context: object = {};

  private beforeMount(): void {
    this._context = {
      ...this.context,
      ...this.extra,
    }
  }

  @Watch('context', { deep: true, immediate: true })
  private onContextChanged(): void {
    this._context = {
      ...this._context,
      ...this.context,
    };
  }

  @Watch('extra', { deep: true, immediate: true })
  private onExtraChanged(): void {
    this._context = {
      ...this._context,
      ...this.extra,
    };
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
      props: { context: this._context, zoneId: this.zoneId },
    });
  }

  private renderError(h: CreateElement, err: Error): VNode {
    return h('pre', { style: { color: 'red' } }, err.stack);
  }
}
