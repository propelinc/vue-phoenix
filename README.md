# vue-phoenix [![Build Status](https://travis-ci.org/propelinc/vue-phoenix.svg?branch=master)](https://travis-ci.org/propelinc/vue-phoenix) [![MIT](https://img.shields.io/badge/License-MIT%20License-blue.svg)](https://raw.githubusercontent.com/propelinc/vue-phoenix/master/LICENSE)

Client integration for the phoenix CMS server for Vue.js apps.

## Installation

```
npm install --save git@github.com:propelinc/vue-phoenix.git
```

## Integration

```typescript
import Vue, { VNode } from 'vue';
import phoenix from 'vue-phoenix';

const baseUrl = 'https://phoenix-url';

Vue.use(phoenix.planout, {
  appName: 'freshebt',
  baseUrl: baseUrl,
  logExposure: console.log,
});

Vue.use(phoenix.cms, {
  router,
  baseUrl: baseUrl,
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


## Plugin options (cms)

* `baseUrl`: URL for the phoenix server.
* `router`: Router object (required for badging support).
* `getExtraArgs`: Function that provides query parameters.
* `getCaptable`: Overrides how the captable is restored.
* `setCaptable`: Overrides how the captable is saved.
* `checkConnection`: Overrides how network connection status is assessed.


## Plugin options (planout)

* `appName`: App name used for planout namespace management.
* `baseUrl`: URL for the phoenix server.
* `logExposure`: Function called when planout logs exposure for a variant.
* `localOverrides`: Use to override experiment and variable assignment during development.


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
