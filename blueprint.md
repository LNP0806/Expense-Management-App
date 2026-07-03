# SmartSpend AI - System Blueprint

> **Version:** 1.0
> **Architecture:** Monorepo
> **Frontend:** React + Vite + Tailwind CSS
> **Backend:** Node.js + Express.js
> **Database:** PostgreSQL
> **Authentication:** JWT (Access Token + Refresh Token)
> **AI:** Google Gemini API
> **Media Storage:** Cloudinary

---

# 1. Project Structure (Monorepo)

```text
smartspend-ai/
│
├── backend/                          # Node.js & Express.js Application
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── transaction.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── budget.routes.js
│   │   │   └── ai.routes.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   └── validate.js
│   │   │
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── utils/
│   │       ├── db-transaction.js
│   │       └── cloudinary.js
│   │
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/                         # React Vite + Tailwind CSS
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   ├── App.jsx
    │   └── main.jsx
    │
    ├── tailwind.config.js
    └── package.json
```

---

# 2. Backend Architecture

Backend được chia theo mô hình nhiều tầng (Layered Architecture).

```
Client
    │
    ▼
Routes
    │
    ▼
Controllers
    │
    ▼
Services
    │
    ▼
Repositories
    │
    ▼
PostgreSQL
```

## Layer Responsibilities

### Routes

* Mapping endpoint
* Áp dụng middleware
* Chuyển request đến Controller

---

### Controllers

Controller chỉ thực hiện:

* nhận request
* validate request
* gọi service
* trả response

Không xử lý business logic.

---

### Services

Chứa toàn bộ business logic.

Ví dụ:

* tạo transaction
* tính statistics
* gọi Gemini
* upload Cloudinary
* xử lý Budget

---

### Repositories

Chỉ chứa SQL thuần.

Ví dụ:

```sql
SELECT
INSERT
UPDATE
DELETE
JOIN
GROUP BY
SUM
COUNT
```

---

### Schemas

Validation sử dụng **Zod**.

Ví dụ:

* Login
* Register
* Create Transaction
* Create Budget

---

### Utils

Các helper dùng chung:

* Transaction Manager
* Date helpers
* Currency formatter
* Error helpers

---

# 3. Statistics Hub

Dashboard sẽ hiển thị hai nhóm thống kê.

---

## 3.1 KPI Cards

### Total Balance

```
Total Income
-
Total Expense
```

---

### Monthly Expense

```
SUM(amount)

WHERE

type = EXPENSE

AND

created_at nằm trong tháng hiện tại
```

---

### Monthly Income

```
SUM(amount)

WHERE

type = INCOME
```

---

### Saving Rate

```
Saving Rate = (Total Income - Total Expense) / Total Income × 100%
```

---

# 3.2 Charts

## Donut Chart

Hiển thị cơ cấu chi tiêu theo danh mục.

SQL:

```sql
SELECT
category_id,
SUM(amount)
FROM transactions
WHERE type='EXPENSE'
GROUP BY category_id;
```

Ví dụ:

* Food
* Shopping
* Bills
* Entertainment
* Transport

---

## 7-Day Spending Chart

Thống kê tổng tiền tiêu từng ngày.

SQL:

```sql
GROUP BY DATE(created_at)
```

Giúp người dùng phát hiện:

* cuối tuần tiêu nhiều
* giữa tuần tiêu ít
* xu hướng tiêu dùng

---

# 4. Frontend UX Blueprint

Thiết kế theo Mobile First.

---

# Navigation

## Mobile

Bottom Navigation

```
Dashboard

Ledger

Quick Capture (Floating Button)

Budgets
```

---

## Desktop

Sidebar

```
Dashboard

Ledger

Quick Capture

Budgets
```

---

# 5. Screen Design

---

## Quick Capture

Đây là tính năng trọng tâm.

### Flow

```
Click Camera
      │
      ▼
Open Device Camera
      │
      ▼
Capture Receipt
      │
      ▼
Loading Scanner Animation
      │
      ▼
Upload Image
      │
      ▼
Gemini OCR
      │
      ▼
Preview Bottom Sheet
      │
      ▼
Confirm
      │
      ▼
Save Transaction
```

