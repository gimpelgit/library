USE library;

DROP EVENT IF EXISTS delete_expired_reservations_after_3_days;

DELIMITER //

CREATE EVENT delete_expired_reservations_after_3_days
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    DELETE FROM reservations
    WHERE reserved_until < CURRENT_DATE;
END //

DELIMITER ;