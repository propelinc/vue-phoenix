<template>
  <div>
    <slot :action="action" />
  </div>
</template>

<script lang="ts">
import { AxiosRequestConfig } from 'axios';
import { Vue, Component } from 'vue-property-decorator';

import cmsClient from '../cmsHttp';

@Component({ name: 'cms-remote-action' })
export default class CmsRemoteAction extends Vue {
  private async action(options: AxiosRequestConfig): Promise<void> {
    try {
      this.$emit('loading');
      const response = await cmsClient.cmsAction(options);
      this.$emit('success', response);
    } catch (err) {
      this.$emit('error', err);
    } finally {
      this.$emit('done');
    }
  }
}
</script>
