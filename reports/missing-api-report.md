# Missing API Report - SmartSpend AI

> Last updated: 2026-07-03
> Status: Frontend using mock data for these endpoints

---

## 1. Dashboard Statistics Summary [x]

- **Feature**: Dashboard KPI Cards (Monthly stats, Saving Rate)
- **Why Required**: Dashboard needs aggregated financial data to display KPI cards.
- **Expected Endpoint**: `GET /transactions/summary` or `GET /dashboard/summary`
- **Expected HTTP Method**: GET
- **Expected Request**: Query params: `month` (optional), `year` (optional)
- **Expected Response**:

```json
{
  "success": true,
  "data": {
    "monthly_income": 12000000,
    "monthly_expense": 8500000,
    "saving_rate": 29.2
  }
}
```

- **Blocking Level**: Critical
- **Current Workaround**: Mock data in `fe/src/api/dashboard.api.js`

---

## 2. Category-wise Expense Breakdown [x]

- **Feature**: Dashboard donut/bar chart showing spending by category.
- **Why Required**: Users need a visual breakdown of expenses by category.
- **Expected Endpoint**: `GET /transactions/category-breakdown` or `GET /dashboard/category-breakdown`
- **Expected HTTP Method**: GET
- **Expected Request**: Query params: `month`, `year`, `type=EXPENSE`
- **Expected Response**:

```json
{
  "success": true,
  "data": [
    {
      "category_id": "uuid",
      "category_name": "Ăn uống",
      "amount": 3200000,
      "percentage": 37.6
    }
  ]
}
```

- **Blocking Level**: Critical
- **Current Workaround**: Mock data in `fe/src/api/dashboard.api.js`

---

## 3. Weekly/Daily Spending Trend [x]

- **Feature**: Dashboard 7-day spending bar chart.
- **Why Required**: Users need to see daily spending trends.
- **Expected Endpoint**: `GET /transactions/daily-spending` or `GET /dashboard/weekly-spending`
- **Expected HTTP Method**: GET
- **Expected Response**:

```json
{
  "success": true,
  "data": [{ "date": "2026-07-01", "amount": 350000 }]
}
```

- **Blocking Level**: Medium
- **Current Workaround**: Mock data with random values in `fe/src/api/dashboard.api.js`

---

## 4. Budget Progress/Spending Data []

- **Feature**: Budget cards showing actual spent amount vs budget.
- **Why Required**: Users need to see how much they've spent against each budget.
- **Expected Endpoint**: `GET /budgets` should include `spent` and `remaining` fields, or `GET /budgets/:id/progress`
- **Expected HTTP Method**: GET
- **Expected Response** (enhanced budget object):

```json
{
  "id": "uuid",
  "title": "Food Budget",
  "amount": 5000000,
  "spent": 3750000,
  "remaining": 1250000,
  "percentage": 75,
}
```

- **Blocking Level**: Critical
- **Current Workaround**: Random mock progress data calculated client-side in `fe/src/pages/BudgetsPage.jsx`

---

## 5. AI Image-based Receipt Parsing

- **Feature**: Upload receipt image for AI OCR analysis.
- **Why Required**: Core feature - users want to scan receipts with camera.
- **Expected Endpoint**: `POST /ai/parse-receipt`
- **Expected HTTP Method**: POST
- **Expected Request**: multipart/form-data with `image` file and optional `caption` text.
- **Expected Response**:

```json
{
  "success": true,
  "data": {
    "amount": 50000,
    "type": "EXPENSE",
    "predicted_category": "Ăn uống",
    "title": "Phở bò",
    "category_id": "uuid",
    "image_url": "cloudinary-url"
  }
}
```

- **Blocking Level**: Medium (currently using text-based caption analysis via `/ai/parse-transaction`)
- **Current Workaround**: Users must enter text description; image is only attached to the final transaction during save in `fe/src/pages/QuickCapturePage.jsx`

---

## 6. Monthly AI Financial Report

- **Feature**: AI-generated monthly spending analysis and financial advice.
- **Why Required**: Specified in project spec as Layer 2 AI feature.
- **Expected Endpoint**: `GET /ai/monthly-report`
- **Expected HTTP Method**: GET
- **Expected Request**: Query params: `month`, `year`
- **Expected Response**:

```json
{
  "success": true,
  "data": {
    "summary": "Tổng quan chi tiêu tháng 7...",
    "insights": ["Insight 1", "Insight 2"],
    "advice": ["Advice 1", "Advice 2"]
  }
}
```

- **Blocking Level**: Low (can be added later)
- **Current Workaround**: Feature not implemented in frontend.

---

## 7. User Profile Management

- **Feature**: View/edit user profile.
- **Why Required**: Users need to update their name, view account details.
- **Expected Endpoint**: `GET /auth/me` and `PATCH /auth/me`
- **Expected HTTP Method**: GET, PATCH
- **Blocking Level**: Low
- **Current Workaround**: Using stored user data from login response.

---

## 8. Refresh Token

- **Feature**: Token refresh without re-login.
- **Why Required**: JWT expires after 1 day, users should not need to re-login.
- **Expected Endpoint**: `POST /auth/refresh`
- **Expected HTTP Method**: POST
- **Expected Request**: { refresh_token: "..." }
- **Expected Response**: { success, data: { token: "new_token" } }
- **Blocking Level**: Medium
- **Current Workaround**: Redirect to login on 401.
