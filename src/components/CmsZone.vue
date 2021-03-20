<template>
  <div
    v-infinite-scroll="{ action: next, enabled: isScrolling }"
    :class="{ 'scrollable-content': isScrolling }"
  >
    <slot v-if="!zoneType && !contents.length" />
    <slot v-if="zoneStatus === 'error'" name="error" />
    <slot v-if="zoneStatus === 'offline'" name="offline" />
    <slot v-if="zoneStatus === 'loading'" name="loading" />
    <slot v-if="!zoneStatus && !contents.length" name="empty" />
    <div v-if="contents.length">
      <cms-content
        v-if="zoneHeader"
        :html="zoneHeader"
        :context="renderContext"
        :zone-id="zoneId"
      />
      <cms-carousel
        :key="`${nonce}-${zoneId}`"
        :center-padding="contents.length > 1 ? '20px' : '0'"
        :zone-id="zoneId"
        @change="trackIndex"
      >
        <cms-content
          v-for="(content, index) in contents"
          :key="`${nonce}-${content.delivery}`"
          :class="`cms-zone-content-${zoneId}-${index}`"
          class="cms-zone-carousel-content"
          tag="div"
          :html="content.html"
          :context="renderContext"
          :zone-id="zoneId"
        />
      </cms-carousel>

      <strong>LETS DO BOTH </strong>
      <div class="zone-contents">
        <cms-content
          v-for="(content, index) in contents"
          :key="`${nonce}-${content.delivery}`"
          :class="`cms-zone-content-${zoneId}-${index}`"
          tag="div"
          :html="content.html"
          :context="renderContext"
          :zone-id="zoneId"
        />
      </div>
      <slot v-if="cursorLoading" name="cursor" />
      <cms-content
        v-if="zoneFooter"
        :html="zoneFooter"
        :context="renderContext"
        :zone-id="zoneId"
      />
    </div>
  </div>
</template>

<script lang="ts">
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';

import { Content } from '../api';
import cmsClient from '../cmsHttp';
import { pluginOptions } from '../plugins/cms';

import CmsCarousel from './CmsCarousel.vue';
import CmsContent from './CmsContent';

const durationVisibleToBeTrackedMs = 1000;
const percentVisible = 50;

export function getClosest(elm: Element, selector: string): HTMLElement | null {
  while (elm && elm.parentNode !== document) {
    if (elm.matches(selector)) {
      return elm as HTMLElement;
    }
    elm = elm.parentNode as HTMLElement;
  }
  return null;
}

@Component({
  name: 'cms-zone',
  components: { CmsCarousel, CmsContent },
})
export default class CmsZone extends Vue {
  @Prop(String) public zoneId!: string;
  @Prop(Object) public extra!: {};
  @Prop(Object) public context!: {};

  public zoneStatus: string | null = null;
  public zoneType: string = '';
  public zoneHeader: string = '';
  public zoneFooter: string = '';
  public contents: Content[] = [];
  public cursor: string = '';
  public scrollable: Element | null = null;
  public scrollableListeners: EventListener[] = [];

  public nonce: number = 0;
  public cursorLoading: boolean = false;
  public next = debounce(() => this.getNextPage(), 400);

  private get isScrolling() {
    return this.zoneType === 'scrolling';
  }

  private get renderContext() {
    return {
      ...this.extra,
      ...this.context,
    };
  }

  private created(): void {
    this.$root.$on('cms.refresh', this.refresh);
    this.$root.$on(`cms.refresh.${this.zoneId}`, this.refresh);
  }

  private mounted(): void {
    this.refresh();
  }

  private beforeDestroy(): void {
    this.$root.$off('cms.refresh', this.refresh);
    this.$root.$off(`cms.refresh.${this.zoneId}`, this.refresh);
    this.$root.$off(`cms.track.${this.zoneId}`);
    this.removeScrollListeners();
  }

  private removeScrollListeners(): void {
    if (this.scrollable) {
      for (const h of this.scrollableListeners) {
        this.scrollable.removeEventListener('scroll', h);
      }
      this.scrollableListeners = [];
      this.scrollable = null;
    }
  }

  @Watch('zoneId')
  private onZoneIdChanged(): void {
    this.refresh();
  }

