-- ============================================================
-- DỌN DẸP HỆ THỐNG (Dùng khi cần reset database ở Local)
-- ============================================================
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_modified_column CASCADE;

-- Kích hoạt extension sinh UUID nếu cần dùng uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- KÍCH HOẠT TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT (POSTGRESQL STANDARD)
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ============================================================
-- 1. BẢNG NGƯỜI DÙNG (USERS)
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL -- Phục vụ xóa mềm tài khoản
);

CREATE TRIGGER update_users_modtime 
BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 2. BẢNG DANH MỤC CHI TIÊU (CATEGORIES)
-- ============================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Khớp UUID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TRIGGER update_categories_modtime 
BEFORE UPDATE ON categories 
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 3. BẢNG GIAO DỊCH (TRANSACTIONS)
-- ============================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Khớp UUID
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- Khớp UUID
    title VARCHAR(255) NOT NULL,
    description TEXT, -- Khai báo 1 lần duy nhất
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    image_url TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL -- Hóa đơn bị xóa mềm sẽ lưu ngày ở đây
);

CREATE TRIGGER update_transactions_modtime 
BEFORE UPDATE ON transactions 
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 4. BẢNG NGÂN SÁCH HẠN MỨC (BUDGETS)
-- ============================================================
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Khớp UUID
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE, -- Khớp UUID và cho phép Null (theo DB mới chỉnh sửa)
    title VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT check_budget_dates CHECK (start_date <= end_date)
);

CREATE TRIGGER update_budgets_modtime 
BEFORE UPDATE ON budgets 
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 5. TỐI ƯU HÓA HIỆU NĂNG VỚI PARTIAL INDEXES (ĐIỂM CỘNG SENIOR)
-- ============================================================
CREATE INDEX idx_transactions_active_user_date 
ON transactions(user_id, transaction_date) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_budgets_active_user_date 
ON budgets(user_id, start_date, end_date) 
WHERE deleted_at IS NULL;

-- ============================================================
-- DATA MẪU DANH MỤC HỆ THỐNG BAN ĐẦU
-- ============================================================
INSERT INTO categories (name, user_id) VALUES
('Ăn uống', NULL),
('Di chuyển', NULL),
('Mua sắm', NULL),
('Giải trí', NULL),
('Hóa đơn & Tiện ích', NULL),
('Học tập', NULL),
('Khác', NULL);