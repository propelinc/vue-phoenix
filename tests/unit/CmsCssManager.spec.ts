import CmsCssManager from '@/CmsCssManager';
describe('CmsCssManager.ts', (): void => {
  afterEach(() => {
    document.querySelectorAll('style').forEach(styleTag => {
      styleTag.remove();
    });
  });

  it('calculates scope-related variables correctly', () => {
    const cssManager = new CmsCssManager();

    const scopeId = cssManager.scopeId;
    expect(cssManager.scopeSelector).toBe(`[data-cms-css=${scopeId}]`);
    expect(cssManager.scopeAttrs).toEqual({ 'data-cms-css': scopeId });
  });

  it('updates the scope id for every new css manager', () => {
    expect(new CmsCssManager().scopeId).not.toBe(new CmsCssManager().scopeId);
  });

  it('can add styles', async (): Promise<void> => {
    const cssManager = new CmsCssManager();

    cssManager.addStyles('h1 {color: blue;}');

    const styleTags = document.querySelectorAll('style');
    expect(styleTags.length).toBe(1);
    const styleTag = styleTags[0];
    expect(styleTag.getAttribute('data-cms-css-for')).toEqual(`${cssManager.scopeId}`);
    // In reality, the styles should have been scoped.
    // However, it doesn't seem like jsdom links the style tag text and the js representation of the rules together.
    expect(styleTag.innerHTML).toBe('h1 {color: blue;}');
  });

  it('can properly scopes styles', () => {
    const cssManager = new CmsCssManager();

    cssManager.addStyles('h1 {color: blue;} .center {transition: transform(-50%, -50%);}');

    // Similarly to above, the text of the style tag doesn't seem to get updated properly, so we have to get the actual css rules.
    const styleTag = document.querySelector('style');
    const cssRules = (styleTag!.sheet as CSSStyleSheet).cssRules;
    expect(cssRules[0].cssText).toBe(`[data-cms-css=${cssManager.scopeId}] h1,h1[data-cms-css=${cssManager.scopeId}] {color: blue;}`);
    expect(cssRules[1].cssText).toBe(`[data-cms-css=${cssManager.scopeId}] .center,.center[data-cms-css=${cssManager.scopeId}] {transition: transform(-50%, -50%);}`);
  });

  it('can update styles', async (): Promise<void> => {
    const cssManager = new CmsCssManager();

    cssManager.addStyles('h1 {color: blue;} .center {transition: transform(-50%, -50%);}');

    const styleTag = document.querySelector('style');
    expect(styleTag!.innerHTML).toBe('h1 {color: blue;} .center {transition: transform(-50%, -50%);}');

    cssManager.updateStyles('h2 {color: green;}');
    expect(styleTag!.innerHTML).toBe('h2 {color: green;}');
  });

  it('can remove styles', () => {
    const cssManager = new CmsCssManager();

    cssManager.addStyles('h2 {color: green;}');
    expect(document.querySelectorAll('style').length).toBe(1);

    cssManager.removeStyles();
    expect(document.querySelectorAll('style').length).toBe(0);
  });
});