  @Watch('extra', { deep: true, immediate: true })
  private async onExtraChanged(value?: object, oldValue?: object): Promise<void> {
    // Prevent deep watcher for extra from firing too often.
    // See: https://github.com/vuejs/vue/issues/5776
    if (oldValue !== undefined && !isEqual(value, oldValue)) {
      await Vue.nextTick();
      this.refresh();
    }
  }

  private async refresh(): Promise<void> {
    if (!pluginOptions.checkConnection()) {
      this.zoneStatus = 'offline';
      this.$el.classList.add('cms-zone-offline');
      this.$el.classList.remove('cms-zone-error');
      this.$el.classList.remove('cms-zone-loading');
      this.contents = [];
      return;
    }

    this.zoneStatus = 'loading';
    this.$el.classList.add('cms-zone-loading');
    this.$el.classList.remove('cms-zone-error');
    this.$el.classList.remove('cms-zone-offline');

    // Increment nonce on every request to prevent vue from re-using cms-content components.
    this.nonce++;

    if (this.zoneId === "84") {
      this.zoneType = 'carousel';
      const choice = (new Date()).getMilliseconds() % 3
      if (choice === 0) {
        this.contents = [
          {
            "delivery": 105221,
            "extra": {
              "external_trackers": [],
              "track_on": ""
            },
            "html": "\n\n\n\n\n\n\n\n\n\n\n\n\n<div class=\"cms-content cms-content-card cms-content-small\" style=\"background-color: #fff\"\n    v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"card\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'>\n\n  \n\n  \n    <div class=\"flexcontainer\">\n      \n      <div style=\"min-width: 40%; border-top-left-radius: 3px; overflow: hidden;\">\n        <a  href=\"http://localhost:1337/cms/passthru/10522/4vpv6q60a_?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\">\n          <img class=\"img-responsive\" style=\"width: 100%\"\n              src=\" https://s3.amazonaws.com/freshebt-cms/amazon_bag_creative.png\"/>\n        </a>\n      </div>\n      \n  \n      \n      <div class=\"main-text\" style=\"color:#001427; min-width: 60%; padding-left: 15px; padding-right: 12px\">\n        \n\n\n        <div class=\"cms-text\" style=\"padding-top:10px\">\n          \n          <div><h4 class=\"header-text\">Amazon Prime is just <s>$12.99</s> $5.99/month with a valid EBT card  </h4></div>\n          \n          <div class=\"body-text\">\n             Get fast, free grocery delivery, movies, TV shows, music, and kids' entertainment. \n          </div>\n        </div>\n      </div>\n    </div>\n  <div class=\"cms-content-card-inner\" style=\"padding-top: 0px; flex-grow: 0\">\n    \n    <div class=\"cms-footer-wrapper\" style=\"margin-top: 12px;\">\n      \n        <a  href=\"http://localhost:1337/cms/passthru/10522/4vpv6q60a_?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\" class=\"footer-text\" style=\"align-self: flex-end; text-transform: uppercase\" v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"button\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'>\n           SIGN UP\n        </a>\n      \n  \n      \n      <div class=\"cms-content-logo\" style=\"max-width: 40%;\">\n        <img class=\"img-responsive\" src=\"https://s3.amazonaws.com/freshebt-cms/Amazon_Prime_Logo.png\"/>\n      </div>\n      \n    </div>\n    \n    \n    \n  </div>\n  \n  <div v-init='{ context, value: { answeredAmazon: false, hasAmazonPrime: false}}' \n      \n      style=\"background-color:#F1F1F1; \n             padding: 10px 12px;\">\n    <div style=\"display: flex; align-items: center\" v-show=\"!context.answeredAmazon\">\n      <div style=\"width:70%; \n                  color:#001F3F; \n                  font-size:14px; \n                  font-weight:600;\n                  line-height:1.3\"> \n         Already an Amazon Prime member?  \n      </div>\n       \n      <a v-ajax-action\n         url=\"/cms/survey/v2:5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\"  \n         method=\"POST\" \n         :args=\"{ membership_status : context }\"\n         :reload=\"false\"\n         style=\"display: block; width: 20%\">\n        <div @click=\"context.hasAmazonPrime = true; context.answeredAmazon = true\" \n             style=\"color:#027ac0; \n                  font-size:14px; \n                  font-weight:600; \n                  text-align: center\"\n                  v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"sub_survey_A\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'> \n           YES  \n        </div>\n      </a>\n      <a v-ajax-action\n         url=\"/cms/survey/v2:5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\"  \n         method=\"POST\" \n         :args=\"{ membership_status : context }\"\n         :reload=\"false\"\n         style=\"display: block; width: 20%\">\n        <div @click=\"context.hasAmazonPrime = false; context.answeredAmazon = true\" \n             style=\"color: #027ac0; \n                  font-size: 14px; \n                  font-weight: 600; \n                  text-align: center\"\n                  v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"sub_survey_B\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'>\n           NO   \n        </div>\n      </a>\n    </div>\n\n    <div v-show=\"context.answeredAmazon\"\n         style=\"width: 100%; \n                color: #001F3F; \n                font-size: 14px; \n                font-weight: 600\"> \n         Thanks for letting us know!   \n    </div>\n  </div> \n  \n</div>\n\n",
            "tracker": "http://localhost:1337/cms/beacon/10522/4vpv6q60a?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d"
          },
          {
            "delivery": 105222,
            "extra": {
              "external_trackers": [],
              "track_on": ""
            },
            "html": "###### HEY #############",
            "tracker": "http://localhost:1337/cms/beacon/10522/4vpv6q60a?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d"
          },
          {
            "delivery": 105223,
            "extra": {
              "external_trackers": [],
              "track_on": ""
            },
            "html": "*******    YOU    ********",
            "tracker": "http://localhost:1337/cms/beacon/10522/4vpv6q60a?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d"
          },
        ];
      } else if (choice === 1) {
        this.contents = [
          {
            "delivery": 105221,
            "extra": {
              "external_trackers": [],
              "track_on": ""
            },
            "html": "\n\n\n\n\n\n\n\n\n\n\n\n\n<div class=\"cms-content cms-content-card cms-content-small\" style=\"background-color: #fff\"\n    v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"card\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'>\n\n  \n\n  \n    <div class=\"flexcontainer\">\n      \n      <div style=\"min-width: 40%; border-top-left-radius: 3px; overflow: hidden;\">\n        <a  href=\"http://localhost:1337/cms/passthru/10522/4vpv6q60a_?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\">\n          <img class=\"img-responsive\" style=\"width: 100%\"\n              src=\" https://s3.amazonaws.com/freshebt-cms/amazon_bag_creative.png\"/>\n        </a>\n      </div>\n      \n  \n      \n      <div class=\"main-text\" style=\"color:#001427; min-width: 60%; padding-left: 15px; padding-right: 12px\">\n        \n\n\n        <div class=\"cms-text\" style=\"padding-top:10px\">\n          \n          <div><h4 class=\"header-text\">FUCK Amazon <s>$12.99</s> $5.99/month with a valid EBT card  </h4></div>\n          \n          <div class=\"body-text\">\n             Get fast, free grocery delivery, movies, TV shows, music, and kids' entertainment. \n          </div>\n        </div>\n      </div>\n    </div>\n  <div class=\"cms-content-card-inner\" style=\"padding-top: 0px; flex-grow: 0\">\n    \n    <div class=\"cms-footer-wrapper\" style=\"margin-top: 12px;\">\n      \n        <a  href=\"http://localhost:1337/cms/passthru/10522/4vpv6q60a_?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\" class=\"footer-text\" style=\"align-self: flex-end; text-transform: uppercase\" v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"button\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'>\n           SIGN UP\n        </a>\n      \n  \n      \n      <div class=\"cms-content-logo\" style=\"max-width: 40%;\">\n        <img class=\"img-responsive\" src=\"https://s3.amazonaws.com/freshebt-cms/Amazon_Prime_Logo.png\"/>\n      </div>\n      \n    </div>\n    \n    \n    \n  </div>\n  \n  <div v-init='{ context, value: { answeredAmazon: false, hasAmazonPrime: false}}' \n      \n      style=\"background-color:#F1F1F1; \n             padding: 10px 12px;\">\n    <div style=\"display: flex; align-items: center\" v-show=\"!context.answeredAmazon\">\n      <div style=\"width:70%; \n                  color:#001F3F; \n                  font-size:14px; \n                  font-weight:600;\n                  line-height:1.3\"> \n         Already an Amazon Prime member?  \n      </div>\n       \n      <a v-ajax-action\n         url=\"/cms/survey/v2:5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\"  \n         method=\"POST\" \n         :args=\"{ membership_status : context }\"\n         :reload=\"false\"\n         style=\"display: block; width: 20%\">\n        <div @click=\"context.hasAmazonPrime = true; context.answeredAmazon = true\" \n             style=\"color:#027ac0; \n                  font-size:14px; \n                  font-weight:600; \n                  text-align: center\"\n                  v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"sub_survey_A\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'> \n           YES  \n        </div>\n      </a>\n      <a v-ajax-action\n         url=\"/cms/survey/v2:5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\"  \n         method=\"POST\" \n         :args=\"{ membership_status : context }\"\n         :reload=\"false\"\n         style=\"display: block; width: 20%\">\n        <div @click=\"context.hasAmazonPrime = false; context.answeredAmazon = true\" \n             style=\"color: #027ac0; \n                  font-size: 14px; \n                  font-weight: 600; \n                  text-align: center\"\n                  v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"sub_survey_B\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'>\n           NO   \n        </div>\n      </a>\n    </div>\n\n    <div v-show=\"context.answeredAmazon\"\n         style=\"width: 100%; \n                color: #001F3F; \n                font-size: 14px; \n                font-weight: 600\"> \n         Thanks for letting us know!   \n    </div>\n  </div> \n  \n</div>\n\n",
            "tracker": "http://localhost:1337/cms/beacon/10522/4vpv6q60a?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d"
          },
          {
            "delivery": 105222,
            "extra": {
              "external_trackers": [],
              "track_on": ""
            },
            "html": "###### HEY 1 #############",
            "tracker": "http://localhost:1337/cms/beacon/10522/4vpv6q60a?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d"
          },
          {
            "delivery": 105223,
            "extra": {
              "external_trackers": [],
              "track_on": ""
            },
            "html": "*******    YOU 1   ********",
            "tracker": "http://localhost:1337/cms/beacon/10522/4vpv6q60a?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d"
          },
        ];
      } else {
        this.contents = [
          {
            "delivery": 105221,
            "extra": {
              "external_trackers": [],
              "track_on": ""
            },
            "html": "\n\n\n\n\n\n\n\n\n\n\n\n\n<div class=\"cms-content cms-content-card cms-content-small\" style=\"background-color: #fff\"\n    v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"card\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'>\n\n  \n\n  \n    <div class=\"flexcontainer\">\n      \n      <div style=\"min-width: 40%; border-top-left-radius: 3px; overflow: hidden;\">\n        <a  href=\"http://localhost:1337/cms/passthru/10522/4vpv6q60a_?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\">\n          <img class=\"img-responsive\" style=\"width: 100%\"\n              src=\" https://s3.amazonaws.com/freshebt-cms/amazon_bag_creative.png\"/>\n        </a>\n      </div>\n      \n  \n      \n      <div class=\"main-text\" style=\"color:#001427; min-width: 60%; padding-left: 15px; padding-right: 12px\">\n        \n\n\n        <div class=\"cms-text\" style=\"padding-top:10px\">\n          \n          <div><h4 class=\"header-text\">FUCK JEFF BEZOS <s>$12.99</s> $5.99/month with a valid EBT card  </h4></div>\n          \n          <div class=\"body-text\">\n             Get fast, free grocery delivery, movies, TV shows, music, and kids' entertainment. \n          </div>\n        </div>\n      </div>\n    </div>\n  <div class=\"cms-content-card-inner\" style=\"padding-top: 0px; flex-grow: 0\">\n    \n    <div class=\"cms-footer-wrapper\" style=\"margin-top: 12px;\">\n      \n        <a  href=\"http://localhost:1337/cms/passthru/10522/4vpv6q60a_?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\" class=\"footer-text\" style=\"align-self: flex-end; text-transform: uppercase\" v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"button\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'>\n           SIGN UP\n        </a>\n      \n  \n      \n      <div class=\"cms-content-logo\" style=\"max-width: 40%;\">\n        <img class=\"img-responsive\" src=\"https://s3.amazonaws.com/freshebt-cms/Amazon_Prime_Logo.png\"/>\n      </div>\n      \n    </div>\n    \n    \n    \n  </div>\n  \n  <div v-init='{ context, value: { answeredAmazon: false, hasAmazonPrime: false}}' \n      \n      style=\"background-color:#F1F1F1; \n             padding: 10px 12px;\">\n    <div style=\"display: flex; align-items: center\" v-show=\"!context.answeredAmazon\">\n      <div style=\"width:70%; \n                  color:#001F3F; \n                  font-size:14px; \n                  font-weight:600;\n                  line-height:1.3\"> \n         Already an Amazon Prime member?  \n      </div>\n       \n      <a v-ajax-action\n         url=\"/cms/survey/v2:5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\"  \n         method=\"POST\" \n         :args=\"{ membership_status : context }\"\n         :reload=\"false\"\n         style=\"display: block; width: 20%\">\n        <div @click=\"context.hasAmazonPrime = true; context.answeredAmazon = true\" \n             style=\"color:#027ac0; \n                  font-size:14px; \n                  font-weight:600; \n                  text-align: center\"\n                  v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"sub_survey_A\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'> \n           YES  \n        </div>\n      </a>\n      <a v-ajax-action\n         url=\"/cms/survey/v2:5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d\"  \n         method=\"POST\" \n         :args=\"{ membership_status : context }\"\n         :reload=\"false\"\n         style=\"display: block; width: 20%\">\n        <div @click=\"context.hasAmazonPrime = false; context.answeredAmazon = true\" \n             style=\"color: #027ac0; \n                  font-size: 14px; \n                  font-weight: 600; \n                  text-align: center\"\n                  v-track-click-legacy\n  ebt-track-event=\"Content click\"\n  ebt-track-event-props='{\n    \"Content id\": 8887,\n    \"Content name\": \"Jan 2021_Discounted Prime_Grocery Image - Prime User Sublink Survey\",\n    \"Source\": \"sub_survey_B\",\n    \"Campaign name\": \"Amazon: Discounted Prime\",\n    \"Zone id\": 84\n    \n  }'>\n           NO   \n        </div>\n      </a>\n    </div>\n\n    <div v-show=\"context.answeredAmazon\"\n         style=\"width: 100%; \n                color: #001F3F; \n                font-size: 14px; \n                font-weight: 600\"> \n         Thanks for letting us know!   \n    </div>\n  </div> \n  \n</div>\n\n",
            "tracker": "http://localhost:1337/cms/beacon/10522/4vpv6q60a?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d"
          },
          {
            "delivery": 105222,
            "extra": {
              "external_trackers": [],
              "track_on": ""
            },
            "html": "###### HEY 2 #############",
            "tracker": "http://localhost:1337/cms/beacon/10522/4vpv6q60a?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d"
          },
          {
            "delivery": 105223,
            "extra": {
              "external_trackers": [],
              "track_on": ""
            },
            "html": "*******    YOU 2    ********",
            "tracker": "http://localhost:1337/cms/beacon/10522/4vpv6q60a?dest=https%3A%2F%2Fwww.amazon.com%2Fqualify%3F%26_encoding%3DUTF8%26tag%3Dfreshebt-rotating-1-20%26linkCode%3Dur2%26linkId%3Df370e217419587c4108d5f6166a8de3a%26camp%3D1789%26creative%3D9325&uid=v2%3A5a94c79b9fed7289fc495d595dceae3daae8c4c298e4f22ed8df37963fa5170d"
          },
        ];
      }
      return;
    }
    let response;
    try {
      response = await cmsClient.fetchZone({ zoneId: this.zoneId, extra: this.extra });
      // this.$el.classList.remove('cms-zone-loading');
      if (!response.data || !response.data.content) {
        throw new Error('No data');
      }
    } catch (error) {
      this.zoneStatus = 'error';
      this.$el.classList.remove('cms-zone-loading');
      this.$el.classList.add('cms-zone-error');
      this.zoneType = '';
      this.contents = [];
      return;
    }
    const data = response.data;
    this.zoneType = data.zone_type;
    this.contents = data.content as Content[];
    this.cursor = data.cursor;
    this.zoneHeader = data.zone_header
      ? `<div class="zone-header">${data.zone_header || ''}</div>`
      : '';
    this.zoneFooter = data.zone_footer
      ? `<div class="zone-footer">${data.zone_footer || ''}</div>`
      : '';
    this.zoneStatus = null;

    if (!this.contents.length) {
      return;
    }

    this.removeScrollListeners();
    this.scrollable = getClosest(this.$el, '.scrollable-content');
    if (this.scrollable) {
      this.trackScrollable(this.contents, this.scrollable);
      return;
    }

    if (this.zoneType === 'carousel') {
      this.trackIndex(0);
    } else {
      this.contents.forEach((c, i): void => this.trackIndex(i));
    }
  }

