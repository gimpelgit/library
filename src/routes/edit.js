import { Router } from "express";
import { pool } from "../config/database.js";
import { requireAuth, requireLibrarian } from "../middleware/auth.js";

export const editRouter = Router();

editRouter.use(requireAuth);
editRouter.use(requireLibrarian);

// Главная страница редактирования с сеткой
editRouter.get("/", async (req, res) => {
  try {
    // Получаем статистику для отображения в карточках
    const [authorsCount] = await pool.execute('SELECT COUNT(*) as count FROM authors');
    const [genresCount] = await pool.execute('SELECT COUNT(*) as count FROM genres');
    const [booksCount] = await pool.execute('SELECT COUNT(*) as count FROM books');
    
    res.render("edit/index", {
      user: req.session.user,
      page: 'edit',
      title: 'Редактирование',
      stats: {
        authors: authorsCount[0].count,
        genres: genresCount[0].count,
        books: booksCount[0].count
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке страницы редактирования'
    });
  }
});

// CRUD для авторов
editRouter.get("/authors", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search } = req.query;
    
    let query = 'SELECT * FROM authors';
    let countQuery = 'SELECT COUNT(*) as total FROM authors';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' WHERE name LIKE ?';
      countQuery += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    query += ' ORDER BY name';
    
    let [authors] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    authors = authors.slice(offset, offset + limit);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.render("edit/authors", {
      user: req.session.user,
      page: 'edit-authors',
      title: 'Редактирование авторов',
      authors,
      currentPage: page,
      totalPages,
      search: search || ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке авторов'
    });
  }
});

editRouter.post("/authors", async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Имя автора не может быть пустым' 
      });
    }
    
    await pool.execute(
      'INSERT INTO authors (name) VALUES (?)',
      [name.trim()]
    );
    
    res.json({ 
      success: true, 
      message: 'Автор успешно добавлен' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при добавлении автора' 
    });
  }
});

editRouter.put("/authors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Имя автора не может быть пустым' 
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE authors SET name = ? WHERE id = ?',
      [name.trim(), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Автор не найден' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Автор успешно обновлен' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении автора' 
    });
  }
});

editRouter.delete("/authors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, есть ли книги у этого автора
    const [books] = await pool.execute(
      'SELECT COUNT(*) as count FROM books_authors WHERE author_id = ?',
      [id]
    );
    
    if (books[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Невозможно удалить автора, так как с ним связаны книги' 
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM authors WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Автор не найден' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Автор успешно удален' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении автора' 
    });
  }
});

// CRUD для жанров
editRouter.get("/genres", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search } = req.query;
    
    let query = 'SELECT * FROM genres';
    let countQuery = 'SELECT COUNT(*) as total FROM genres';
    const params = [];
    const countParams = [];
    
    if (search) {
      query += ' WHERE name LIKE ?';
      countQuery += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }   
    query += ' ORDER BY name';
    
    let [genres] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    genres = genres.slice(offset, offset + limit);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    res.render("edit/genres", {
      user: req.session.user,
      page: 'edit-genres',
      title: 'Редактирование жанров',
      genres,
      currentPage: page,
      totalPages,
      search: search || ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке жанров'
    });
  }
});

editRouter.post("/genres", async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Название жанра не может быть пустым' 
      });
    }
    
    await pool.execute(
      'INSERT INTO genres (name) VALUES (?)',
      [name.trim()]
    );
    
    res.json({ 
      success: true, 
      message: 'Жанр успешно добавлен' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при добавлении жанра' 
    });
  }
});

editRouter.put("/genres/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Название жанра не может быть пустым' 
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE genres SET name = ? WHERE id = ?',
      [name.trim(), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Жанр не найден' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Жанр успешно обновлен' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении жанра' 
    });
  }
});

editRouter.delete("/genres/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, есть ли книги в этом жанре
    const [books] = await pool.execute(
      'SELECT COUNT(*) as count FROM books_genres WHERE genre_id = ?',
      [id]
    );
    
    if (books[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Невозможно удалить жанр, так как с ним связаны книги' 
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM genres WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Жанр не найден' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Жанр успешно удален' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении жанра' 
    });
  }
});


