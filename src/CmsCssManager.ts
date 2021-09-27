// This is heavily inspired by the http-vue-loader library.
// See: https://github.com/FranckFreiburger/http-vue-loader/blob/master/src/httpVueLoader.js.

let scopeIdCounter = 0;

const CMS_CONTENT_ATTRIBUTE_NAME = 'data-cms-css';

export default class CmsCssManager {
  scopeId: number;
  private styleElement: HTMLStyleElement | null = null;

  constructor(css?: string) {
    this.scopeId = scopeIdCounter++;

    if (css) {
      this.add(css);
    }
  }

  get scopeAttrs(): { [key: string]: number } {
    return { [CMS_CONTENT_ATTRIBUTE_NAME]: this.scopeId };
  }

  get scopeSelector(): string {
    return `[${CMS_CONTENT_ATTRIBUTE_NAME}=${this.scopeId}]`;
  }

  private add(css: string) {
    const base = this.createTemporaryBaseElement();

    this.styleElement = document.createElement('style');
    this.styleElement.appendChild(document.createTextNode(css));
    this.styleElement.setAttribute('data-cms-css-for', this.scopeId.toString());
    document.head.appendChild(this.styleElement);
    this.scopeStyles();

    document.head.removeChild(base);
  }

  update(css?: string) {
    if (css) {
      if (this.styleElement) {
        const base = this.createTemporaryBaseElement();

        this.styleElement.textContent = css;
        this.scopeStyles();

        document.head.removeChild(base);
      } else {
        this.add(css);
      }
    } else {
      this.destroy();
    }
  }

  destroy() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }

  // Firefox and chrome need the <base> to be set while inserting or modifying <style> in a document.
  private createTemporaryBaseElement(): HTMLBaseElement {
    const temporaryBaseElement = document.createElement('base');
    temporaryBaseElement.href = window.location.href;

    const head = document.head;
    head.insertBefore(temporaryBaseElement, head.firstChild);

    return temporaryBaseElement;
  }

  private scopeStyles() {
    if (!this.styleElement) {
      return;
    }

    const sheet = this.styleElement.sheet as CSSStyleSheet;

    if (!sheet) {
      return;
    }

    const rules = sheet.cssRules;

    for (let i = 0; i < rules.length; ++i) {
      const rule = rules[i] as CSSStyleRule;

      if (rule.type !== CSSRule.STYLE_RULE) {
        continue;
      }

      const scopedSelectors: string[] = [];

      rule.selectorText.split(/\s*,\s*/).forEach((selector: string) => {
        scopedSelectors.push(`${this.scopeSelector} ${selector}`);
        const segments = selector.match(/([^ :]+)(.+)?/) || [];
        scopedSelectors.push(`${segments[1]}${this.scopeSelector}${segments[2] || ''}`);
      });

      const ruleBody = rule.cssText.substr(rule.selectorText.length);
      const scopedRule = `${scopedSelectors.join(',')}${ruleBody}`;
      sheet.deleteRule(i);
      sheet.insertRule(scopedRule, i);
    }
  }
}