  private trackIndex(index: number): void {
    const content = this.contents[index];
    if (!content || content.tracked) {
      return;
    }
    content.tracked = true;

    const trackOn = (content.extra || {}).track_on;
    if (trackOn) {
      this.$root.$once(
        `cms.track.${this.zoneId}`,
        async (): Promise<void> => {
          await cmsClient.trackZone({ content, zoneId: this.zoneId });
          this.$root.$emit(`cms.refresh.${this.zoneId}`);
        }
      );

      this.$root.$once('router.change', (hash: string): void => {
        const regex = new RegExp(trackOn);
        if (regex.test(hash)) {
          this.$root.$emit(`cms.track.${this.zoneId}`);
        }
      });
      return;
    }

    cmsClient.trackZone({ content, zoneId: this.zoneId });
  }

  private trackScrollable(contents: Content[], scrollable: Element): void {
    if (this.zoneType === 'carousel') {
      let timeout: number;
      const listener = (): void => {
        window.clearTimeout(timeout);
        timeout = window.setTimeout((): void => {
          const contentElm = this.$el.querySelector('.slick-current');
          if (contentElm && this.isContentVisible(contentElm, scrollable, percentVisible)) {
            this.trackIndex(0);
            contentElm.classList.add('content-viewable-tracked');
            scrollable.removeEventListener('scroll', listener);
          }
        }, durationVisibleToBeTrackedMs);
      };
      scrollable.addEventListener('scroll', listener);
      this.scrollableListeners.push(listener);
      Vue.nextTick(listener);
      return;
    }

    contents.forEach((content, i): void => {
      let timeout: number;
      const listener = (): void => {
        window.clearTimeout(timeout);
        timeout = window.setTimeout((): void => {
          const contentElm = this.$el.querySelector(`.cms-zone-content-${this.zoneId}-${i}`);
          if (contentElm && this.isContentVisible(contentElm, scrollable, percentVisible)) {
            this.trackIndex(i);
            contentElm.classList.add('content-viewable-tracked');
            scrollable.removeEventListener('scroll', listener);
          }
        }, durationVisibleToBeTrackedMs);
      };
      scrollable.addEventListener('scroll', listener);
      this.scrollableListeners.push(listener);
      Vue.nextTick(listener);
    });
  }