---

### Loading Animation

Hiệu ứng:

* laser scanning
* glowing border
* progress indicator

---

### Preview Modal

Bottom Sheet.

Auto-fill:

* Amount
* Title
* Category
* Transaction Type

Người dùng chỉ cần:

```
Confirm
```

là hoàn tất.

---

## Dashboard

### Mobile Layout

```
KPI Cards

↓

Donut Chart

↓

7-Day Chart

↓

Recent Transactions
```

Vertical Scroll.

---

### Desktop Layout

```
---------------------------------------------
| KPI + Trend | Donut | Recent Transactions |
---------------------------------------------
```

3 cột.

---

## Budgets

Hiển thị các Budget Card.

Ví dụ:

```
Food

███████████░░░░░

75%
```

---

### Progress Color Logic

| Progress  | Color  |
| --------- | ------ |
| <80%      | Green  |
| 80% - 99% | Orange |
| >=100%    | Red    |

---

### Status

Green

```
Normal
```

Orange

```
Warning
```

Red

```
Over Budget
```

---

# 6. REST API Matrix

## Authentication

### Register

```
POST

/api/v1/auth/register
```

Action

```
INSERT users
```

Password:

```
bcrypt
```

---

### Login

```
POST

/api/v1/auth/login
```

Return

```
Access Token

Refresh Token
```

---

# Categories

## GET

```
/api/v1/categories
```

Query

```
user_id

OR

public categories
```

---

## POST

```
/api/v1/categories
```

Insert custom category.

---

# Transactions

## POST

```
/api/v1/transactions
```

Features

* Upload receipt
* Multer
* Cloudinary

---

## GET

```
/api/v1/transactions
```

Supports

* Search
* Filter
* Pagination

Dynamic SQL

```
WHERE

LIMIT

OFFSET

ORDER BY
```

---

# Budgets

## GET

```
/api/v1/budgets
```

Return

* Budget
* Current Spending
* Remaining
* Progress

---

## POST

```
/api/v1/budgets
```

Create new budget.

---

# AI

## Parse

```
POST

/api/v1/ai/parse
```

Backend sẽ:

1.

Upload ảnh

↓

Cloudinary

↓

2.

Đọc Categories của User

↓

3.

Gửi Prompt đến Gemini

↓

4.

Nhận JSON

↓

5.

Map Category Name → Category ID

↓

6.

Trả JSON sạch về Frontend

---

# 7. AI Integration Flow

```text
User
 │
 │ Chụp hóa đơn / Nhập text
 ▼
Frontend
 │
 │ FormData / Text
 ▼
Backend Express
 │
 ├──────────────► Upload Cloudinary
 │
 ▼
Fetch User Categories
 │
 ▼
Gemini Prompt Engine
 │
 ▼
Structured JSON
 │
 ▼
Backend Mapping
 │
 ▼
Category Name
        │
        ▼
Category ID
 │
 ▼
Frontend Preview
 │
 ▼
Confirm Save
 │
 ▼
POST /transactions
 │
 ▼
PostgreSQL
```

---

# 8. Security

Authentication:

* JWT Access Token
* JWT Refresh Token

Authorization Header

```
Authorization: Bearer <access_token>
```

Password

```
bcrypt
```

Validation

```
Zod
```

File Upload

```
Multer
```

Media Storage

```
Cloudinary
```

---

# 9. Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* Context API

---

## Backend

* Node.js
* Express.js
* PostgreSQL
* Multer
* Cloudinary
* JWT
* bcrypt
* Zod

---

## AI

* Google Gemini API

---

# 10. Development Principles

* Mobile-first responsive design.
* Layered architecture (Route → Controller → Service → Repository).
* Repository chỉ chứa SQL thuần.
* Business logic tập trung tại Service.
* Validation bằng Zod.
* JWT cho xác thực và phân quyền.
* PostgreSQL là nguồn dữ liệu chính.
* Cloudinary lưu trữ ảnh hóa đơn.
* Gemini AI hỗ trợ OCR và phân tích nội dung hóa đơn.
* RESTful API thống nhất cho Frontend và các nền tảng Mobile trong tương lai.