// CRUD для книг
editRouter.get("/books", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { search, author, genre } = req.query;
    
    let query = `
      SELECT 
        b.*,
        GROUP_CONCAT(DISTINCT a.id) as author_ids,
        GROUP_CONCAT(DISTINCT a.name) as author_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT g.name) as genre_names
      FROM books b
      LEFT JOIN books_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN books_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
    `;
    
    let countQuery = 'SELECT COUNT(DISTINCT b.id) as total FROM books b';
    const conditions = [];
    const params = [];
    const countParams = [];
    
    if (search) {
      conditions.push("b.title LIKE ?");
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    
    if (author) {
      conditions.push("a.name LIKE ?");
      params.push(`%${author}%`);
      countParams.push(`%${author}%`);
    }
    
    if (genre) {
      conditions.push("g.name = ?");
      params.push(genre);
      countParams.push(genre);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
      countQuery += ` LEFT JOIN books_authors ba ON b.id = ba.book_id 
                     LEFT JOIN authors a ON ba.author_id = a.id
                     LEFT JOIN books_genres bg ON b.id = bg.book_id
                     LEFT JOIN genres g ON bg.genre_id = g.id
                     WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` GROUP BY b.id ORDER BY b.title`;
    
    let [books] = await pool.execute(query, params);
    const [countResult] = await pool.execute(countQuery, countParams);
    
    books = books.slice(offset, offset + limit);
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Получить всех авторов и жанры для форм
    const [authors] = await pool.execute('SELECT * FROM authors ORDER BY name');
    const [genres] = await pool.execute('SELECT * FROM genres ORDER BY name');
    
    res.render("edit/books", {
      user: req.session.user,
      page: 'edit-books',
      title: 'Редактирование книг',
      books,
      authors,
      genres,
      currentPage: page,
      totalPages,
      filters: { search, author, genre }
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке книг'
    });
  }
});

// Получение одной книги для редактирования
editRouter.get("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [books] = await pool.execute(`
      SELECT 
        b.*,
        GROUP_CONCAT(DISTINCT a.id) as author_ids,
        GROUP_CONCAT(DISTINCT a.name) as author_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT g.name) as genre_names
      FROM books b
      LEFT JOIN books_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN books_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      WHERE b.id = ?
      GROUP BY b.id
    `, [id]);
    
    if (books.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Книга не найдена' 
      });
    }
    
    const book = books[0];
    
    // Получить всех авторов и жанры для форм
    const [authors] = await pool.execute('SELECT * FROM authors ORDER BY name');
    const [genres] = await pool.execute('SELECT * FROM genres ORDER BY name');
    
    // Преобразовать строки в массивы
    book.author_ids = book.author_ids ? book.author_ids.split(',').map(Number) : [];
    book.genre_ids = book.genre_ids ? book.genre_ids.split(',').map(Number) : [];
    
    res.json({ 
      success: true, 
      data: {
        book,
        authors,
        genres
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при загрузке книги' 
    });
  }
});

// Создание новой книги
editRouter.post("/books", async (req, res) => {
  try {
    const { title, summary, page_count, quantity, authorIds = [], genreIds = [] } = req.body;
    
    if (!title || !summary || !page_count || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Заполните все обязательные поля' 
      });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO books (title, summary, page_count, quantity) VALUES (?, ?, ?, ?)',
      [title, summary, parseInt(page_count), parseInt(quantity)]
    );
    
    const bookId = result.insertId;
    
    // Добавление авторов
    for (const authorId of authorIds) {
      await pool.execute(
        'INSERT INTO books_authors (book_id, author_id) VALUES (?, ?)',
        [bookId, authorId]
      );
    }
    
    // Добавление жанров
    for (const genreId of genreIds) {
      await pool.execute(
        'INSERT INTO books_genres (book_id, genre_id) VALUES (?, ?)',
        [bookId, genreId]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Книга успешно добавлена',
      bookId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при добавлении книги' 
    });
  }
});

// Обновление книги
editRouter.put("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, page_count, quantity, authorIds = [], genreIds = [] } = req.body;
    
    if (!title || !summary || !page_count || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Заполните все обязательные поля' 
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE books SET title = ?, summary = ?, page_count = ?, quantity = ? WHERE id = ?',
      [title, summary, parseInt(page_count), parseInt(quantity), id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Книга не найдена' 
      });
    }
    
    // Удалить старых авторов и добавить новых
    await pool.execute('DELETE FROM books_authors WHERE book_id = ?', [id]);
    for (const authorId of authorIds) {
      await pool.execute(
        'INSERT INTO books_authors (book_id, author_id) VALUES (?, ?)',
        [id, authorId]
      );
    }
    
    // Удалить старые жанры и добавить новые
    await pool.execute('DELETE FROM books_genres WHERE book_id = ?', [id]);
    for (const genreId of genreIds) {
      await pool.execute(
        'INSERT INTO books_genres (book_id, genre_id) VALUES (?, ?)',
        [id, genreId]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Книга успешно обновлена' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении книги' 
    });
  }
});

// Обновление обложки книги
editRouter.put("/books/:id/cover", async (req, res) => {
  try {
    const { id } = req.params;
    const { cover_image_url } = req.body;
    
    if (!cover_image_url) {
      return res.status(400).json({ 
        success: false, 
        message: 'URL обложки не указан' 
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE books SET cover_image_url = ? WHERE id = ?',
      [cover_image_url, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Книга не найдена' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Обложка успешно обновлена' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при обновлении обложки' 
    });
  }
});

// Удаление книги
editRouter.delete("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, есть ли активные выдачи или брони
    const [activeLoans] = await pool.execute(
      `SELECT COUNT(*) as count FROM loans l 
       JOIN loan_statuses ls ON l.status_id = ls.id 
       WHERE l.book_id = ? AND ls.name = 'on_loan'`,
      [id]
    );
    
    const [activeReservations] = await pool.execute(
      'SELECT COUNT(*) as count FROM reservations WHERE book_id = ?',
      [id]
    );
    
    if (activeLoans[0].count > 0 || activeReservations[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Невозможно удалить книгу, так как она выдана или забронирована' 
      });
    }
    
    const [result] = await pool.execute(
      'DELETE FROM books WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Книга не найдена' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Книга успешно удалена' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при удалении книги' 
    });
  }
});

// API для поиска авторов с пагинацией
editRouter.get("/api/authors/search", async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, name FROM authors';
    const params = [];
    
    if (q) {
      query += ' WHERE name LIKE ?';
      params.push(`%${q}%`);
    }
    query += ' ORDER BY name';
    
    let [authors] = await pool.execute(query, params);    
    authors = authors.slice(offset, offset + limit);

    // Получаем общее количество для пагинации
    let countQuery = 'SELECT COUNT(*) as total FROM authors';
    const countParams = [];
    
    if (q) {
      countQuery += ' WHERE name LIKE ?';
      countParams.push(`%${q}%`);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      authors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при поиске авторов' 
    });
  }
});

// API для поиска жанров с пагинацией
editRouter.get("/api/genres/search", async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, name FROM genres';
    const params = [];
    
    if (q) {
      query += ' WHERE name LIKE ?';
      params.push(`%${q}%`);
    }
    query += ' ORDER BY name';
    
    let [genres] = await pool.execute(query, params);
    genres = genres.slice(offset, offset + limit);
    
    // Получаем общее количество для пагинации
    let countQuery = 'SELECT COUNT(*) as total FROM genres';
    const countParams = [];
    
    if (q) {
      countQuery += ' WHERE name LIKE ?';
      countParams.push(`%${q}%`);
    }
    
    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      success: true,
      genres,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка при поиске жанров' 
    });
  }
});

editRouter.get("/books/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === 'new') {
      // Новая книга
      const [authors] = await pool.execute('SELECT * FROM authors ORDER BY name');
      const [genres] = await pool.execute('SELECT * FROM genres ORDER BY name');
      
      return res.render("edit/book-edit", {
        user: req.session.user,
        page: 'edit-books',
        title: 'Добавление книги',
        book: {
          id: null,
          title: '',
          summary: '',
          page_count: '',
          quantity: 1,
          cover_image_url: '',
          author_ids: [],
          genre_ids: []
        },
        authors,
        genres
      });
    }
    
    const [books] = await pool.execute(`
      SELECT 
        b.*,
        GROUP_CONCAT(DISTINCT a.id) as author_ids,
        GROUP_CONCAT(DISTINCT a.name) as author_names,
        GROUP_CONCAT(DISTINCT g.id) as genre_ids,
        GROUP_CONCAT(DISTINCT g.name) as genre_names
      FROM books b
      LEFT JOIN books_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN books_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      WHERE b.id = ?
      GROUP BY b.id
    `, [id]);
    
    if (books.length === 0) {
      return res.status(404).render("error", {
        user: req.session.user,
        title: 'Книга не найдена',
        message: 'Запрошенная книга не существует'
      });
    }
    
    const book = books[0];
    
    // Преобразуем строки в массивы
    book.author_ids = book.author_ids ? book.author_ids.split(',').map(Number) : [];
    book.genre_ids = book.genre_ids ? book.genre_ids.split(',').map(Number) : [];
    
    res.render("edit/book-edit", {
      user: req.session.user,
      page: 'edit-books',
      title: 'Редактирование книги',
      book
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      user: req.session.user,
      title: 'Ошибка',
      message: 'Произошла ошибка при загрузке книги'
    });
  }
});