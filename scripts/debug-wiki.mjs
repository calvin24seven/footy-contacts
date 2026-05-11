import * as cheerio from 'cheerio';

const HEADERS = { 'User-Agent': 'footy-contacts/1.0' };

const pages = ['2025\u201326 Bundesliga', '2025\u201326 Ligue 1', '2025\u201326 Belgian First Division A'];

for (const page of pages) {
  await new Promise(r => setTimeout(r, 1500));
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&formatversion=2&redirects=1`;
  const r = await fetch(url, { headers: HEADERS });
  const j = await r.json();
  const html = j?.parse?.text;
  const resolvedTitle = j?.parse?.title ?? page;
  if (!html) { console.log(`NO HTML: ${page}`); continue; }
  const $ = cheerio.load(html);
  console.log(`\n=== ${resolvedTitle} ===`);
  $('table.wikitable').each((i, t) => {
    const hdrs = $(t).find('tr').first().find('th').map((_, th) => $(th).text().trim()).get();
    const hdrs2 = $(t).find('tr').eq(1).find('th').map((_, th) => $(th).text().trim()).get();
    const rows = $(t).find('tr').length;
    if (rows > 5) {  // only show tables with meaningful rows
      console.log(`  Table ${i} | ${rows} rows | headers: ${JSON.stringify(hdrs.slice(0,6))} | row2: ${JSON.stringify(hdrs2.slice(0,4))}`);
      // Show first data row
      const firstDataRow = $(t).find('tr').eq(1);
      const cells = firstDataRow.find('td');
      if (cells.length) {
        const cellTexts = cells.map((_, td) => $(td).find('a').first().text() || $(td).text().trim()).get().slice(0,4);
        console.log(`    first data row: ${JSON.stringify(cellTexts)}`);
      }
    }
  });
}
