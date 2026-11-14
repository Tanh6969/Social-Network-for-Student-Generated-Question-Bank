// Vercel Edge Function: chuyển tiếp /api/v1/* sang backend.
//
// Không dùng rewrite thẳng sang backend được vì Vercel giữ nguyên header
// Origin của trình duyệt (https://<app>.vercel.app), và backend chưa cho phép
// domain đó trong CORS nên trả 403 "Invalid CORS request". Ở đây bỏ Origin đi,
// backend coi như một request server-to-server (giống Vite proxy lúc dev).

export const config = { runtime: 'edge' };

const BACKEND = 'https://snsqb.duckdns.org/api/v1';

const DROP_REQUEST_HEADERS = [
  'host',
  'origin',
  'referer',
  'connection',
  'content-length',
];
// Edge runtime đã giải nén body nên không được chuyển lại các header này.
const DROP_RESPONSE_HEADERS = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
];

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') ?? '';
  url.searchParams.delete('path');
  const target = `${BACKEND}/${path}${url.search}`;

  const headers = new Headers(request.headers);
  for (const name of DROP_REQUEST_HEADERS) headers.delete(name);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstream.headers);
  for (const name of DROP_RESPONSE_HEADERS) responseHeaders.delete(name);
  // Cookie refreshToken (Path=/api/v1/auth) phải thuộc domain Vercel, nên bỏ
  // thuộc tính Domain nếu backend có đặt.
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append(
      'set-cookie',
      cookie.replace(/;\s*Domain=[^;]*/i, ''),
    );
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
