USE library;

DROP TRIGGER IF EXISTS decrease_quantity_on_reservation;
DROP TRIGGER IF EXISTS increase_quantity_on_reservation_delete;
DROP TRIGGER IF EXISTS handle_reservation_on_loan;
DROP TRIGGER IF EXISTS increase_quantity_on_loan_return;
DROP TRIGGER IF EXISTS prevent_duplicate_reviews;

DELIMITER //

CREATE TRIGGER decrease_quantity_on_reservation
AFTER INSERT ON reservations
FOR EACH ROW
BEGIN
    UPDATE books
    SET quantity = quantity - 1
    WHERE id = NEW.book_id;
END //


CREATE TRIGGER increase_quantity_on_reservation_delete
AFTER DELETE ON reservations
FOR EACH ROW
BEGIN
    UPDATE books
    SET quantity = quantity + 1
    WHERE id = OLD.book_id;
END //


CREATE TRIGGER handle_reservation_on_loan
AFTER INSERT ON loans
FOR EACH ROW
BEGIN
    DELETE FROM reservations
    WHERE book_id = NEW.book_id AND user_id = NEW.user_id;

    UPDATE books
    SET quantity = quantity - 1
    WHERE id = NEW.book_id;
END //


CREATE TRIGGER increase_quantity_on_loan_return
AFTER UPDATE ON loans
FOR EACH ROW
BEGIN
    DECLARE returned_status_id INT;
    SET returned_status_id = (SELECT id FROM loan_statuses WHERE name = 'returned');

    IF NEW.status_id = returned_status_id AND OLD.status_id != returned_status_id THEN
        UPDATE books
        SET quantity = quantity + 1
        WHERE id = NEW.book_id;
    END IF;
END //


CREATE TRIGGER prevent_duplicate_reviews
BEFORE INSERT ON reviews
FOR EACH ROW
BEGIN
    DECLARE existing_count INT;
    
    SELECT COUNT(*) INTO existing_count
    FROM reviews
    WHERE user_id = NEW.user_id AND book_id = NEW.book_id;
    
    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Пользователь уже оставил отзыв на эту книгу';
    END IF;
END //

DELIMITER ;