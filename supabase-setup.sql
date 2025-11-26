-- Supabase 테이블 생성 SQL
-- Supabase 대시보드의 SQL Editor에서 실행하세요

-- memos 테이블 생성
CREATE TABLE IF NOT EXISTS memos (
    id SERIAL PRIMARY KEY,
    password VARCHAR(255) NOT NULL UNIQUE,
    content TEXT,
    duration_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_memos_password ON memos(password);
CREATE INDEX idx_memos_expires_at ON memos(expires_at);

-- Row Level Security (RLS) 비활성화 (간단한 앱이므로)
ALTER TABLE memos DISABLE ROW LEVEL SECURITY;

-- 만료된 메모 자동 삭제 함수
CREATE OR REPLACE FUNCTION delete_expired_memos()
RETURNS void AS $$
BEGIN
    DELETE FROM memos WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 주기적으로 만료된 메모 삭제 (선택사항)
-- Supabase Dashboard > Database > Extensions에서 pg_cron 활성화 후 사용
-- SELECT cron.schedule('delete-expired-memos', '*/5 * * * *', 'SELECT delete_expired_memos();');
