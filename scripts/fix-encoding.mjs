import { readFileSync, writeFileSync } from 'fs';
const fs = { readFileSync, writeFileSync };
const path = 'c:/Users/Calvi/footy-contacts/apps/marketing/src/app/page.tsx';
let c = fs.readFileSync(path, 'utf8');

const fixes = [
  ['\u00E2\u20AC\u201D', '\u2014'],
  ['\u00E2\u2020\u2019', '\u2192'],
  ['\u00E2\u2020\u201C', '\u2193'],
  ['\u00E2\u20AC\u00A2', '\u2022'],
  ['\u00C2\u00B7', '\u00B7'],
  ['\u00C2\u00A3', '\u00A3'],
  ['\u00C2\u00A7', '\u00A7'],
  ['\u00C3\u00A9', '\u00E9'],
  ['\u00C2\u00A9', '\u00A9'],
];

fixes.forEach(([bad, good]) => {
  const count = c.split(bad).length - 1;
  if (count > 0) {
    c = c.split(bad).join(good);
    console.log('Fixed ' + count + 'x: ' + JSON.stringify(bad) + ' -> ' + good);
  }
});

fs.writeFileSync(path, c, 'utf8');
console.log('Done.');
