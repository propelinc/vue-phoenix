
export function getClosest(elm: Element, selector: string): HTMLElement | null {
  while (elm && elm.parentNode !== document) {
    if (elm.matches(selector)) {
      return elm as HTMLElement;
    }
    elm = elm.parentNode as HTMLElement;
  }
  return null;
}

// See here for why we set our own serializer
// https://stackoverflow.com/questions/49944387/how-to-correctly-use-axios-params-with-arrays/51444749
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function alternateAxiosSerializer(params: any): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryParams: [string, any][] = [];
  Object.keys(params).forEach((k) => {
    const val = params[k];
    if (Array.isArray(val)) {
      val.forEach((v) => {
        queryParams.push([k, v]);
      });
    } else {
      queryParams.push([k, val]);
    }
  });

  return new URLSearchParams(queryParams).toString();
}
