<template>
  <div v-if="value" @click.stop="">
    <div class="cms-inspect-sheet-scrim" @click="$emit('input', false)" />
    <div class="cms-inspect-sheet">
      <div class="cms-inspect-sheet__header">
        <h4 class="cms-inspect-sheet__header__title">Zone {{ zoneId }}</h4>
      </div>

      <div class="cms-inspect-sheet__body">
        <div class="cms-inspect-sheet__section">
          <h4>Basics</h4>
          <div class="cms-inspect-sheet__row">
            <div class="cms-inspect-sheet__row__label">Type</div>
            <div class="cms-inspect-sheet__row__value">{{ zoneType || 'default' }}</div>
          </div>
          <div class="cms-inspect-sheet__row">
            <div class="cms-inspect-sheet__row__label">Status</div>
            <div class="cms-inspect-sheet__row__value">{{ zoneStatus || 'normal' }}</div>
          </div>

          <button class="cms-inspect-sheet__button" @click="refreshZone">Refresh</button>
        </div>

        <div class="cms-inspect-sheet__section">
          <h4>Deliveries</h4>
          <template v-if="contents.length > 0">
            <div v-for="(content, index) in contents" :key="index" class="cms-inspect-sheet__row">
              <div class="cms-inspect-sheet__row__label">Delivery {{ content.delivery }}</div>
              <div class="cms-inspect-sheet__row__value">
                <a target="_blank" :href="getDeliveryAdminLink(content.delivery)">View in admin</a>
              </div>
            </div>
          </template>
          <div v-else>Nothing was delivered to this zone.</div>
        </div>

        <div class="cms-inspect-sheet__section">
          <h4>Context</h4>
          <template v-if="renderContextEntries.length > 0">
            <div>This zone has access to the following extra fields in the CMS template:</div>
            <div
              v-for="(entry, index) in renderContextEntries"
              :key="index"
              class="cms-inspect-sheet__row"
            >
              <div class="cms-inspect-sheet__row__label">{{ entry[0] }}</div>
              <div class="cms-inspect-sheet__row__value">{{ entry[1] }}</div>
            </div>
          </template>
          <div v-else>There are no additional fields for this zone.</div>
        </div>

        <div class="cms-inspect-sheet__section">
          <h4>Sitevars</h4>
          <div>These variables are shared across all zones:</div>
          <div v-for="(entry, index) in siteVarEntries" :key="index" class="cms-inspect-sheet__row">
            <div class="cms-inspect-sheet__row__label">{{ entry[0] }}</div>
            <div class="cms-inspect-sheet__row__value">{{ entry[1] }}</div>
          </div>
        </div>
      </div>

      <div class="cms-inspect-sheet__footer">
        <a class="cms-inspect-sheet__button" target="_blank" :href="zoneAdminLink">
          View in admin
        </a>
        <button
          class="cms-inspect-sheet__button cms-inspect-sheet__button--text"
          @click="$emit('input', false)"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

import { Content } from '../api';
import { pluginOptions } from '../plugins/cms';

@Component
export default class CmsInspectSheet extends Vue {
  @Prop({ type: Boolean, default: false }) value!: boolean;
  @Prop({ type: String, required: true }) zoneId!: string;
  @Prop({ type: String }) zoneStatus?: string;
  @Prop({ type: String }) zoneType?: string;
  @Prop({ type: String }) zoneHeader?: string;
  @Prop({ type: String }) zoneFooter?: string;
  @Prop(Object) renderContext?: object;
  @Prop({ type: Array, default: () => [] }) contents!: Content[];

  siteVars = {};

  created(): void {
    this.siteVars = pluginOptions.getSiteVars();
  }

  get zoneAdminLink(): string {
    return `${pluginOptions.adminUrl}/admin/zone/edit/?id=${this.zoneId}`;
  }

  get siteVarEntries() {
    return Object.entries(this.siteVars).filter((entry) => {
      return entry[1] !== undefined && entry[1] !== null && entry[1] !== '';
    });
  }

  get renderContextEntries() {
    return Object.entries(this.renderContext || {}).filter((entry) => {
      return entry[1] !== undefined && entry[1] !== null;
    });
  }

  getDeliveryAdminLink(deliveryId: number): string {
    return `${pluginOptions.adminUrl}/admin/delivery/?flt0_0=${deliveryId}`;
  }

  refreshZone(): void {
    this.$root.$emit(`cms.refresh.${this.zoneId}`);
  }
}
</script>

<style lang="scss" scoped>
$cms-inspect-sheet-border: 1px solid #d1d3d7;

.cms-inspect-sheet-scrim {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  background: fade(black, 45%);
}

.cms-inspect-sheet {
  position: fixed;
  color: black;
  z-index: 101;
  background: white;
  border-radius: 8px 8px 0 0;
  top: 72px;
  left: 0;
  right: 0;
  bottom: 0;
  text-align: left;
  display: flex;
  flex-direction: column;
}

.cms-inspect-sheet__header {
  padding: 8px 16px;
  flex: none;
  border-bottom: $cms-inspect-sheet-border;
}

.cms-inspect-sheet__header__title {
  font-weight: bold;
  text-align: center;
}

.cms-inspect-sheet__body {
  padding: 8px 16px;
  overflow: scroll;
  flex: auto;
}

.cms-inspect-sheet__section {
  & + & {
    margin-top: 16px;
    padding-top: 16px;
    border-top: $cms-inspect-sheet-border;
  }
}

.cms-inspect-sheet__footer {
  border-top: $cms-inspect-sheet-border;
  flex: none;
  padding: 8px 16px;
}

.cms-inspect-sheet__button {
  background-color: #5560cb;
  color: white;
  border-radius: 4px;
  width: 100%;
  display: block;
  text-align: center;
  padding: 8px 16px;
}

.cms-inspect-sheet__button--text {
  background: transparent;
  color: #5560cb;
}

.cms-inspect-sheet__row {
  display: flex;
  align-items: center;
  padding: 8px 0;

  & + & {
    border-top: $cms-inspect-sheet-border;
  }
}

.cms-inspect-sheet__row__label {
  font-weight: bold;
  flex: auto;
}

.cms-inspect-sheet__row__value {
  text-align: right;
  flex: auto;
  margin-left: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
