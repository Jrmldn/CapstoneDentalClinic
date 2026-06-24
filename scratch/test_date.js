const d = new Date();
console.log('UTC ISOString:', d.toISOString());
console.log('UTC date part:', d.toISOString().slice(0, 10));

// Method 1: Using toLocaleDateString with en-CA which outputs YYYY-MM-DD
const manilaDateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
console.log('Manila date (en-CA):', manilaDateStr);

// Method 2: Manual offset adjustment
const offset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const manilaTime = new Date(d.getTime() + offset);
console.log('Manila date (offset-adjusted):', manilaTime.toISOString().slice(0, 10));
