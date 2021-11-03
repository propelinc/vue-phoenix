/* eslint-disable camelcase */
export interface Captable {}

export interface ZoneCaptable {
  zoneId?: Captable;
}

export interface HTMLContent {
  html: string;
  css?: string;
}

export interface Content extends HTMLContent {
  delivery: number;
  tracker: string;
  track_on?: string;
  tracked?: boolean;
  extra?: {
    track_on?: string;
    external_trackers?: string[];
  };
}

export interface CMSZoneResponse {
  content: Content[];
  captable: Captable;
  zone_type: string;
  zone_header: string | null;
  zone_footer: string | null;
  cursor: string | null;
}

export interface ContentTracker {
  trackOn: string;
  content: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  zoneId: number;
}

export interface CmsStyleSheet {
  url: string;
  css_hash: string;
  sheet?: HTMLLinkElement;
}
