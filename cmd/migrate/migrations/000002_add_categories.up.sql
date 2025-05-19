CREATE TABLE IF NOT EXISTS categories (
    id bigserial PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL, -- 'income' or 'expense'
    created_at timestamp(0) with time zone NOT NULL DEFAULT NOW()
);