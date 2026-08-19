const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const fs = require('fs');

async function main() {
    const password = 'password';
    const hash = await bcrypt.hash(password, 10);

    const principalId = randomUUID();
    const hodId = randomUUID();
    const staffId = randomUUID();
    const studentId = randomUUID();

    const sql = `
INSERT INTO users (id, name, email, password_hash, roles, department, employee_id, reports_to, is_active) VALUES
('${principalId}', 'Principal', 'principal@college.edu', '${hash}', '["admin"]', 'Administration', 'EMP001', NULL, 1),
('${hodId}', 'HOD ECE', 'hod.ece@college.edu', '${hash}', '["admin", "user"]', 'ECE', 'EMP002', '${principalId}', 1),
('${staffId}', 'Staff Member', 'staff@college.edu', '${hash}', '["user"]', 'ECE', 'EMP003', '${hodId}', 1),
('${studentId}', 'Student', 'student@college.edu', '${hash}', '["user"]', 'ECE', 'STU001', '${hodId}', 1);
`;
    fs.writeFileSync('C:/Users/Shardul Kamble/Documents/Vibe/AcademiaSync - Version 2/backend/seed/seed.sql', sql);
    console.log("Created seed.sql");
}

main();
