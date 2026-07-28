const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CATALOG_URL =
  'https://raw.githubusercontent.com/brave/adblock-resources/master/filter_lists/list_catalog.json';
const RESOURCES_URL =
  'https://raw.githubusercontent.com/brave/adblock-resources/master/dist/resources.json';
const DIST_DIR = path.join(__dirname, '..', 'dist');
const CUSTOM_LISTS_DIR = path.join(__dirname, '..', 'custom-lists');
const CUSTOM_RESOURCES_DIR = path.join(__dirname, '..', 'custom-resources');

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildHeader(entry) {
  const title = entry.title.replace(/^Brave /, '');
  return [
    `! Title: Shiiren - ${title}`,
    '! Expires: 4 hours',
    '! Homepage: https://github.com/crayka/shiiren-adblock-lists',
  ].join('\n');
}

async function buildEntry(entry) {
  const parts = [buildHeader(entry)];
  for (const source of entry.sources || []) {
    try {
      const text = await fetchText(source.url);
      parts.push(`! ---- source: ${source.title || source.url} (${source.url}) ----`);
      parts.push(text.trimEnd());
    } catch (err) {
      console.error(`WARNING: skipping source for "${entry.title}": ${err.message}`);
    }
  }
  return parts.join('\n\n');
}

async function main() {
  console.log('Fetching catalog:', CATALOG_URL);
  const catalogJson = await fetchText(CATALOG_URL);
  const catalog = JSON.parse(catalogJson);

  const defaultEntries = catalog.filter((e) => e.default_enabled === true);
  console.log(`Found ${defaultEntries.length} default-enabled filter lists.`);

  fs.mkdirSync(DIST_DIR, { recursive: true });

  const manifestEntries = [];

  for (const entry of defaultEntries) {
    const slug = slugify(entry.uuid === 'default' ? 'default' : entry.title);
    console.log(`Building "${entry.title}" -> ${slug}.txt`);
    const combined = await buildEntry(entry);
    const outPath = path.join(DIST_DIR, `${slug}.txt`);
    fs.writeFileSync(outPath, combined, 'utf8');

    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    manifestEntries.push({
      uuid: entry.uuid,
      title: entry.title,
      file: `${slug}.txt`,
      sha256: hash,
      bytes: Buffer.byteLength(combined, 'utf8'),
      sourceCount: (entry.sources || []).length,
    });
  }

  for (const name of fs.readdirSync(CUSTOM_LISTS_DIR)) {
    const source = fs.readFileSync(path.join(CUSTOM_LISTS_DIR, name), 'utf8');
    const header = [
      `! Title: ${name.replace(/\.txt$/, '')}`,
      '! Expires: 4 hours',
      '! Homepage: https://github.com/crayka/shiiren-adblock-lists',
    ].join('\n');
    const combined = `${header}\n\n${source.trimEnd()}\n`;
    fs.writeFileSync(path.join(DIST_DIR, name), combined, 'utf8');
    manifestEntries.push({
      uuid: name,
      title: name,
      file: name,
      sha256: crypto.createHash('sha256').update(combined).digest('hex'),
      bytes: Buffer.byteLength(combined, 'utf8'),
      sourceCount: 0,
    });
    console.log(`Built custom list -> ${name}`);
  }

  console.log('Fetching scriptlet resources:', RESOURCES_URL);
  let resourcesInfo = null;
  try {
    const resourcesJson = await fetchText(RESOURCES_URL);
    const resources = JSON.parse(resourcesJson);

    for (const name of fs.readdirSync(CUSTOM_RESOURCES_DIR)) {
      const content = fs.readFileSync(path.join(CUSTOM_RESOURCES_DIR, name), 'utf8');
      resources.push({
        name,
        aliases: [],
        kind: { mime: 'application/javascript' },
        content: Buffer.from(content, 'utf8').toString('base64'),
      });
      console.log(`Added custom resource -> ${name}`);
    }

    const merged = JSON.stringify(resources);
    fs.writeFileSync(path.join(DIST_DIR, 'resources.json'), merged, 'utf8');
    resourcesInfo = {
      file: 'resources.json',
      sha256: crypto.createHash('sha256').update(merged).digest('hex'),
      bytes: Buffer.byteLength(merged, 'utf8'),
    };
  } catch (err) {
    console.error(`WARNING: skipping scriptlet resources: ${err.message}`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    catalogUrl: CATALOG_URL,
    lists: manifestEntries,
    resources: resourcesInfo,
  };
  fs.writeFileSync(
    path.join(DIST_DIR, 'version.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  );

  console.log('Done. Wrote', manifestEntries.length, 'list file(s) + version.json');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
