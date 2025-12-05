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
  isOverdue(returnDate) {
    if (!returnDate) return false;
    return new Date(returnDate) < new Date();
  }
}