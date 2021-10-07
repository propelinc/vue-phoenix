import ContentCssManager from '@/services/contentCssManager';

function getCssRules(element: HTMLStyleElement): string[] {
  const cssRules = Array.from((element.sheet! as CSSStyleSheet).cssRules);
  return cssRules.map((ruleList: CSSStyleRule) => ruleList.cssText);
}

describe('contentCssManager.ts', (): void => {
  afterEach(() => {
    document.querySelectorAll('style').forEach((styleTag) => {
      styleTag.remove();
    });
  });

  it('calculates scope-related variables correctly', () => {
    const cssManager = new ContentCssManager();

    const scopeId = cssManager.scopeId;
    expect(cssManager.scopeSelector).toBe(`[data-cms-css="${scopeId}"]`);
    expect(cssManager.scopeAttrs).toEqual({ 'data-cms-css': scopeId });
  });

  it('updates the scope id for every new css manager', () => {
    expect(new ContentCssManager().scopeId).not.toBe(new ContentCssManager().scopeId);
  });

  it('can properly add scoped styles', () => {
    const cssManager = new ContentCssManager(
      'h1 {color: blue;} .center {transition: transform(-50%, -50%);}'
    );

    const styleTags = document.querySelectorAll('style');
    expect(styleTags.length).toBe(1);

    const cssRules = getCssRules(styleTags[0]);
    expect(cssRules).toEqual([
      `[data-cms-css="${cssManager.scopeId}"] h1,h1[data-cms-css="${cssManager.scopeId}"] {color: blue;}`,
      `[data-cms-css="${cssManager.scopeId}"] .center,.center[data-cms-css="${cssManager.scopeId}"] {transition: transform(-50%, -50%);}`,
    ]);
  });

  it('can update styles', async (): Promise<void> => {
    const cssManager = new ContentCssManager(
      'h1 {color: blue;} .center {transition: transform(-50%, -50%);}'
    );

    const styleTag = document.querySelector('style');
    expect(getCssRules(styleTag!)[0]).toBe(
      `[data-cms-css="${cssManager.scopeId}"] h1,h1[data-cms-css="${cssManager.scopeId}"] {color: blue;}`
    );

    cssManager.update('h2 {color: green;}');
    expect(getCssRules(styleTag!)[0]).toBe(
      `[data-cms-css="${cssManager.scopeId}"] h2,h2[data-cms-css="${cssManager.scopeId}"] {color: green;}`
    );
  });

  it('remove styles when update is called with nothing', async (): Promise<void> => {
    const cssManager = new ContentCssManager(
      'h1 {color: blue;} .center {transition: transform(-50%, -50%);}'
    );
    expect(document.querySelectorAll('style').length).toBe(1);

    cssManager.update();
    expect(document.querySelectorAll('style').length).toBe(0);

    cssManager.update('h2 {color: green;}');
    expect(document.querySelectorAll('style').length).toBe(1);
  });

  it('keeps css scoped to each instance', async (): Promise<void> => {
    const firstManager = new ContentCssManager('h1 {color: blue;}');
    const secondManager = new ContentCssManager('p {color: blue;}');

    const styleTags = document.querySelectorAll('style');
    expect(styleTags.length).toBe(2);

    expect(getCssRules(styleTags[0])).toEqual([
      `[data-cms-css="${firstManager.scopeId}"] h1,h1[data-cms-css="${firstManager.scopeId}"] {color: blue;}`,
    ]);
    expect(getCssRules(styleTags[1])).toEqual([
      `[data-cms-css="${secondManager.scopeId}"] p,p[data-cms-css="${secondManager.scopeId}"] {color: blue;}`,
    ]);
  });

  it('can remove styles', () => {
    const cssManager = new ContentCssManager('h2 {color: green;}');
    expect(document.querySelectorAll('style').length).toBe(1);

    cssManager.destroy();
    expect(document.querySelectorAll('style').length).toBe(0);
  });
});
