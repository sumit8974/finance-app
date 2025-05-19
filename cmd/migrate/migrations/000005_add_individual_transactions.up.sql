CREATE TABLE individual_transactions (
    id bigserial PRIMARY KEY,
    user_id bigserial NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id bigserial REFERENCES categories(id),
    amount decimal(15,2) NOT NULL,
    transaction_type varchar(10) NOT NULL, -- 'income' or 'expense'
    description text,
    transaction_date timestamp(0) with time zone NOT NULL DEFAULT NOW(),
    created_at timestamp(0) with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp(0) with time zone NOT NULL DEFAULT NOW()
);