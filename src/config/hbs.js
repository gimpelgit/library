/**
 * @param {string} fio 
 */
function _formatFIO(fio) {
  const parts = fio.split(' ');
  if (parts.length === 3)
    return `${parts[0][0]}.${parts[1][0]}. ${parts[2]}`;
  return fio;
}

export const hbsHelpers = {
  eq(a, b) {
    return a === b;
  },
  gt(a, b) {
    return a > b;
  },
  lt(a, b) {
    return a < b;
  },
  add(a, b) {
    return a + b;
  },
  sub(a, b) {
    return a - b;
  },
  section(name, options) {
    if (!this._sections) this._sections = {};
    this._sections[name] = options.fn(this);
    return null;
  },
  range(start, end) {
    const result = [];
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  },
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  },

  /**
   * @param {string|string[]} fio 
   */
  formatFIO(fio) {
    if (typeof fio === 'string') {
      if (fio.includes(',')) {
        return fio.split(',').map(author => _formatFIO(author.trim())).join(', ');
      }
      return _formatFIO(fio);
    }
    if (Array.isArray(fio)) {
      return fio.map(_formatFIO).join(', ');
    }
    return fio;
  },
  truncate(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },
  isOverdue(returnDate) {
    if (!returnDate) return false;
    return new Date(returnDate) < new Date();
  },
  json(context) {
    return JSON.stringify(context);
  },
}