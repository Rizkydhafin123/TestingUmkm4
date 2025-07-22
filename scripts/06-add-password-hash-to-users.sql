-- Tambahkan kolom password_hash jika belum ada
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Hapus kolom password lama jika ada (opsional, setelah migrasi data)
-- ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Update data admin yang sudah ada dengan password_hash
-- Gunakan password default 'admin' yang di-hash
-- Pastikan Anda menjalankan ini hanya sekali atau dengan ON CONFLICT DO NOTHING
DO $$
DECLARE
    admin_rw01_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    admin_rw04_id UUID := '550e8400-e29b-41d4-a716-446655440004';
    hashed_password_admin TEXT;
BEGIN
    -- Hash password 'admin'
    SELECT crypt('admin', gen_salt('bf')) INTO hashed_password_admin;

    -- Update admin RW 01
    UPDATE users
    SET password_hash = hashed_password_admin,
        username = 'admin_rw01', -- Ubah username agar unik jika ada konflik
        name = 'Ketua RW 01',
        role = 'admin',
        rw = '01'
    WHERE id = admin_rw01_id;

    -- Update admin RW 04
    UPDATE users
    SET password_hash = hashed_password_admin,
        username = 'admin_rw04', -- Ubah username agar unik jika ada konflik
        name = 'Ketua RW 04',
        role = 'admin',
        rw = '04'
    WHERE id = admin_rw04_id;

    -- Jika Anda ingin memastikan admin user ada, gunakan INSERT ... ON CONFLICT
    INSERT INTO users (id, username, name, role, rw, password_hash) VALUES
    (admin_rw01_id, 'admin_rw01', 'Ketua RW 01', 'admin', '01', hashed_password_admin),
    (admin_rw04_id, 'admin_rw04', 'Ketua RW 04', 'admin', '04', hashed_password_admin)
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        rw = EXCLUDED.rw,
        password_hash = EXCLUDED.password_hash;

END $$;

-- Tambahkan UNIQUE constraint ke username jika belum ada dan data sudah bersih
-- Pastikan tidak ada duplikasi username sebelum menambahkan constraint ini
-- ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
