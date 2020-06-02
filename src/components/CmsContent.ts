import { CreateElement, Component as ComponentType, VNode } from 'vue';
import { Vue, Component, Prop } from 'vue-property-decorator';


@Component({ name: 'cms-content' })
export default class CmsContent extends Vue {
  @Prop(String) public html!: string;
  @Prop(Object) public extra!: {};
  @Prop(String) public zoneId!: string;
  @Prop({ default: '' }) public tag!: string;

  public context: object = {};

  private created(): void {
    this.context = { ...this.extra };
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
      props: { context: this.context, zoneId: this.zoneId },
    });
  }

  private renderError(h: CreateElement, err: Error): VNode {
    return h('pre', { style: { color: 'red' } }, err.stack);
  }
}
