# vue-phoenix [![Build Status](https://travis-ci.org/propelinc/vue-phoenix.svg?branch=master)](https://travis-ci.org/propelinc/vue-phoenix) [![MIT](https://img.shields.io/badge/License-MIT%20License-blue.svg)](https://raw.githubusercontent.com/propelinc/vue-phoenix/master/LICENSE)

Client integration for the phoenix CMS server for Vue.js apps.

## Installation

```
npm install --save git@github.com:propelinc/vue-phoenix.git
```

## Integration

```typescript
import Vue, { VNode } from 'vue';
import CmsPlugin from 'vue-phoenix';

Vue.use(CmsPlugin, {
  baseUrl: process.env.VUE_APP_SERVER,
  getSiteVars: (): object => ({ test: '1' }),
});
```

## Basic usage

```html
<cms-zone zone-id="5" />
```

## Advanced usage

```html
<cms-zone zone-id="5">
 <div class="cms-loading">Loading...</div>
 <div class="cms-error">Error</div>
 <div class="cms-offline">Offline</div>
</cms-zone>
```

## Plugin options

* `baseUrl`: URL for the phoenix server.
* `router`: Router object (required for badging support).
* `getSiteVars`: Function that provides query parameters.
* `getCaptable`: Overrides how the captable is restored.
* `setCaptable`: Overrides how the captable is saved.
* `checkConnection`: Overrides how network connection status is assessed.

## Project setup
```
npm install
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Run your unit tests
```
npm run test:unit
```
