import { Router } from "express";
import { pool } from "../../config/database.js";
import { requireAuth, requireLibrarian } from "../../middleware/auth.js";


export const apiReadersRouter = Router();

apiReadersRouter.get("/", requireAuth, requireLibrarian, async (req, res) => {
  try {
    const { q } = req.query;
    let query = `
      SELECT u.id, u.name, u.email 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name = 'reader'
    `;
    const params = [];
    
    if (q) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    
    query += ' ORDER BY u.name LIMIT 10';
    
    const [readers] = await pool.execute(query, params);
    res.json(readers);
    
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
});