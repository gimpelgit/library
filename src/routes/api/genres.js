import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireLibrarian } from "../../middleware/auth.js";


export const apiGenresRouter = Router();

apiGenresRouter.get("/search", async (req, res) => {
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

apiGenresRouter.post("/", requireAuth, requireLibrarian, async (req, res) => {
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

apiGenresRouter.put("/:id", requireAuth, requireLibrarian, async (req, res) => {
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

apiGenresRouter.delete("/:id", requireAuth, requireLibrarian, async (req, res) => {
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

