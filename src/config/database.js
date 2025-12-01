import { createPool } from "mysql2";

export const pool = createPool({
  connectionLimit: 5,
  host: "localhost",
  user: "library_user",
  database: "library",
  password: "B00kMst3r_Pr0t3ct"
}).promise();
