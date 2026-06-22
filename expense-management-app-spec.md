# Tài liệu Đặc tả Dự án (Project Specification)
## Ứng dụng Quản lý Chi tiêu Tích hợp AI (SmartSpend AI)

Dự án này là một ứng dụng quản lý chi tiêu cá nhân, sử dụng trí tuệ nhân tạo (AI) để tự động hóa việc nhập liệu và phân tích thói quen tài chính của người dùng.

---

## 1. Tổng quan Công nghệ Backend (Backend Tech Stack)
- **Language:** JavaScript
- **Runtime Environment:** Node.js
- **Framework:** Express.js (Thiết kế theo cấu trúc Phân tầng - Layered Architecture)
- **Database:** PostgreSQL
- **AI Integration:** Google Gemini API
- **File Storage:** Cloudinary (Lưu trữ ảnh hóa đơn/giao dịch)

---

## 2. Đặc tả Chi tiết Tính năng (Scope & MVP Breakdown)

### Lớp 1: Tính năng Cốt lõi (Core Features)

#### 1. Quản lý Người dùng (Authentication & Authorization)
- **Đăng ký (Register):** Mã hóa mật khẩu bằng `bcrypt` trước khi lưu vào DB.
- **Đăng nhập (Login):** Xác thực thông tin, tạo và trả về mã `JWT Token` (Access Token & Refresh Token).
- **Phân quyền (Authorization):** Sử dụng Middleware để kiểm tra JWT hợp lệ trước khi cho phép truy cập các tài nguyên cá nhân.

#### 2. Quản lý Danh mục (Categories)
- Cung cấp danh mục mặc định (Ăn uống, Di chuyển, Mua sắm, Giải trí, Hóa đơn).
- Cho phép người dùng tùy biến (CRUD): Tạo thêm, sửa tên, hoặc xóa danh mục riêng của họ.

#### 3. Quản lý Giao dịch (Transactions)
- **Nghiệp vụ:** Ghi nhận các khoản Thu (Income) và Chi (Expense).
- **Thuộc tính:** `id`, `user_id`, `category_id`, `amount` (số tiền), `transaction_date` (ngày giao dịch), `notes` (ghi chú), `image_url` (đường dẫn ảnh đi kèm).
- **Xử lý tệp tin:** Tích hợp `Multer` làm middleware nhận file hình ảnh từ frontend, upload lên dịch vụ đám mây Cloudinary và lưu URL vào PostgreSQL.

#### 4. Thiết lập Ngân sách (Budgets)
- Người dùng có thể đặt hạn mức chi tiêu cho từng Danh mục hoặc cho cả tháng (ví dụ: Ngân sách Ăn uống tháng 6 là 3.000.000đ).
- **Logic Backend:** Mỗi khi có giao dịch Chi mới được thêm vào, hệ thống tự động tính tổng tiền đã tiêu trong tháng của danh mục đó. Nếu vượt quá (hoặc đạt 80-90%) mức giới hạn, hệ thống sẽ trả về cảnh báo (flag alert) trong response.

---

### Lớp 2: Tính năng AI

#### 1. AI Chatbot / Nhập liệu kịch bản Text (NLP Transaction Parser)
- **Endpoint:** `POST /api/v1/ai/parse-transaction`
- **Luồng xử lý:** 1. Frontend gửi chuỗi text người dùng nhập (ví dụ: *"Trưa nay ăn bún chả hết 45k"*).
  2. Backend nhận chuỗi text, áp dụng **Prompt Engineering** để gửi request tới API của AI.
  3. AI phân tích ngữ nghĩa và trả về cấu trúc **Structured JSON** chính xác:
     ```json
     {
       "amount": 45000,
       "type": "expense",
       "predicted_category": "Ăn uống",
       "notes": "Ăn bún chả"
     }
     ```
  4. Backend map `predicted_category` với ID danh mục trong database và tự động tạo giao dịch mới mà không cần người dùng nhập tay từng ô.

#### 2. Báo cáo & Phân tích Tài chính Thông minh (Monthly AI Financial Advisor)
- **Endpoint:** `GET /api/v1/ai/monthly-report`
- **Luồng xử lý:**
  1. Cuối tháng, Backend thực hiện câu lệnh SQL `SUM`, `GROUP BY` để tổng hợp dữ liệu chi tiêu (Tổng chi, Chi nhiều nhất ở danh mục nào, xu hướng tăng giảm so với tháng trước) thành một file JSON gọn gàng.
  2. Backend gửi dữ liệu JSON này kèm một hệ thống Prompt định hình ngữ cảnh (Contextual Prompt) qua API cho AI.
  3. AI đóng vai trò một chuyên gia tài chính cá nhân, phân tích dữ liệu và trả về văn bản nhận xét (Insights) và lời khuyên (Advice) tối ưu hóa ngân sách.

---