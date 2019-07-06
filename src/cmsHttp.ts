import Axios, { AxiosInstance } from 'axios';
import { pluginOptions, Content } from './main';

class CmsClient {

  private _axios: null | AxiosInstance = null;

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

  async fetchZone({ zoneId, extra }: { zoneId: string, extra: object }) {
    if (pluginOptions.beforeFetchZone) {
      await pluginOptions.beforeFetchZone();
    }

    return this.http({
      zoneId,
      url: `/cms/zone/${zoneId}`,
      params: {
        cb: Math.floor(Math.random() * 999999999),
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

}

export default new CmsClient();
