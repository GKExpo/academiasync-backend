
DELETE FROM attendance;
DELETE FROM leave_requests;
DELETE FROM attendance_edit_requests;
DELETE FROM notifications;
DELETE FROM users;
INSERT INTO users (id, name, email, password_hash, roles, department, employee_id, reports_to, is_active) VALUES
('613bd68c-edfe-4e0b-af3d-f3fc6e2248e1', 'Dr. S.H. Dabhole', 'principal@college.edu', '$2b$10$nOs8TWv5f8UpkBmjMxiS0.FPiKQ5sCMK.2rrqFMYGJ3BM1V4.ZCAe', '["principal"]', 'Administration', 'EMP001', NULL, 1),
('56597a3b-a5df-4c50-9c1d-ec377b2914a1', 'Prof. D.P. Jagtap', 'hod.te@college.edu', '$2b$10$nOs8TWv5f8UpkBmjMxiS0.FPiKQ5sCMK.2rrqFMYGJ3BM1V4.ZCAe', '["hod"]', 'TE', 'EMP002', '613bd68c-edfe-4e0b-af3d-f3fc6e2248e1', 1),
('590a83a4-c0e6-4c0f-8820-bdbf62ef28fe', 'Miss. R.S. Pande', 'rspande@college.edu', '$2b$10$nOs8TWv5f8UpkBmjMxiS0.FPiKQ5sCMK.2rrqFMYGJ3BM1V4.ZCAe', '["staff"]', 'TE', 'EMP003', '56597a3b-a5df-4c50-9c1d-ec377b2914a1', 1),
('a67c3efe-0432-4328-a928-4c8f8ee32018', 'Mr. U.B. Salokhe', 'ubsalokhe@college.edu', '$2b$10$nOs8TWv5f8UpkBmjMxiS0.FPiKQ5sCMK.2rrqFMYGJ3BM1V4.ZCAe', '["staff"]', 'TE', 'EMP004', '56597a3b-a5df-4c50-9c1d-ec377b2914a1', 1),
('48e154c3-77ce-4bef-a959-08e949685c62', 'Mr. P.D. Londhe', 'pdlondhe@college.edu', '$2b$10$nOs8TWv5f8UpkBmjMxiS0.FPiKQ5sCMK.2rrqFMYGJ3BM1V4.ZCAe', '["staff"]', 'TE', 'EMP005', '56597a3b-a5df-4c50-9c1d-ec377b2914a1', 1);
