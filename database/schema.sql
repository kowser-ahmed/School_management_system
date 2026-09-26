USE school_management;

-- =====================================================
-- 1. USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','teacher','accountant','parent','student') NOT NULL,
    phone VARCHAR(20),
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. CLASSES
-- =====================================================
CREATE TABLE IF NOT EXISTS classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    status ENUM('active','inactive') DEFAULT 'active'
);

-- =====================================================
-- 3. SECTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_name VARCHAR(20) NOT NULL,
    capacity INT DEFAULT 40,
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- =====================================================
-- 4. SUBJECTS
-- =====================================================
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(30) UNIQUE,
    class_id INT,
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- =====================================================
-- 5. STUDENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    student_code VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('male','female','other'),
    date_of_birth DATE,
    blood_group VARCHAR(5),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    admission_date DATE,
    class_id INT,
    section_id INT,
    roll_number INT,
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    status ENUM('active','inactive','transferred') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

-- =====================================================
-- 6. TEACHERS
-- =====================================================
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    employee_code VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('male','female','other'),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    joining_date DATE,
    designation VARCHAR(100),
    salary DECIMAL(10,2),
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- =====================================================
-- 7. STAFF
-- =====================================================
CREATE TABLE IF NOT EXISTS staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    employee_code VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('male','female','other'),
    phone VARCHAR(20),
    email VARCHAR(100),
    designation VARCHAR(100),
    joining_date DATE,
    salary DECIMAL(10,2),
    status ENUM('active','inactive') DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- =====================================================
-- 8. TEACHER SUBJECT ASSIGNMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS teacher_subjects (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    class_id INT,
    section_id INT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

-- =====================================================
-- 9. STUDENT ATTENDANCE
-- =====================================================
CREATE TABLE IF NOT EXISTS student_attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present','absent','late','leave') NOT NULL,
    remarks VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    UNIQUE(student_id, attendance_date)
);

-- =====================================================
-- 10. TEACHER ATTENDANCE
-- =====================================================
CREATE TABLE IF NOT EXISTS teacher_attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status ENUM('present','absent','late','leave') NOT NULL,
    remarks VARCHAR(255),
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id),
    UNIQUE(teacher_id, attendance_date)
);

-- =====================================================
-- 11. LEAVE RECORDS
-- =====================================================
CREATE TABLE IF NOT EXISTS leave_records (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    leave_type VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    approved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);

-- =====================================================
-- 12. FEE STRUCTURE
-- =====================================================
CREATE TABLE IF NOT EXISTS fee_structure (
    fee_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    fee_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency ENUM('monthly','yearly','one_time') DEFAULT 'monthly',
    description VARCHAR(255),
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- =====================================================
-- 13. STUDENT FEES
-- =====================================================
CREATE TABLE IF NOT EXISTS student_fees (
    student_fee_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    fee_id INT NOT NULL,
    due_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    due_date DATE,
    status ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (fee_id) REFERENCES fee_structure(fee_id)
);

-- =====================================================
-- 14. PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    student_fee_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','bkash','nagad','bank','card') DEFAULT 'cash',
    transaction_number VARCHAR(100),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    received_by INT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (student_fee_id) REFERENCES student_fees(student_fee_id),
    FOREIGN KEY (received_by) REFERENCES users(user_id)
);

-- =====================================================
-- 15. INCOME
-- =====================================================
CREATE TABLE IF NOT EXISTS income (
    income_id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    income_date DATE NOT NULL,
    description TEXT,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- =====================================================
-- 16. EXPENSE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    description TEXT,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- =====================================================
-- 17. EXAMS
-- =====================================================
CREATE TABLE IF NOT EXISTS exams (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_name VARCHAR(100) NOT NULL,
    class_id INT NOT NULL,
    academic_year VARCHAR(20),
    start_date DATE,
    end_date DATE,
    status ENUM('scheduled','ongoing','completed','published') DEFAULT 'scheduled',
    FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- =====================================================
-- 18. EXAM SCHEDULE
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    room VARCHAR(50),
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);

-- =====================================================
-- 19. RESULTS
-- =====================================================
CREATE TABLE IF NOT EXISTS results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    marks DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5),
    grade_point DECIMAL(3,2),
    remarks VARCHAR(255),
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    UNIQUE(exam_id, student_id, subject_id)
);

-- =====================================================
-- 20. ROUTINE
-- =====================================================
CREATE TABLE IF NOT EXISTS routines (
    routine_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT,
    subject_id INT NOT NULL,
    teacher_id INT,
    day_of_week ENUM('Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- =====================================================
-- 21. HOLIDAYS
-- =====================================================
CREATE TABLE IF NOT EXISTS holidays (
    holiday_id INT AUTO_INCREMENT PRIMARY KEY,
    holiday_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description VARCHAR(255)
);

-- =====================================================
-- 22. NOTICES
-- =====================================================
CREATE TABLE IF NOT EXISTS notices (
    notice_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    target_role ENUM('all','admin','teacher','accountant','parent','student') DEFAULT 'all',
    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    status ENUM('published','draft') DEFAULT 'published',
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- =====================================================
-- 23. SMS
-- =====================================================
CREATE TABLE IF NOT EXISTS sms_logs (
    sms_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    sms_type ENUM('attendance','result','fee','notice','general') DEFAULT 'general',
    status ENUM('pending','sent','failed') DEFAULT 'pending',
    sent_at DATETIME,
    sent_by INT,
    FOREIGN KEY (sent_by) REFERENCES users(user_id)
);

-- =====================================================
-- 24. SMS BALANCE
-- =====================================================
CREATE TABLE IF NOT EXISTS sms_balance (
    balance_id INT AUTO_INCREMENT PRIMARY KEY,
    total_sms INT DEFAULT 0,
    used_sms INT DEFAULT 0,
    remaining_sms INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 25. PAYSLIPS
-- =====================================================
CREATE TABLE IF NOT EXISTS payslips (
    payslip_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    salary_month VARCHAR(20) NOT NULL,
    basic_salary DECIMAL(10,2) NOT NULL,
    allowance DECIMAL(10,2) DEFAULT 0,
    deduction DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    payment_date DATE,
    status ENUM('generated','paid') DEFAULT 'generated',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- =====================================================
-- 26. ONLINE ADMISSIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS online_admissions (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male','female','other'),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    applying_class VARCHAR(50),
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending','approved','rejected','enrolled') DEFAULT 'pending'
);

-- =====================================================
-- 27. SUPPORT TICKETS
-- =====================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low','medium','high') DEFAULT 'medium',
    status ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- =====================================================
-- 28. INSTITUTE SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS institute_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    institute_name VARCHAR(200) NOT NULL,
    eiin VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    logo_path VARCHAR(255),
    academic_year VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 29. AUDIT LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- =====================================================
-- CHECK TABLES
-- =====================================================
SHOW TABLES;