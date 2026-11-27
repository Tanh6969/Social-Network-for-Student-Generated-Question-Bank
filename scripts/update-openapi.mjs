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

/**
 * Springdoc sinh đa hình dạng: cha có oneOf [con...], mỗi con lại allOf [cha, ...].
 * openapi-typescript biến cặp này thành kiểu tự tham chiếu (TS2502), nên bỏ
 * tham chiếu ngược con → cha; con đã tự khai báo đủ trường (kể cả `type`).
 */
function breakPolymorphicCycles(schemas) {
  for (const [parent, schema] of Object.entries(schemas)) {
    const parentRef = `#/components/schemas/${parent}`;
    for (const option of schema.oneOf ?? []) {
      const child = schemas[option.$ref?.split('/').pop()];
      if (!child?.allOf) continue;
      child.allOf = child.allOf.filter((part) => part.$ref !== parentRef);
    }
  }
}
breakPolymorphicCycles(spec.components.schemas);

writeFileSync(destination, `${JSON.stringify(spec)}\n`);
console.log(`Updated ${destination} from ${source}`);
