# SQB frontend

Frontend React 19 + Vite + TypeScript của Social Network for Student-Generated Question Bank. Backend nằm ở dự án khác và cung cấp [Swagger](https://snsqb.duckdns.org/api/v1/swagger-ui/index.html#/).

## Chạy dự án

```bash
npm ci
npm run dev
```

Mặc định FE gọi `/api/v1`; Vite proxy đường dẫn này tới `https://snsqb.duckdns.org` khi phát triển. Nếu deploy FE và API khác origin, đặt `VITE_API_BASE_URL` trong `.env.local` theo `.env.example` và cấu hình CORS hoặc reverse proxy ở môi trường deploy.

## Cấu trúc

```text
src/app/              App shell, URL routes và providers
src/api/              Typed client, auth adapter, token, multipart và realtime contract
src/api/generated/    Types cho toàn bộ OpenAPI REST; không sửa tay
src/features/         Màn hình và logic theo tính năng
src/features/demo/    Context và các modal của bản demo hiện có
src/shared/           Component dùng chung
src/mocks/            Dữ liệu demo, tách khỏi API thật
openapi/              Snapshot đặc tả backend
docs/                 Trạng thái tích hợp
```

Mọi màn hình hiện có vẫn có thể xem bằng hai nút **Demo** trên trang đăng nhập. Chỉ login/logout của giao diện thật đã nối backend; các màn khác vẫn dùng mock. Vai trò của tài khoản thật lấy từ phản hồi backend, không đoán theo email. FE không gọi API admin. Token chỉ giữ trong bộ nhớ phiên trang; tải lại trang sẽ cần đăng nhập lại. Chưa có luồng refresh token.

## Sinh code từ Swagger

```bash
npm run generate:api  # Sinh lại từ openapi/openapi.json
npm run check:api     # Đối chiếu path và method với snapshot
npm run update:api    # Tải Swagger mới rồi sinh lại; cần truy cập mạng
```

`openapi-typescript` sinh `paths`, `operations` và `components` cho **toàn bộ 146 REST operations**. `openapi-fetch` trong `src/api/client.ts` là client có kiểm tra kiểu theo những định nghĩa đó; các tính năng dùng đúng path Swagger khi được nối backend. API admin vẫn có trong mã sinh để phản ánh đầy đủ đặc tả, nhưng không được gọi trong app. [Bảng trạng thái tích hợp](docs/api-integration.md) ghi rõ phần nào đã nối thật.

Giao thức WebSocket STOMP được Swagger mô tả bằng văn bản nên không được công cụ OpenAPI sinh tự động; các destination và trường publish đã biết nằm trong `src/api/realtime-contract.ts`.

## Kiểm tra trước khi merge

```bash
npm run check:api
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
```

TypeScript `strict` áp dụng cho toàn repo. ESLint áp dụng đầy đủ cho mã mới; các component demo cũ tạm được miễn lỗi unused/explicit-any để tránh thay đổi hành vi trong đợt chuyển cấu trúc này.
