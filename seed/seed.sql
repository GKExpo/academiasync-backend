
INSERT INTO users (id, name, email, password_hash, roles, department, employee_id, reports_to, is_active) VALUES
('38589bb8-abd5-48d9-b574-4ae102215c4a', 'Principal', 'principal@college.edu', '$2b$10$S21WP68Pxk609T5rFp4IOOaBUozTJBeZITOIGrpeRZk9ehLfGtrpC', '["admin"]', 'Administration', 'EMP001', NULL, 1),
('e8fc7f94-ad8b-4a8d-9f0a-e8e729be318e', 'HOD ECE', 'hod.ece@college.edu', '$2b$10$S21WP68Pxk609T5rFp4IOOaBUozTJBeZITOIGrpeRZk9ehLfGtrpC', '["admin", "user"]', 'ECE', 'EMP002', '38589bb8-abd5-48d9-b574-4ae102215c4a', 1),
('58e68e80-5201-4056-97da-1ea96226121f', 'Staff Member', 'staff@college.edu', '$2b$10$S21WP68Pxk609T5rFp4IOOaBUozTJBeZITOIGrpeRZk9ehLfGtrpC', '["user"]', 'ECE', 'EMP003', 'e8fc7f94-ad8b-4a8d-9f0a-e8e729be318e', 1),
('dd2fb96c-ce16-46f0-a34b-64072ea294b6', 'Student', 'student@college.edu', '$2b$10$S21WP68Pxk609T5rFp4IOOaBUozTJBeZITOIGrpeRZk9ehLfGtrpC', '["user"]', 'ECE', 'STU001', 'e8fc7f94-ad8b-4a8d-9f0a-e8e729be318e', 1);
