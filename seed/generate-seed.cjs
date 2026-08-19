const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const fs = require('fs');

async function main() {
    const password = process.env.DEV_PASSWORD || 'Dev#Temp#Pass123';
    const hash = await bcrypt.hash(password, 10);

    const principalId = randomUUID();
    const hodId = randomUUID();
    const staff1Id = randomUUID();
    const staff2Id = randomUUID();
    const staff3Id = randomUUID();

    const sql = `
DELETE FROM attendance;
DELETE FROM leave_requests;
DELETE FROM attendance_edit_requests;
DELETE FROM notifications;
DELETE FROM users;
INSERT INTO users (id, name, email, password_hash, roles, department, employee_id, reports_to, is_active) VALUES
('${principalId}', 'Dr. S.H. Dabhole', 'principal@college.edu', '${hash}', '["principal"]', 'Administration', 'EMP001', NULL, 1),
('${hodId}', 'Prof. D.P. Jagtap', 'hod.te@college.edu', '${hash}', '["hod"]', 'TE', 'EMP002', '${principalId}', 1),
('${staff1Id}', 'Miss. R.S. Pande', 'rspande@college.edu', '${hash}', '["staff"]', 'TE', 'EMP003', '${hodId}', 1),
('${staff2Id}', 'Mr. U.B. Salokhe', 'ubsalokhe@college.edu', '${hash}', '["staff"]', 'TE', 'EMP004', '${hodId}', 1),
('${staff3Id}', 'Mr. P.D. Londhe', 'pdlondhe@college.edu', '${hash}', '["staff"]', 'TE', 'EMP005', '${hodId}', 1);
`;
    fs.writeFileSync('C:/Users/Shardul Kamble/Documents/Vibe/AcademiaSync - Version 2/backend/seed/seed.sql', sql);
    console.log("Created seed.sql with hierarchy and Dev Password");
}

main();
