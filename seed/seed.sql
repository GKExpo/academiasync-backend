
DELETE FROM attendance;
DELETE FROM leave_requests;
DELETE FROM attendance_edit_requests;
DELETE FROM notifications;
DELETE FROM users;
INSERT INTO users (id, name, email, password_hash, roles, department, employee_id, reports_to, is_active) VALUES
('e44c62ba-29c1-4e5e-9e8e-6dd0c314e201', 'Dr. S.H. Dabhole', 'principal@college.edu', '$2b$10$ed3bVWf2W6scD0nWD8WrfeL8j5hqpq0iXzRAyiQOVorrQlA/jYLFW', '["principal"]', 'Administration', 'EMP001', NULL, 1),
('1209acbb-041b-4658-9b00-19dda8306ee1', 'Prof. D.P. Jagtap', 'hod.te@college.edu', '$2b$10$ed3bVWf2W6scD0nWD8WrfeL8j5hqpq0iXzRAyiQOVorrQlA/jYLFW', '["hod"]', 'TE', 'EMP002', 'e44c62ba-29c1-4e5e-9e8e-6dd0c314e201', 1),
('284f7775-d644-41e0-aacc-7804d7fd89ee', 'Miss. R.S. Pande', 'rspande@college.edu', '$2b$10$ed3bVWf2W6scD0nWD8WrfeL8j5hqpq0iXzRAyiQOVorrQlA/jYLFW', '["staff"]', 'TE', 'EMP003', '1209acbb-041b-4658-9b00-19dda8306ee1', 1),
('b6363932-9c9b-46dd-91b3-5774cc4f2473', 'Mr. U.B. Salokhe', 'ubsalokhe@college.edu', '$2b$10$ed3bVWf2W6scD0nWD8WrfeL8j5hqpq0iXzRAyiQOVorrQlA/jYLFW', '["staff"]', 'TE', 'EMP004', '1209acbb-041b-4658-9b00-19dda8306ee1', 1),
('6f0fea56-f55e-456e-abc5-583f3cd389d0', 'Mr. P.D. Londhe', 'pdlondhe@college.edu', '$2b$10$ed3bVWf2W6scD0nWD8WrfeL8j5hqpq0iXzRAyiQOVorrQlA/jYLFW', '["staff"]', 'TE', 'EMP005', '1209acbb-041b-4658-9b00-19dda8306ee1', 1);
