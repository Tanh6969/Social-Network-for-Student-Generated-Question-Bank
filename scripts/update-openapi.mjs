import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const source = 'https://snsqb.duckdns.org/api/v1/docs/openapi.json';
const destination = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../openapi/openapi.json',
);
const response = await fetch(source);
if (!response.ok)
  throw new Error(`Swagger download failed: HTTP ${response.status}`);

const spec = await response.json();
if (
  !spec.openapi?.startsWith('3.') ||
  !spec.paths ||
  !spec.components?.schemas
) {
  throw new Error('Downloaded file is not the expected OpenAPI contract');
}

writeFileSync(destination, `${JSON.stringify(spec)}\n`);
console.log(`Updated ${destination} from ${source}`);
