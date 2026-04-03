const express = require('express');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── PATHS ───────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'data');
const EXCEL_FILE = path.join(DATA_DIR, 'ledger.xlsx');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// ─── ENSURE DIRS EXIST ───────────────────────────────
[DATA_DIR, UPLOADS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ─── MULTER (image uploads) ───────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `bill_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── MIDDLEWARE ───────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── EXCEL HELPERS ────────────────────────────────────
const SHEETS = { SALES: 'Sales', BILLS: 'SupplierBills', PAYMENTS: 'SupplierPayments', SETTINGS: 'Settings' };

function readWorkbook() {
  if (!fs.existsSync(EXCEL_FILE)) return initWorkbook();
  try { return XLSX.readFile(EXCEL_FILE); }
  catch { return initWorkbook(); }
}

function initWorkbook() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['id','date','totalSale','cash','phonePe','notes','createdAt']
  ]), SHEETS.SALES);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['id','supplierName','billDate','billAmount','details','imagePath','createdAt']
  ]), SHEETS.BILLS);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['id','supplierName','paymentDate','amount','mode','note','linkedBillId','createdAt']
  ]), SHEETS.PAYMENTS);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['key','value'],
    ['shopName','Om Cloth Store Peeplu'],
    ['owners','Omprakash Vijay, Nishant Vijay'],
    ['waLink','https://chat.whatsapp.com/L1tVeyNHrB7HkxA9yUgSMA?mode=gi_t'],
    ['theme','dark'],
    ['language','en']
  ]), SHEETS.SETTINGS);
  saveWorkbook(wb);
  return wb;
}

function saveWorkbook(wb) {
  XLSX.writeFile(wb, EXCEL_FILE);
}

function sheetToJSON(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws);
}

function jsonToSheet(data, headers) {
  if (!data.length) return XLSX.utils.aoa_to_sheet([headers]);
  return XLSX.utils.json_to_sheet(data, { header: headers });
}

// ─── SETTINGS API ─────────────────────────────────────
app.get('/api/settings', (req, res) => {
  const wb = readWorkbook();
  const rows = sheetToJSON(wb, SHEETS.SETTINGS);
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const wb = readWorkbook();
  const updates = req.body;
  const rows = sheetToJSON(wb, SHEETS.SETTINGS);
  Object.entries(updates).forEach(([key, value]) => {
    const existing = rows.find(r => r.key === key);
    if (existing) existing.value = value;
    else rows.push({ key, value });
  });
  wb.Sheets[SHEETS.SETTINGS] = XLSX.utils.json_to_sheet(rows, { header: ['key','value'] });
  saveWorkbook(wb);
  res.json({ ok: true });
});

// ─── SALES API ────────────────────────────────────────
app.get('/api/sales', (req, res) => {
  const wb = readWorkbook();
  let rows = sheetToJSON(wb, SHEETS.SALES);
  const { from, to, date } = req.query;
  if (date) rows = rows.filter(r => r.date === date);
  if (from) rows = rows.filter(r => r.date >= from);
  if (to) rows = rows.filter(r => r.date <= to);
  rows.sort((a, b) => b.date > a.date ? 1 : -1);
  res.json(rows);
});

app.post('/api/sales', (req, res) => {
  const wb = readWorkbook();
  const rows = sheetToJSON(wb, SHEETS.SALES);
  const entry = {
    id: uuidv4(),
    date: req.body.date,
    totalSale: Number(req.body.totalSale) || 0,
    cash: Number(req.body.cash) || 0,
    phonePe: Number(req.body.phonePe) || 0,
    notes: req.body.notes || '',
    createdAt: new Date().toISOString()
  };
  rows.push(entry);
  wb.Sheets[SHEETS.SALES] = jsonToSheet(rows, ['id','date','totalSale','cash','phonePe','notes','createdAt']);
  saveWorkbook(wb);
  res.json(entry);
});

app.put('/api/sales/:id', (req, res) => {
  const wb = readWorkbook();
  const rows = sheetToJSON(wb, SHEETS.SALES);
  const idx = rows.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  rows[idx] = { ...rows[idx], ...req.body, id: req.params.id };
  rows[idx].totalSale = Number(rows[idx].totalSale);
  rows[idx].cash = Number(rows[idx].cash);
  rows[idx].phonePe = Number(rows[idx].phonePe);
  wb.Sheets[SHEETS.SALES] = jsonToSheet(rows, ['id','date','totalSale','cash','phonePe','notes','createdAt']);
  saveWorkbook(wb);
  res.json(rows[idx]);
});

app.delete('/api/sales/:id', (req, res) => {
  const wb = readWorkbook();
  let rows = sheetToJSON(wb, SHEETS.SALES);
  rows = rows.filter(r => r.id !== req.params.id);
  wb.Sheets[SHEETS.SALES] = jsonToSheet(rows, ['id','date','totalSale','cash','phonePe','notes','createdAt']);
  saveWorkbook(wb);
  res.json({ ok: true });
});

// ─── SUPPLIER BILLS API ───────────────────────────────
app.get('/api/bills', (req, res) => {
  const wb = readWorkbook();
  let rows = sheetToJSON(wb, SHEETS.BILLS);
  const { supplier, from, to } = req.query;
  if (supplier) rows = rows.filter(r => r.supplierName?.toLowerCase().includes(supplier.toLowerCase()));
  if (from) rows = rows.filter(r => r.billDate >= from);
  if (to) rows = rows.filter(r => r.billDate <= to);
  rows.sort((a, b) => b.billDate > a.billDate ? 1 : -1);
  res.json(rows);
});

app.post('/api/bills', upload.single('image'), (req, res) => {
  const wb = readWorkbook();
  const rows = sheetToJSON(wb, SHEETS.BILLS);
  const entry = {
    id: uuidv4(),
    supplierName: req.body.supplierName || '',
    billDate: req.body.billDate,
    billAmount: Number(req.body.billAmount) || 0,
    details: req.body.details || '',
    imagePath: req.file ? `/uploads/${req.file.filename}` : '',
    createdAt: new Date().toISOString()
  };
  rows.push(entry);
  wb.Sheets[SHEETS.BILLS] = jsonToSheet(rows, ['id','supplierName','billDate','billAmount','details','imagePath','createdAt']);
  saveWorkbook(wb);
  res.json(entry);
});

app.put('/api/bills/:id', upload.single('image'), (req, res) => {
  const wb = readWorkbook();
  const rows = sheetToJSON(wb, SHEETS.BILLS);
  const idx = rows.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  rows[idx] = { ...rows[idx], ...req.body, id: req.params.id };
  rows[idx].billAmount = Number(rows[idx].billAmount);
  if (req.file) rows[idx].imagePath = `/uploads/${req.file.filename}`;
  wb.Sheets[SHEETS.BILLS] = jsonToSheet(rows, ['id','supplierName','billDate','billAmount','details','imagePath','createdAt']);
  saveWorkbook(wb);
  res.json(rows[idx]);
});

app.delete('/api/bills/:id', (req, res) => {
  const wb = readWorkbook();
  let rows = sheetToJSON(wb, SHEETS.BILLS);
  rows = rows.filter(r => r.id !== req.params.id);
  wb.Sheets[SHEETS.BILLS] = jsonToSheet(rows, ['id','supplierName','billDate','billAmount','details','imagePath','createdAt']);
  saveWorkbook(wb);
  res.json({ ok: true });
});

// ─── SUPPLIER PAYMENTS API ────────────────────────────
app.get('/api/payments', (req, res) => {
  const wb = readWorkbook();
  let rows = sheetToJSON(wb, SHEETS.PAYMENTS);
  const { supplier, from, to } = req.query;
  if (supplier) rows = rows.filter(r => r.supplierName?.toLowerCase().includes(supplier.toLowerCase()));
  if (from) rows = rows.filter(r => r.paymentDate >= from);
  if (to) rows = rows.filter(r => r.paymentDate <= to);
  rows.sort((a, b) => b.paymentDate > a.paymentDate ? 1 : -1);
  res.json(rows);
});

app.post('/api/payments', (req, res) => {
  const wb = readWorkbook();
  const rows = sheetToJSON(wb, SHEETS.PAYMENTS);
  const entry = {
    id: uuidv4(),
    supplierName: req.body.supplierName || '',
    paymentDate: req.body.paymentDate,
    amount: Number(req.body.amount) || 0,
    mode: req.body.mode || 'Cash',
    note: req.body.note || '',
    linkedBillId: req.body.linkedBillId || '',
    createdAt: new Date().toISOString()
  };
  rows.push(entry);
  wb.Sheets[SHEETS.PAYMENTS] = jsonToSheet(rows, ['id','supplierName','paymentDate','amount','mode','note','linkedBillId','createdAt']);
  saveWorkbook(wb);
  res.json(entry);
});

app.put('/api/payments/:id', (req, res) => {
  const wb = readWorkbook();
  const rows = sheetToJSON(wb, SHEETS.PAYMENTS);
  const idx = rows.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  rows[idx] = { ...rows[idx], ...req.body, id: req.params.id, amount: Number(req.body.amount || rows[idx].amount) };
  wb.Sheets[SHEETS.PAYMENTS] = jsonToSheet(rows, ['id','supplierName','paymentDate','amount','mode','note','linkedBillId','createdAt']);
  saveWorkbook(wb);
  res.json(rows[idx]);
});

app.delete('/api/payments/:id', (req, res) => {
  const wb = readWorkbook();
  let rows = sheetToJSON(wb, SHEETS.PAYMENTS);
  rows = rows.filter(r => r.id !== req.params.id);
  wb.Sheets[SHEETS.PAYMENTS] = jsonToSheet(rows, ['id','supplierName','paymentDate','amount','mode','note','linkedBillId','createdAt']);
  saveWorkbook(wb);
  res.json({ ok: true });
});

// ─── REPORTS API ──────────────────────────────────────
app.get('/api/reports', (req, res) => {
  const wb = readWorkbook();
  const { from, to } = req.query;
  let sales = sheetToJSON(wb, SHEETS.SALES);
  let bills = sheetToJSON(wb, SHEETS.BILLS);
  let payments = sheetToJSON(wb, SHEETS.PAYMENTS);

  if (from) {
    sales = sales.filter(r => r.date >= from);
    bills = bills.filter(r => r.billDate >= from);
    payments = payments.filter(r => r.paymentDate >= from);
  }
  if (to) {
    sales = sales.filter(r => r.date <= to);
    bills = bills.filter(r => r.billDate <= to);
    payments = payments.filter(r => r.paymentDate <= to);
  }

  const totalSale = sales.reduce((s, r) => s + Number(r.totalSale||0), 0);
  const totalCash = sales.reduce((s, r) => s + Number(r.cash||0), 0);
  const totalPhonePe = sales.reduce((s, r) => s + Number(r.phonePe||0), 0);
  const totalBills = bills.reduce((s, r) => s + Number(r.billAmount||0), 0);
  const totalPayments = payments.reduce((s, r) => s + Number(r.amount||0), 0);

  // supplier-wise
  const supplierBills = {};
  bills.forEach(b => {
    supplierBills[b.supplierName] = (supplierBills[b.supplierName]||0) + Number(b.billAmount||0);
  });
  const supplierPaid = {};
  payments.forEach(p => {
    supplierPaid[p.supplierName] = (supplierPaid[p.supplierName]||0) + Number(p.amount||0);
  });
  const supplierPending = {};
  Object.keys(supplierBills).forEach(name => {
    supplierPending[name] = (supplierBills[name]||0) - (supplierPaid[name]||0);
  });

  res.json({
    totalSale, totalCash, totalPhonePe,
    totalBills, totalPayments, pendingDues: totalBills - totalPayments,
    supplierBills, supplierPaid, supplierPending,
    salesCount: sales.length,
    billsCount: bills.length
  });
});

// ─── DOWNLOAD EXCEL ───────────────────────────────────
app.get('/api/download-excel', (req, res) => {
  if (!fs.existsSync(EXCEL_FILE)) return res.status(404).json({ error: 'No data yet' });
  res.download(EXCEL_FILE, 'OmClothStore_Ledger.xlsx');
});

// ─── SPA FALLBACK ─────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Om Cloth Store Ledger running on port ${PORT}`));
