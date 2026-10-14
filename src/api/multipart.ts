/** Pass as `bodySerializer` for the two multipart endpoints in the contract. */
export function multipartBody(body: unknown): FormData {
  if (!body || typeof body !== 'object')
    throw new TypeError('Multipart body must be an object');
  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value == null) continue;
    if (value instanceof Blob) form.append(key, value);
    else if (typeof value === 'string') form.append(key, value);
    else form.append(key, JSON.stringify(value));
  }
  return form;
}
