CREATE TABLE group_members (
    group_id bigint NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, user_id)
);