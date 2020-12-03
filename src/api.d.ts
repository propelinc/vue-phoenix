/* eslint-disable camelcase */
export interface Captable {
}

export interface ZoneCaptable {
  zoneId?: Captable;
}

export interface CMSZoneResponse {
  content: Content[];
  captable: Captable;
  zone_type: string;
  zone_header: string | null;
  zone_footer: string | null;
}

export interface HTMLContent {
  html: string;
}

export interface Content extends HTMLContent {
  url?: string;
  delivery: number;
  tracker: string;
  track_on?: string;
  tracked?: boolean;
  extra?: {
    track_on?: string;
    external_trackers?: string[];
  }
}

export interface ContentTracker {
  trackOn: string;
  content: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  zoneId: string;
}

export interface CmsStyleSheet {
  url: string;
  css_hash: string;
  sheet?: HTMLLinkElement;
}
