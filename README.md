# shiiren-adblock-lists

An automated mirror/build of the public filter lists and scriptlet resources
Shiiren's ad blocker uses.

The actual filter-list data is public: EasyList, EasyPrivacy, uBlock Origin's
own lists, a public malware-domain list, and a few small supplementary lists.

This repo re-fetches that catalog, its source lists, and the resources
library on a schedule (`.github/workflows/update-lists.yml`, every 4 hours),
concatenates whatever is marked `default_enabled` in the catalog, and
publishes the result here under `dist/`. Shiiren's browser fetches from here
directly.

## Layout

- `scripts/build-lists.js` -- fetches the catalog + all source lists + the
  resources library, writes `dist/<list>.txt`, `dist/resources.json`, and
  `dist/version.json`.
- `dist/version.json` -- a small manifest (sha256 per file, byte size,
  generation timestamp) so a client can cheaply check "did anything change"
  before downloading the full lists.
- `.github/workflows/update-lists.yml` -- the scheduled job. Also runnable
  manually from the Actions tab (`workflow_dispatch`).

## Running locally

```
npm run build
```
