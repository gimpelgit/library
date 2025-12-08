import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireLibrarian } from "../../middleware/auth.js";


export const apiAuthorsRouter = Router();

// /api/authors
// /api/genres

// edit/authors
// edit/authors/:id
// edit/authors/:id
// edit/api/authors/search


apiAuthorsRouter.get("/search", async (req, res) => {
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

apiAuthorsRouter.post("/", requireAuth, requireLibrarian, async (req, res) => {
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

apiAuthorsRouter.put("/:id", requireAuth, requireLibrarian, async (req, res) => {
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

apiAuthorsRouter.delete("/:id", requireAuth, requireLibrarian, async (req, res) => {
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