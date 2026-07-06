-- ============================================================
-- 002: CHẶN GIAO DỊCH TRONG TƯƠNG LAI (FUTURE DATE RESTRICTION)
-- ============================================================

-- 1. Tạo hàm trigger để kiểm tra ngày giao dịch
CREATE OR REPLACE FUNCTION check_transaction_date_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Ngày giao dịch không thể ở tương lai. Ngày hiện tại ở máy chủ: %, Ngày bạn nhập: %', CURRENT_DATE, NEW.transaction_date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Đăng ký trigger cho bảng transactions (chạy trước khi INSERT hoặc UPDATE)
DROP TRIGGER IF EXISTS enforce_transaction_date_limit ON transactions;
CREATE TRIGGER enforce_transaction_date_limit
BEFORE INSERT OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION check_transaction_date_limit();