  private async getNextPage() {
    if (!pluginOptions.checkConnection()) {
      return;
    }

    if (this.cursorLoading) {
      return;
    }

    this.cursorLoading = true;

    let response;
    try {
      response = await cmsClient.fetchZone({
        zoneId: this.zoneId,
        extra: this.extra,
        cursor: this.cursor,
      });
      if (!response.data || !response.data.content) {
        throw new Error('No data');
      }
      this.cursor = response.data.cursor;
      const newContents = response.data.content as Content[];
      this.contents.push(...newContents);
      if (this.scrollable) {
        this.trackScrollable(newContents, this.scrollable);
      }
    } finally {
      this.cursorLoading = false;
    }
  }

  private isContentVisible(el: Element, viewport: Element, minPercentVisible: number): boolean {
    const elRect = el.getBoundingClientRect();
    const elTop = elRect.top;
    const elBottom = elRect.bottom;
    const elHeight = elRect.height;

    const vRect = viewport.getBoundingClientRect();
    const vBottom = vRect.bottom;

    const offset = 0;
    const vTop = vRect.top + offset;

    let invisibleHeight = 0;
    if (elTop > vTop) {
      invisibleHeight = elBottom - vBottom;
    } else if (elTop < vTop) {
      invisibleHeight = vTop - elTop;
    }
    const visibleHeight = elHeight - invisibleHeight;
    return (visibleHeight / elHeight) * 100 >= minPercentVisible;
  }
}
</script>

<style>
.scrollable {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}

.scrollable-header {
  flex: 0 0 auto;
  position: static;
}

.scrollable-content {
  height: 100%;
  width: 100%;
  flex: 1 1 auto;
  position: relative; /* need this to position inner content */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
