import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import { Content, CmsStyleSheet } from './api';
import { pluginOptions } from './plugins/cms';

class CmsClient {
  private _axios: null | AxiosInstance = null;

  private cssUpdatedAt = 0;

  private stylesheets: { [key: string]: CmsStyleSheet } = {};

  private globalCssPromise: Promise<void> | null = null;

  get axios(): AxiosInstance {
    if (!this._axios) {
      this._axios = Axios.create({
        baseURL: pluginOptions.baseUrl,
        timeout: 30 * 1000, // Timeout
      });
    }
    return this._axios;
  }

  async http({ zoneId, url, params }: { zoneId: string, url: string, params?: object }) {
    const captable = pluginOptions.getCaptable();
    const zoneCaptable = captable[zoneId];
    const headers = zoneCaptable ? { Captable: zoneCaptable } : {};
    const response = await this.axios.get(url, { params, headers });
    if (response.data && response.data.captable) {
      pluginOptions.setCaptable({ zoneId, captable: response.data.captable });
    }
    return response;
  }

  async fetchGlobalStyles() {
    const now = new Date().getTime();
    if (this.cssUpdatedAt && this.cssUpdatedAt + pluginOptions.globalCssCacheMs > now) {
      return;
    }

    if (!this.globalCssPromise) {
      this.globalCssPromise = this.axios.get('/cms/styles')
        .then((response: AxiosResponse<{styles: CmsStyleSheet[]}>): void => {
          response.data.styles.forEach((stylesheet: CmsStyleSheet) => {
            this.updateStyleSheet(stylesheet);
          });
          this.cssUpdatedAt = now;
        })
        .finally((): void => {
          this.globalCssPromise = null;
        });
    }

    return this.globalCssPromise;
  }

  updateStyleSheet(stylesheet: CmsStyleSheet) {
    const currSheet = this.stylesheets[stylesheet.url];
    if (!currSheet || currSheet.css_hash !== stylesheet.css_hash) {
      this.removeStyleSheet(currSheet);
      this.stylesheets[stylesheet.url] = stylesheet;
      this.addStyleSheet(stylesheet);
    }
  }

  addStyleSheet(stylesheet: CmsStyleSheet) {
    var linkElement = document.createElement('link');
    linkElement.setAttribute('rel', 'stylesheet');
    linkElement.setAttribute('type', 'text/css');
    linkElement.setAttribute('href', stylesheet.url);
    var head = document.getElementsByTagName('head')[0];
    head.appendChild(linkElement);
  }

  removeStyleSheet(stylesheet: CmsStyleSheet) {
    if (stylesheet && stylesheet.sheet) {
      stylesheet.sheet.disabled = true;
      if (stylesheet.sheet.parentNode) {
        stylesheet.sheet.parentNode.removeChild(stylesheet.sheet);
        delete stylesheet.sheet;
      }
    }
  }

  async fetchZone({ zoneId, extra, cursor }: { zoneId: string, extra: object, cursor?: string }) {
    if (pluginOptions.beforeFetchZone) {
      await pluginOptions.beforeFetchZone();
    }

    await this.fetchGlobalStyles();

    return this.http({
      zoneId,
      url: `/cms/zone/${zoneId}`,
      params: {
        cb: Math.floor(Math.random() * 999999999),
        cursor: cursor,
        ...pluginOptions.getSiteVars(),
        ...extra,
      },
    });
  }

  async trackZone({ zoneId, content }: { zoneId: string, content: Content }) {
    const externalTrackers = (content.extra || {}).external_trackers;
    if (externalTrackers && externalTrackers.length) {
      externalTrackers.forEach((src: string): void => {
        const img = document.createElement('img');
        img.src = src;
        img.width = 0;
        img.height = 0;
        document.body.appendChild(img);
      });
    }

    await this.http({ zoneId, url: content.tracker });
  }

  async cmsAction(request: AxiosRequestConfig) {
    return this.axios.request(request);
  }
}

export default new CmsClient();
