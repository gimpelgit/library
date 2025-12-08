use library;

DROP TABLE IF EXISTS activity_logs;

DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS book_suggestions;
DROP TABLE IF EXISTS books_genres;
DROP TABLE IF EXISTS books_authors;

DROP TABLE IF EXISTS authors;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS suggestion_statuses;
DROP TABLE IF EXISTS loan_statuses;


DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;


CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(32) NOT NULL
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT REFERENCES roles(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    created_at DATE DEFAULT (CURRENT_DATE)
);


CREATE TABLE authors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(64) NOT NULL
);

CREATE TABLE genres (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(32) UNIQUE NOT NULL
);

CREATE TABLE books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    page_count INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    cover_image_url VARCHAR(255)
);


CREATE TABLE books_genres (
    book_id INT REFERENCES books(id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, genre_id)
);


CREATE TABLE books_authors (
    book_id INT REFERENCES books(id) ON DELETE CASCADE,
    author_id INT REFERENCES authors(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

CREATE TABLE loan_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) UNIQUE NOT NULL
);


CREATE TABLE loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id),
    book_id INT REFERENCES books(id),
    status_id INT REFERENCES loan_statuses(id),
    loan_date DATE NOT NULL,
    return_date DATE NOT NULL
);


CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id),
    book_id INT REFERENCES books(id),
    reserved_until DATE NOT NULL
);


CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE suggestion_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(20) UNIQUE NOT NULL
);


CREATE TABLE book_suggestions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    status_id INT REFERENCES suggestion_statuses(id),
    suggestion_date DATE DEFAULT (CURRENT_DATE)
);


CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    book_id INT REFERENCES books(id) ON DELETE CASCADE,
    rating TINYINT NOT NULL CHECK(1 <= rating AND rating <= 5),
    comment TEXT NOT NULL,
    review_date DATE DEFAULT (CURRENT_DATE)
);

-- Индексы 
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_loans_user_book ON loans(user_id, book_id);
CREATE INDEX idx_reviews_user_book ON reviews(user_id, book_id);