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

Đăng nhập bằng email và mật khẩu; vai trò được xác định từ tài khoản sau khi xác thực, không chọn vai trò trên form. Tài khoản demo cũng đăng nhập qua form này bằng mật khẩu chung `Demo@2026`; mở mục **Tài khoản dùng thử** trên trang đăng nhập để chọn email. Tài khoản không thuộc danh sách demo được xác thực qua backend. Các màn hình ngoài đăng nhập vẫn dùng mock. Vai trò của tài khoản thật lấy từ phản hồi backend, không đoán theo email. FE không gọi API admin. Token chỉ giữ trong bộ nhớ phiên trang; tải lại trang sẽ cần đăng nhập lại. Chưa có luồng refresh token.

Trong bản demo, Feed và Profile hỗ trợ tạo, sửa, xóa bài viết, bình luận và trả lời một cấp. Nội dung bài viết giới hạn 500 từ; bộ đếm `N/500` ở góc dưới vùng nhập chuyển đỏ khi đạt ngưỡng, đồng thời không cho đăng bài quá dài. Giới hạn an toàn 5.000 ký tự tổng cộng và 64 ký tự cho mỗi từ được giữ trong xử lý nhập liệu, không hiển thị thường trực trên giao diện. Bài dài có nút **Xem thêm**. Bài của bản thân và bạn bè được ưu tiên, rồi mới sắp theo thời gian trong từng nhóm. Feed chỉ hiển thị số bình luận; mở chi tiết bài viết để xem toàn bộ bình luận và trả lời. Sau khi đăng/sửa/xóa, người dùng ở lại trang đang xem và thấy danh sách được cập nhật.

Form bài viết nhận tối đa 10 ảnh, một video và 10 tài liệu từ máy. Nút **Ảnh/Tài liệu** trong Feed cho chọn ảnh hoặc tài liệu; nút **Video học tập** chọn video. Nút **Đề xuất câu hỏi** vẫn mở form đề xuất. Mỗi ảnh tối đa 4 MB; video demo tối đa 10 MB; tài liệu PDF, TXT, Word, Excel hoặc PowerPoint tối đa 15 MB. PDF và TXT có thể xem ngay trong giao diện; các định dạng Office có thể mở bằng ứng dụng hỗ trợ hoặc tải xuống. Ảnh trong Feed được căn giữa khung; trình xem lớn hiển thị trọn ảnh và cho chuyển ảnh, phóng to, xem video cùng bình luận. Ảnh đại diện và ảnh bìa cũng có thể thay từ máy và mở trong trình xem này. Bài viết, ảnh cá nhân, quan hệ bạn bè và media vẫn chỉ nằm trong bộ nhớ phiên trình duyệt; tải lại trang sẽ trở về dữ liệu demo ban đầu.

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
