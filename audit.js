const data = require('./data/overlays/catalog/cities.json');
const map = new Map();
data.forEach((c, i) => {
  const key = Math.round(c.lat*1000)/1000 + ',' + Math.round(c.lon*1000)/1000;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push([i, c.id, c.name, c.category, c.lat, c.lon]);
});
let dups = 0;
map.forEach(arr => {
  if (arr.length > 1) {
    dups++;
    console.log('COLLISION @', arr[0].slice(4,6).join(','));
    arr.forEach(a => console.log('  #'+a[0], a[1], '|', a[3], '|', a[2]));
  }
});
console.log('Total:', data.length, 'items.', dups, 'duplicate keys (to 3dp).');
console.log('Category counts:');
const cat = {};
data.forEach(c => cat[c.category] = (cat[c.category]||0)+1);
Object.entries(cat).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log('  '+k.padEnd(20), v));
