const DEFAULT_PAGE_SIZE = 1000;
const DEFAULT_MAX_PAGES = 100;

export async function fetchAllRows(fetchPage, options = {}) {
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
  const maxPages = options.maxPages || DEFAULT_MAX_PAGES;
  const rows = [];

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await fetchPage(from, to);

    if (error) throw error;

    const pageRows = Array.isArray(data) ? data : [];
    rows.push(...pageRows);

    if (pageRows.length < pageSize) {
      return rows;
    }
  }

  throw new Error(`分页读取超过安全上限（${maxPages * pageSize} 条）`);
}
