-- ============================================================
-- LOAN MANAGEMENT & CREDIT APPROVAL SYSTEM
-- MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS loan_management;
USE loan_management;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    annual_income DECIMAL(15,2),
    credit_score INT DEFAULT 650,
    role ENUM('customer', 'manager', 'admin') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);

CREATE TABLE loan_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    min_amount DECIMAL(15,2) NOT NULL,
    max_amount DECIMAL(15,2) NOT NULL,
    min_tenure_months INT NOT NULL,
    max_tenure_months INT NOT NULL,
    base_interest_rate DECIMAL(5,2) NOT NULL,
    min_credit_score INT DEFAULT 600,
    min_annual_income DECIMAL(15,2) DEFAULT 0,
    processing_fee_percent DECIMAL(5,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loan_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    loan_type_id INT NOT NULL,
    requested_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    tenure_months INT NOT NULL,
    interest_rate DECIMAL(5,2),
    purpose TEXT,
    status ENUM('pending','under_review','approved','rejected','disbursed','closed') DEFAULT 'pending',
    reviewed_by INT,
    review_notes TEXT,
    reviewed_at TIMESTAMP NULL,
    disbursed_at TIMESTAMP NULL,
    processing_fee DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (loan_type_id) REFERENCES loan_types(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    INDEX idx_applications_customer (customer_id),
    INDEX idx_applications_status (status),
    INDEX idx_applications_number (application_number)
);

CREATE TABLE emi_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    emi_amount DECIMAL(15,2) NOT NULL,
    principal_component DECIMAL(15,2) NOT NULL,
    interest_component DECIMAL(15,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    status ENUM('pending','paid','overdue','waived') DEFAULT 'pending',
    paid_amount DECIMAL(15,2),
    paid_date DATE,
    penalty_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(id),
    INDEX idx_emi_application (application_id),
    INDEX idx_emi_due_date (due_date),
    INDEX idx_emi_status (status)
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    emi_schedule_id INT,
    amount DECIMAL(15,2) NOT NULL,
    payment_mode ENUM('online','bank_transfer','cash','cheque') NOT NULL,
    transaction_reference VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by INT,
    notes TEXT,
    FOREIGN KEY (application_id) REFERENCES loan_applications(id),
    FOREIGN KEY (emi_schedule_id) REFERENCES emi_schedules(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id),
    INDEX idx_payments_application (application_id),
    INDEX idx_payments_date (payment_date)
);

CREATE TABLE payment_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    application_id INT NOT NULL,
    customer_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    action VARCHAR(50) NOT NULL,
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    document_type ENUM('identity','income_proof','address_proof','bank_statement','other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(id)
);

-- ============================================================
-- STORED PROCEDURE: Generate EMI Schedule
-- ============================================================

DELIMITER $$

CREATE PROCEDURE generate_emi_schedule(IN p_application_id INT)
BEGIN
    DECLARE v_principal DECIMAL(15,2);
    DECLARE v_annual_rate DECIMAL(5,2);
    DECLARE v_monthly_rate DECIMAL(10,8);
    DECLARE v_tenure INT;
    DECLARE v_emi DECIMAL(15,2);
    DECLARE v_outstanding DECIMAL(15,2);
    DECLARE v_interest_comp DECIMAL(15,2);
    DECLARE v_principal_comp DECIMAL(15,2);
    DECLARE v_due_date DATE;
    DECLARE v_disbursed_date DATE;
    DECLARE i INT DEFAULT 1;

    -- Get loan details
    SELECT 
        approved_amount,
        interest_rate,
        tenure_months,
        COALESCE(DATE(disbursed_at), CURDATE())
    INTO v_principal, v_annual_rate, v_tenure, v_disbursed_date
    FROM loan_applications
    WHERE id = p_application_id;

    SET v_monthly_rate = v_annual_rate / 100 / 12;
    SET v_outstanding = v_principal;

    -- EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    SET v_emi = ROUND(
        v_principal * v_monthly_rate * POW(1 + v_monthly_rate, v_tenure) 
        / (POW(1 + v_monthly_rate, v_tenure) - 1), 2
    );

    -- Delete existing schedule if any
    DELETE FROM emi_schedules WHERE application_id = p_application_id;

    -- Generate schedule
    WHILE i <= v_tenure DO
        SET v_due_date = DATE_ADD(v_disbursed_date, INTERVAL i MONTH);
        SET v_interest_comp = ROUND(v_outstanding * v_monthly_rate, 2);
        SET v_principal_comp = ROUND(v_emi - v_interest_comp, 2);

        -- Last installment adjustment
        IF i = v_tenure THEN
            SET v_principal_comp = v_outstanding;
            SET v_emi = v_principal_comp + v_interest_comp;
        END IF;

        SET v_outstanding = ROUND(v_outstanding - v_principal_comp, 2);

        INSERT INTO emi_schedules (
            application_id, installment_number, due_date,
            emi_amount, principal_component, interest_component, outstanding_balance
        ) VALUES (
            p_application_id, i, v_due_date,
            v_emi, v_principal_comp, v_interest_comp, v_outstanding
        );

        SET i = i + 1;
    END WHILE;

    SELECT CONCAT('EMI schedule generated: ', v_tenure, ' installments of ~', v_emi) AS result;
END$$

-- ============================================================
-- STORED PROCEDURE: Process Payment
-- ============================================================

CREATE PROCEDURE process_payment(
    IN p_application_id INT,
    IN p_amount DECIMAL(15,2),
    IN p_payment_mode VARCHAR(50),
    IN p_transaction_ref VARCHAR(100),
    IN p_recorded_by INT
)
BEGIN
    DECLARE v_emi_id INT;
    DECLARE v_emi_amount DECIMAL(15,2);
    DECLARE v_penalty DECIMAL(15,2) DEFAULT 0;
    DECLARE v_payment_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment processing failed';
    END;

    START TRANSACTION;

    -- Find oldest pending/overdue EMI
    SELECT id, emi_amount, penalty_amount
    INTO v_emi_id, v_emi_amount, v_penalty
    FROM emi_schedules
    WHERE application_id = p_application_id
      AND status IN ('pending', 'overdue')
    ORDER BY installment_number
    LIMIT 1;

    -- Insert payment record
    INSERT INTO payments (application_id, emi_schedule_id, amount, payment_mode, transaction_reference, recorded_by)
    VALUES (p_application_id, v_emi_id, p_amount, p_payment_mode, p_transaction_ref, p_recorded_by);

    SET v_payment_id = LAST_INSERT_ID();

    -- Mark EMI as paid
    UPDATE emi_schedules
    SET status = 'paid', paid_amount = p_amount, paid_date = CURDATE()
    WHERE id = v_emi_id;

    -- Check if all EMIs paid → close loan
    IF NOT EXISTS (
        SELECT 1 FROM emi_schedules 
        WHERE application_id = p_application_id AND status IN ('pending', 'overdue')
    ) THEN
        UPDATE loan_applications SET status = 'closed' WHERE id = p_application_id;
    END IF;

    COMMIT;
    SELECT 'Payment processed successfully' AS result, v_payment_id AS payment_id;
END$$

-- ============================================================
-- STORED PROCEDURE: Update Overdue EMIs
-- ============================================================

CREATE PROCEDURE update_overdue_emis()
BEGIN
    UPDATE emi_schedules
    SET 
        status = 'overdue',
        penalty_amount = ROUND(emi_amount * 0.02, 2)  -- 2% penalty
    WHERE due_date < CURDATE()
      AND status = 'pending';

    SELECT ROW_COUNT() AS overdue_updated;
END$$

DELIMITER ;

-- ============================================================
-- TRIGGER: Log Payment on Insert
-- ============================================================

DELIMITER $$

CREATE TRIGGER after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    DECLARE v_customer_id INT;
    SELECT customer_id INTO v_customer_id FROM loan_applications WHERE id = NEW.application_id;
    
    INSERT INTO payment_logs (payment_id, application_id, customer_id, amount, action, details)
    VALUES (
        NEW.id, NEW.application_id, v_customer_id, NEW.amount, 'PAYMENT_RECEIVED',
        CONCAT('Payment of ', NEW.amount, ' via ', NEW.payment_mode, 
               '. Ref: ', COALESCE(NEW.transaction_reference, 'N/A'))
    );
END$$

-- ============================================================
-- TRIGGER: Auto-set interest rate on application
-- ============================================================

CREATE TRIGGER before_application_insert
BEFORE INSERT ON loan_applications
FOR EACH ROW
BEGIN
    DECLARE v_base_rate DECIMAL(5,2);
    DECLARE v_credit_score INT;
    DECLARE v_rate_adjustment DECIMAL(5,2) DEFAULT 0;

    SELECT lt.base_interest_rate INTO v_base_rate
    FROM loan_types lt WHERE lt.id = NEW.loan_type_id;

    SELECT credit_score INTO v_credit_score FROM users WHERE id = NEW.customer_id;

    -- Adjust rate based on credit score
    IF v_credit_score >= 750 THEN SET v_rate_adjustment = -1.5;
    ELSEIF v_credit_score >= 700 THEN SET v_rate_adjustment = -0.5;
    ELSEIF v_credit_score < 650 THEN SET v_rate_adjustment = 2.0;
    END IF;

    SET NEW.interest_rate = GREATEST(5.0, v_base_rate + v_rate_adjustment);
END$$

DELIMITER ;

-- ============================================================
-- VIEWS
-- ============================================================

-- Customer Loan Summary View
CREATE VIEW vw_customer_loan_summary AS
SELECT
    u.id AS customer_id,
    u.full_name,
    u.email,
    u.credit_score,
    COUNT(la.id) AS total_applications,
    SUM(CASE WHEN la.status = 'approved' OR la.status = 'disbursed' THEN 1 ELSE 0 END) AS approved_loans,
    SUM(CASE WHEN la.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_loans,
    SUM(CASE WHEN la.status IN ('disbursed','closed') THEN la.approved_amount ELSE 0 END) AS total_disbursed,
    SUM(CASE WHEN la.status = 'closed' THEN la.approved_amount ELSE 0 END) AS total_repaid,
    COUNT(CASE WHEN es.status = 'overdue' THEN 1 END) AS overdue_emis,
    COUNT(CASE WHEN es.status = 'paid' THEN 1 END) AS paid_emis
FROM users u
LEFT JOIN loan_applications la ON u.id = la.customer_id
LEFT JOIN emi_schedules es ON la.id = es.application_id
WHERE u.role = 'customer'
GROUP BY u.id, u.full_name, u.email, u.credit_score;

-- Active Loans View
CREATE VIEW vw_active_loans AS
SELECT
    la.id AS loan_id,
    la.application_number,
    u.full_name AS customer_name,
    u.email AS customer_email,
    lt.name AS loan_type,
    la.approved_amount,
    la.interest_rate,
    la.tenure_months,
    la.status,
    la.disbursed_at,
    COUNT(CASE WHEN es.status = 'paid' THEN 1 END) AS emis_paid,
    COUNT(CASE WHEN es.status = 'pending' THEN 1 END) AS emis_pending,
    COUNT(CASE WHEN es.status = 'overdue' THEN 1 END) AS emis_overdue,
    SUM(CASE WHEN es.status IN ('pending','overdue') THEN es.emi_amount ELSE 0 END) AS outstanding_amount
FROM loan_applications la
JOIN users u ON la.customer_id = u.id
JOIN loan_types lt ON la.loan_type_id = lt.id
LEFT JOIN emi_schedules es ON la.id = es.application_id
WHERE la.status IN ('disbursed', 'closed')
GROUP BY la.id, la.application_number, u.full_name, u.email, lt.name, 
         la.approved_amount, la.interest_rate, la.tenure_months, la.status, la.disbursed_at;

-- Defaulter Report View
CREATE VIEW vw_defaulters AS
SELECT
    u.id AS customer_id,
    u.full_name,
    u.email,
    u.phone,
    u.credit_score,
    la.application_number,
    la.approved_amount,
    COUNT(es.id) AS overdue_count,
    SUM(es.emi_amount + es.penalty_amount) AS total_overdue_amount,
    MIN(es.due_date) AS oldest_overdue_date,
    DATEDIFF(CURDATE(), MIN(es.due_date)) AS days_overdue
FROM users u
JOIN loan_applications la ON u.id = la.customer_id
JOIN emi_schedules es ON la.id = es.application_id
WHERE es.status = 'overdue'
GROUP BY u.id, u.full_name, u.email, u.phone, u.credit_score,
         la.application_number, la.approved_amount
ORDER BY days_overdue DESC;

-- ============================================================
-- WINDOW FUNCTION VIEW: Customer Repayment Ranking
-- ============================================================

CREATE VIEW vw_customer_repayment_ranking AS
SELECT
    customer_id,
    full_name,
    email,
    credit_score,
    total_applications,
    approved_loans,
    paid_emis,
    overdue_emis,
    total_disbursed,
    total_repaid,
    CASE 
        WHEN overdue_emis = 0 AND paid_emis > 0 THEN 100
        WHEN (paid_emis + overdue_emis) = 0 THEN 50
        ELSE ROUND(paid_emis * 100.0 / NULLIF(paid_emis + overdue_emis, 0), 2)
    END AS repayment_score,
    RANK() OVER (ORDER BY 
        CASE 
            WHEN overdue_emis = 0 AND paid_emis > 0 THEN 100
            WHEN (paid_emis + overdue_emis) = 0 THEN 50
            ELSE ROUND(paid_emis * 100.0 / NULLIF(paid_emis + overdue_emis, 0), 2)
        END DESC,
        credit_score DESC
    ) AS repayment_rank,
    NTILE(4) OVER (ORDER BY credit_score DESC) AS credit_quartile
FROM vw_customer_loan_summary;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO loan_types (name, description, min_amount, max_amount, min_tenure_months, max_tenure_months, base_interest_rate, min_credit_score, min_annual_income, processing_fee_percent) VALUES
('Personal Loan', 'Unsecured personal loan for any purpose', 50000, 1500000, 12, 60, 12.5, 650, 300000, 2.00),
('Home Loan', 'Loan for purchase or construction of residential property', 1000000, 50000000, 60, 300, 8.5, 700, 500000, 0.50),
('Car Loan', 'Loan for purchase of new or used vehicles', 200000, 5000000, 12, 84, 9.5, 680, 400000, 1.00),
('Business Loan', 'Loan for business expansion or working capital', 500000, 20000000, 12, 120, 14.0, 700, 1000000, 1.50),
('Education Loan', 'Loan for higher education in India or abroad', 100000, 7500000, 12, 180, 10.5, 620, 0, 0.00),
('Gold Loan', 'Loan against gold ornaments', 10000, 5000000, 3, 24, 11.0, 600, 0, 1.00);

-- Admin and Manager users (passwords hashed for 'Admin@123' and 'Manager@123')
INSERT INTO users (email, hashed_password, full_name, phone, role, credit_score) VALUES
('admin@loanpro.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMa0GASTMi5vYC3LmfXzWkMtYi', 'System Admin', '9999999999', 'admin', 800),
('manager@loanpro.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMa0GASTMi5vYC3LmfXzWkMtYi', 'Branch Manager', '9888888888', 'manager', 780);