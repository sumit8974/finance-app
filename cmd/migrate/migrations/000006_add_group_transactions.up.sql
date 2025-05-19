CREATE TABLE group_transactions (
    id bigserial PRIMARY KEY,
    group_id bigserial NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id bigserial NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- user who created the transaction
    category_id bigserial REFERENCES categories(id),
    amount decimal(15,2) NOT NULL,
    transaction_type varchar(10) NOT NULL, -- 'income' or 'expense'
    description text,
    transaction_date timestamp(0) with time zone NOT NULL DEFAULT NOW(),
    created_at timestamp(0) with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp(0) with time zone NOT NULL DEFAULT NOW()
);