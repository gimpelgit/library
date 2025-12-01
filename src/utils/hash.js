import { createHash } from "node:crypto";

export const hashPassword = (password) => {
  return createHash('sha256').update(password).digest('hex');
};