CREATE TABLE groups (
    id bigserial PRIMARY KEY,
    name varchar(100) NOT NULL,
    created_by bigint NOT NULL REFERENCES users(id),
    created_at timestamp(0) with time zone NOT NULL DEFAULT NOW()
);