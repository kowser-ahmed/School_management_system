USE school_management;

-- Run once after schema.sql. Existing records are backfilled from each student's current enrollment.
ALTER TABLE student_attendance
    ADD COLUMN class_id INT NULL AFTER student_id,
    ADD COLUMN section_id INT NULL AFTER class_id,
    ADD COLUMN academic_year VARCHAR(20) NULL AFTER section_id;

UPDATE student_attendance a
INNER JOIN students s ON s.student_id = a.student_id
LEFT JOIN classes c ON c.class_id = s.class_id
SET a.class_id = s.class_id,
    a.section_id = s.section_id,
    a.academic_year = c.academic_year;

ALTER TABLE student_attendance
    ADD CONSTRAINT fk_student_attendance_class
        FOREIGN KEY (class_id) REFERENCES classes(class_id),
    ADD CONSTRAINT fk_student_attendance_section
        FOREIGN KEY (section_id) REFERENCES sections(section_id),
    ADD INDEX idx_student_attendance_class_date (academic_year, class_id, section_id, attendance_date);

CREATE TABLE IF NOT EXISTS staff_attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status ENUM('present', 'absent', 'late', 'leave') NOT NULL,
    remarks VARCHAR(255),
    CONSTRAINT fk_staff_attendance_staff
        FOREIGN KEY (staff_id) REFERENCES staff(staff_id),
    CONSTRAINT uq_staff_attendance_day
        UNIQUE (staff_id, attendance_date),
    INDEX idx_staff_attendance_date (attendance_date)
);