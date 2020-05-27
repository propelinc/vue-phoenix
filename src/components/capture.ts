import { VNode, CreateElement } from 'vue';
import { Vue, Component, Prop } from 'vue-property-decorator';

interface Yielder {
  name: string;
  content?: VNode[] | null;
  defaultContent: VNode[] | null;
}

interface YielderObj {
  [key: string]: Yielder;
}

let yielders: YielderObj = {};

export function resetAllYielders(): void {
  yielders = {};
}

@Component({ name: 'yield-to' })
export class YieldTo extends Vue {
  @Prop(String) public name!: string;

  public render(h: CreateElement): VNode {
    if (!yielders[this.name]) {
      yielders[this.name] = {
        name: this.name,
        defaultContent: this.$slots.default || null,
      };
    }

    const yielder = yielders[this.name];
    const content = yielder.content || yielder.defaultContent;
    return h('div', content);
  }

  public beforeMount(): void {
    this.$root.$on(`capture.${this.name}`, (): void => {
      this.$forceUpdate();
    });
  }

  public beforeDestroy(): void {
    this.$root.$off(`capture.${this.name}`);
    delete yielders[this.name];
  }
}

@Component({ name: 'content-for' })
export class ContentFor extends Vue {
  @Prop(String) public name!: string;

  public render(createElement: CreateElement): VNode {
    if (yielders[this.name]) {
      yielders[this.name].content = this.$slots.default;
      this.$root.$emit(`capture.${this.name}`);
    }
    return createElement('div');
  }

  public updated(): void {
    if (yielders[this.name]) {
      yielders[this.name].content = this.$slots.default;
      this.$root.$emit(`capture.${this.name}`);
    }
  }

  public beforeDestroy(): void {
    const yielder = yielders[this.name];
    if (yielder && yielder.content === this.$slots.default) {
      delete yielders[this.name].content;
      this.$root.$emit(`capture.${this.name}`);
    }
  }
}
