import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(
  readFileSync(resolve(root, 'openapi/openapi.json'), 'utf8'),
);
const generated = readFileSync(
  resolve(root, 'src/api/generated/openapi.ts'),
  'utf8',
);
const source = ts.createSourceFile(
  'openapi.ts',
  generated,
  ts.ScriptTarget.Latest,
  true,
);
const paths = source.statements.find(
  (node) => ts.isInterfaceDeclaration(node) && node.name.text === 'paths',
);
if (!paths) throw new Error('Generated paths interface is missing');
const operations = source.statements.find(
  (node) => ts.isInterfaceDeclaration(node) && node.name.text === 'operations',
);
const components = source.statements.find(
  (node) => ts.isInterfaceDeclaration(node) && node.name.text === 'components',
);
const schemas = components?.members.find(
  (member) => member.name?.text === 'schemas',
);
if (!operations || !schemas || !ts.isTypeLiteralNode(schemas.type)) {
  throw new Error('Generated operations or schemas are missing');
}

const methods = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
]);
const members = new Map(
  paths.members.map((member) => [member.name?.text, member]),
);
let operationCount = 0;

for (const [path, definition] of Object.entries(spec.paths)) {
  const generatedPath = members.get(path);
  if (!generatedPath || !ts.isTypeLiteralNode(generatedPath.type)) {
    throw new Error(`Missing generated path: ${path}`);
  }
  const generatedMethods = new Map(
    generatedPath.type.members.map((member) => [member.name?.text, member]),
  );
  for (const method of Object.keys(definition).filter((key) =>
    methods.has(key),
  )) {
    const entry = generatedMethods.get(method);
    if (!entry || entry.type?.kind === ts.SyntaxKind.NeverKeyword) {
      throw new Error(
        `Missing generated operation: ${method.toUpperCase()} ${path}`,
      );
    }
    operationCount += 1;
  }
}

if (members.size !== Object.keys(spec.paths).length) {
  throw new Error(
    `Path count differs: spec=${Object.keys(spec.paths).length}, generated=${members.size}`,
  );
}
if (operations.members.length !== operationCount) {
  throw new Error(
    `Operation count differs: spec=${operationCount}, generated=${operations.members.length}`,
  );
}
const schemaNames = new Set(
  schemas.type.members.map((member) => member.name?.text),
);
for (const name of Object.keys(spec.components.schemas)) {
  if (!schemaNames.has(name))
    throw new Error(`Missing generated schema: ${name}`);
}
if (schemaNames.size !== Object.keys(spec.components.schemas).length) {
  throw new Error('Generated schema count differs from Swagger');
}
console.log(
  `OpenAPI coverage OK: ${members.size} paths, ${operationCount} operations, ${schemaNames.size} schemas`,
);
