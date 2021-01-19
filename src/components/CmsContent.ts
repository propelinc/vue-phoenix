import isEqual from 'lodash/isEqual';
import { CreateElement, Component as ComponentType, VNode } from 'vue';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

@Component({ name: 'cms-content' })
export default class CmsContent extends Vue {
  @Prop(String) public html!: string;
  @Prop(Object) public extra!: {};
  @Prop(Object) public renderContext!: {};
  @Prop(String) public zoneId!: string;
  @Prop({ default: '' }) public tag!: string;

  public context: object = {};

  private created(): void {
    this.context = {
      ...this.extra,
      ...this.renderContext,
     };
  }

  @Watch('renderContext', { deep: true, immediate: true })
  private updateContext(value?: object, oldValue?: object): void {
    // Prevent deep watcher for extra from firing too often.
    // See: https://github.com/vuejs/vue/issues/5776
    if (oldValue !== undefined && !isEqual(value, oldValue)) {
      Object.assign(this.context, this.renderContext);
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

    html = `<div>hey${html}</div>`
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
