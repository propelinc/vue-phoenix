import Axios from 'axios';
import CmsPlugin, { Content } from './main';

const axios = Axios.create({
  baseURL: CmsPlugin.baseUrl,
  timeout: 30 * 1000, // Timeout
});

class CmsClient {
  async http({ zoneId, url, params }: { zoneId: string, url: string, params?: object }) {
    const captable = CmsPlugin.getCaptable();
    const zoneCaptable = captable[zoneId];
    const headers = zoneCaptable ? { Captable: zoneCaptable } : {};
    const response = await axios.get(url, { params, headers });
    if (response.data && response.data.captable) {
      CmsPlugin.setCaptable({ zoneId, captable: response.data.captable });
    }
    return response;
  }

  async fetchZone({ zoneId, extra }: { zoneId: string, extra: object }) {
    if (CmsPlugin.beforeFetchZone) {
      await CmsPlugin.beforeFetchZone();
    }

    return this.http({
      zoneId,
      url: `/cms/zone/${zoneId}`,
      params: {
        cb: Math.floor(Math.random() * 999999999),
        ...CmsPlugin.getSiteVars(),
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
