USE library;

DROP PROCEDURE IF EXISTS GetBooksByGenre;
DROP PROCEDURE IF EXISTS GetBookReviews;
DROP PROCEDURE IF EXISTS GetBooksByAuthor;
DROP PROCEDURE IF EXISTS GetBooksByRating;
DROP PROCEDURE IF EXISTS GetAvailableBooks;

DELIMITER //

CREATE PROCEDURE GetBooksByGenre(IN p_genre_id INT)
BEGIN
    SELECT b.* FROM books b
    JOIN books_genres bg ON b.id = bg.book_id
    WHERE bg.genre_id = p_genre_id;
END //


CREATE PROCEDURE GetBooksByAuthor(IN p_author_id INT)
BEGIN
    SELECT books.* FROM books
    JOIN books_authors ON books_authors.book_id = books.id
    WHERE books_authors.author_id = p_author_id;
END //


CREATE PROCEDURE GetBookReviews(IN p_book_id INT)
BEGIN
    SELECT 
        reviews.id,
        users.name,
        reviews.review_date,
        reviews.rating,
        reviews.comment  
    FROM reviews
    JOIN users ON reviews.user_id = users.id
    WHERE reviews.book_id = p_book_id;
END //


CREATE PROCEDURE GetBooksByRating(IN p_min_rating TINYINT)
BEGIN
    SELECT books.*, rew.average_rating FROM books
    JOIN (
        SELECT book_id, AVG(rating) as average_rating FROM reviews
        GROUP BY book_id
        HAVING average_rating >= p_min_rating
    ) rew ON rew.book_id = books.id;
END //


CREATE PROCEDURE GetAvailableBooks()
BEGIN
    SELECT * FROM books
    WHERE books.quantity > 0;
END //

DELIMITER ;
