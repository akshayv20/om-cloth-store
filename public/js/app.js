// ─── STATE ─────────────────────────────────────────────
const State = {
  settings: {
    shopName: 'Om Cloth Store Peeplu',
    owners: 'Omprakash Vijay, Nishant Vijay',
    waLink: 'https://chat.whatsapp.com/L1tVeyNHrB7HkxA9yUgSMA?mode=gi_t',
    theme: 'dark', language: 'en'
  },
  sales: [], bills: [], payments: [],
  currentPage: 'dashboard',
  waMessage: '',
  deleteCallback: null
};

// ─── UTILS ──────────────────────────────────────────────
const fmt = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtDate = s => {
  if (!s) return '';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const today = () => new Date().toISOString().split('T')[0];
const thisMonth = () => today().slice(0, 7);

async function api(method, url, body, isFormData = false) {
  const opts = { method, headers: {} };
  if (body) {
    if (isFormData) { opts.body = body; }
    else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  }
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── TOAST ──────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type ? ' ' + type : '');
  setTimeout(() => t.className = 'toast', 2200);
}

// ─── MODAL ──────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ─── NAV ────────────────────────────────────────────────
function nav(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  (btn || document.querySelector(`.nav-btn[data-page="${page}"]`))?.classList.add('active');
  State.currentPage = page;
  if (page === 'dashboard') loadDashboard();
  else if (page === 'sales') loadSales();
  else if (page === 'bills') loadBills();
  else if (page === 'payments') loadPayments();
  else if (page === 'reports') initReports();
  else if (page === 'settings') loadSettings();
}

// ─── THEME ──────────────────────────────────────────────
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  State.settings.theme = t;
  localStorage.setItem('ocs_theme', t);
  document.querySelectorAll('.toggle-opt').forEach(b => {
    if (b.id === 'tDark' || b.id === 'tLight') b.classList.remove('active');
  });
  document.getElementById(t === 'dark' ? 'tDark' : 'tLight')?.classList.add('active');
  api('POST', '/api/settings', { theme: t }).catch(() => {});
}
function setLang(l) {
  I18n.setLang(l);
  State.settings.language = l;
  document.querySelectorAll('.toggle-opt').forEach(b => {
    if (b.id === 'lEn' || b.id === 'lHi') b.classList.remove('active');
  });
  document.getElementById(l === 'en' ? 'lEn' : 'lHi')?.classList.add('active');
  api('POST', '/api/settings', { language: l }).catch(() => {});
}

// ─── SETTINGS ───────────────────────────────────────────
async function loadSettings() {
  try {
    const s = await api('GET', '/api/settings');
    Object.assign(State.settings, s);
    document.getElementById('setShopName').value = s.shopName || '';
    document.getElementById('setOwners').value = s.owners || '';
    document.getElementById('setWaLink').value = s.waLink || '';
    setTheme(s.theme || 'dark');
    setLang(s.language || 'en');
  } catch (e) { console.error(e); }
}
async function saveShopSettings() {
  const s = { shopName: document.getElementById('setShopName').value.trim(), owners: document.getElementById('setOwners').value.trim() };
  if (!s.shopName) return showToast('Shop name is required', 'error');
  Object.assign(State.settings, s);
  document.getElementById('topShopName').textContent = s.shopName;
  try { await api('POST', '/api/settings', s); showToast('Saved!', 'success'); }
  catch { showToast('Error saving', 'error'); }
}
async function saveWASettings() {
  const s = { waLink: document.getElementById('setWaLink').value.trim() };
  Object.assign(State.settings, s);
  try { await api('POST', '/api/settings', s); showToast('WhatsApp link saved!', 'success'); }
  catch { showToast('Error saving', 'error'); }
}

// ─── DASHBOARD ──────────────────────────────────────────
async function loadDashboard() {
  const todayStr = today();
  document.getElementById('topShopName').textContent = State.settings.shopName || 'Om Cloth Store';
  document.getElementById('dashSubtitle').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  try {
    const [sales, bills, payments, reports] = await Promise.all([
      api('GET', `/api/sales?date=${todayStr}`),
      api('GET', `/api/bills?from=${todayStr}&to=${todayStr}`),
      api('GET', `/api/payments?from=${todayStr}&to=${todayStr}`),
      api('GET', '/api/reports')
    ]);

    const todaySale = sales.reduce((s, r) => s + Number(r.totalSale || 0), 0);
    const todayCash = sales.reduce((s, r) => s + Number(r.cash || 0), 0);
    const todayPhonePe = sales.reduce((s, r) => s + Number(r.phonePe || 0), 0);
    const todayBills = bills.reduce((s, r) => s + Number(r.billAmount || 0), 0);
    const todayPaid = payments.reduce((s, r) => s + Number(r.amount || 0), 0);

    document.getElementById('kpiTodaySale').textContent = fmt(todaySale);
    document.getElementById('kpiTodayCash').textContent = fmt(todayCash);
    document.getElementById('kpiTodayPhonePe').textContent = fmt(todayPhonePe);
    document.getElementById('kpiTodayBills').textContent = fmt(todayBills);
    document.getElementById('kpiTodayPaid').textContent = fmt(todayPaid);
    document.getElementById('kpiPending').textContent = fmt(reports.pendingDues || 0);

    // Recent activity
    const allRecent = [
      ...sales.map(r => ({ type: 'sale', date: r.date, name: 'Sale', amount: r.totalSale, ts: r.createdAt })),
      ...bills.map(r => ({ type: 'bill', date: r.billDate, name: r.supplierName, amount: r.billAmount, ts: r.createdAt })),
      ...payments.map(r => ({ type: 'payment', date: r.paymentDate, name: r.supplierName, amount: r.amount, ts: r.createdAt }))
    ].sort((a, b) => b.ts > a.ts ? 1 : -1).slice(0, 6);

    const ra = document.getElementById('recentActivity');
    if (!allRecent.length) {
      ra.innerHTML = `<div class="empty-state"><div class="empty-icon">◻</div><p class="empty-text">No activity today yet.</p></div>`;
    } else {
      ra.innerHTML = allRecent.map(a => `
        <div class="activity-item">
          <div class="act-left">
            <div class="act-type">${a.type === 'sale' ? 'Sale' : a.type === 'bill' ? 'Supplier Bill' : 'Payment'}</div>
            <div class="act-name">${a.name}</div>
          </div>
          <div class="act-right act-${a.type}">${fmt(a.amount)}</div>
        </div>`).join('');
    }
  } catch (e) { console.error(e); }
}

// ─── SALES ──────────────────────────────────────────────
let salesData = [];
async function loadSales() {
  const month = document.getElementById('salesMonthFilter').value || thisMonth();
  const [from, to] = monthRange(month);
  document.getElementById('salesList').innerHTML = '<div class="loading">Loading...</div>';
  try {
    salesData = await api('GET', `/api/sales?from=${from}&to=${to}`);
    renderSales();
    updateSalesSummary();
  } catch { showToast('Error loading sales', 'error'); }
}
function monthRange(m) {
  const [y, mo] = m.split('-').map(Number);
  const from = `${y}-${String(mo).padStart(2,'0')}-01`;
  const last = new Date(y, mo, 0).getDate();
  const to = `${y}-${String(mo).padStart(2,'0')}-${last}`;
  return [from, to];
}
function filterSalesList() {
  renderSales();
}
function renderSales() {
  const q = document.getElementById('salesSearch').value.toLowerCase();
  const list = salesData.filter(r => !q || r.date.includes(q) || (r.notes || '').toLowerCase().includes(q));
  const el = document.getElementById('salesList');
  if (!list.length) { el.innerHTML = emptyState(); return; }
  el.innerHTML = list.map(r => `
    <div class="data-card">
      <div class="dc-header">
        <div><div class="dc-date">${fmtDate(r.date)}</div><div class="dc-title">Daily Sale</div></div>
        <div class="dc-amount sale-amt">${fmt(r.totalSale)}</div>
      </div>
      <div class="dc-meta">
        <span class="dc-tag green">Cash: ${fmt(r.cash)}</span>
        <span class="dc-tag blue">PhonePe: ${fmt(r.phonePe)}</span>
        ${r.notes ? `<span class="dc-tag">${r.notes}</span>` : ''}
      </div>
      <div class="dc-actions">
        <button class="dc-btn wa" onclick="showSaleWA(${JSON.stringify(r).replace(/"/g,'&quot;')})">WA</button>
        <button class="dc-btn" onclick="editSale(${JSON.stringify(r).replace(/"/g,'&quot;')})">Edit</button>
        <button class="dc-btn del" onclick="confirmDelete('sale','${r.id}')">Delete</button>
      </div>
    </div>`).join('');
}
function updateSalesSummary() {
  const total = salesData.reduce((s, r) => s + Number(r.totalSale || 0), 0);
  const cash = salesData.reduce((s, r) => s + Number(r.cash || 0), 0);
  const phonePe = salesData.reduce((s, r) => s + Number(r.phonePe || 0), 0);
  document.getElementById('salesSummaryBar').innerHTML = `
    <div class="sum-chip"><div class="sc-label">Total</div><div class="sc-val" style="color:var(--accent-light)">${fmt(total)}</div></div>
    <div class="sum-chip"><div class="sc-label">Cash</div><div class="sc-val" style="color:var(--green)">${fmt(cash)}</div></div>
    <div class="sum-chip"><div class="sc-label">PhonePe</div><div class="sc-val" style="color:var(--blue)">${fmt(phonePe)}</div></div>
    <div class="sum-chip"><div class="sc-label">Entries</div><div class="sc-val">${salesData.length}</div></div>`;
}

function openSaleForm() {
  document.getElementById('saleId').value = '';
  document.getElementById('saleDate').value = today();
  document.getElementById('saleTotalAmount').value = '';
  document.getElementById('saleCash').value = '';
  document.getElementById('salePhonePe').value = '';
  document.getElementById('saleNotes').value = '';
  document.getElementById('saleValidation').className = 'validation-hint';
  document.getElementById('saleModalTitle').textContent = I18n.t('addSale');
  openModal('saleModal');
}
function editSale(r) {
  document.getElementById('saleId').value = r.id;
  document.getElementById('saleDate').value = r.date;
  document.getElementById('saleTotalAmount').value = r.totalSale;
  document.getElementById('saleCash').value = r.cash;
  document.getElementById('salePhonePe').value = r.phonePe;
  document.getElementById('saleNotes').value = r.notes || '';
  document.getElementById('saleModalTitle').textContent = I18n.t('editSale');
  document.getElementById('saleValidation').className = 'validation-hint';
  openModal('saleModal');
}
function calcSaleTotal() {
  const cash = parseFloat(document.getElementById('saleCash').value) || 0;
  const pp = parseFloat(document.getElementById('salePhonePe').value) || 0;
  if (cash || pp) {
    document.getElementById('saleTotalAmount').value = cash + pp;
    validateSale();
  }
}
function autoSplitSale() {
  validateSale();
}
function validateSale() {
  const total = parseFloat(document.getElementById('saleTotalAmount').value) || 0;
  const cash = parseFloat(document.getElementById('saleCash').value) || 0;
  const pp = parseFloat(document.getElementById('salePhonePe').value) || 0;
  const hint = document.getElementById('saleValidation');
  if (!total && !cash && !pp) { hint.className = 'validation-hint'; return true; }
  if (cash + pp !== total && (cash || pp) && total) {
    hint.textContent = `Cash (${fmt(cash)}) + PhonePe (${fmt(pp)}) = ${fmt(cash+pp)} ≠ Total (${fmt(total)})`;
    hint.className = 'validation-hint error'; return false;
  }
  if (cash + pp === total) {
    hint.textContent = `✓ Cash + PhonePe = ${fmt(total)}`;
    hint.className = 'validation-hint ok';
  } else { hint.className = 'validation-hint'; }
  return true;
}
async function saveSale(e) {
  e.preventDefault();
  const id = document.getElementById('saleId').value;
  const cash = parseFloat(document.getElementById('saleCash').value) || 0;
  const pp = parseFloat(document.getElementById('salePhonePe').value) || 0;
  let total = parseFloat(document.getElementById('saleTotalAmount').value) || 0;
  if (!total && (cash || pp)) total = cash + pp;
  if (!total) return showToast('Enter sale amount', 'error');
  const body = {
    date: document.getElementById('saleDate').value,
    totalSale: total, cash, phonePe: pp,
    notes: document.getElementById('saleNotes').value.trim()
  };
  try {
    if (id) await api('PUT', `/api/sales/${id}`, body);
    else await api('POST', '/api/sales', body);
    closeModal('saleModal');
    showToast(id ? 'Sale updated!' : 'Sale saved!', 'success');
    loadSales();
    if (State.currentPage === 'dashboard') loadDashboard();
  } catch { showToast('Error saving sale', 'error'); }
}

// ─── BILLS ──────────────────────────────────────────────
let billsData = [];
async function loadBills() {
  const month = document.getElementById('billsMonthFilter').value || thisMonth();
  const [from, to] = monthRange(month);
  const supplier = document.getElementById('billsSupplierFilter').value;
  let url = `/api/bills?from=${from}&to=${to}`;
  if (supplier) url += `&supplier=${encodeURIComponent(supplier)}`;
  document.getElementById('billsList').innerHTML = '<div class="loading">Loading...</div>';
  try {
    billsData = await api('GET', url);
    renderBills();
  } catch { showToast('Error loading bills', 'error'); }
}
function renderBills() {
  const el = document.getElementById('billsList');
  if (!billsData.length) { el.innerHTML = emptyState(); return; }
  el.innerHTML = billsData.map(r => `
    <div class="data-card">
      <div class="dc-header">
        <div style="flex:1">
          <div class="dc-date">${fmtDate(r.billDate)}</div>
          <div class="dc-title">${r.supplierName}</div>
          ${r.details ? `<div style="font-size:12px;color:var(--text-muted);margin-top:3px">${r.details}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <div class="dc-amount bill-amt">${fmt(r.billAmount)}</div>
          ${r.imagePath ? `<img src="${r.imagePath}" class="dc-bill-img" onclick="App.viewImage('${r.imagePath}')" alt="Bill">` : ''}
        </div>
      </div>
      <div class="dc-actions">
        <button class="dc-btn wa" onclick="showBillWA(${JSON.stringify(r).replace(/"/g,'&quot;')})">WA</button>
        <button class="dc-btn" onclick="editBill(${JSON.stringify(r).replace(/"/g,'&quot;')})">Edit</button>
        <button class="dc-btn del" onclick="confirmDelete('bill','${r.id}')">Delete</button>
      </div>
    </div>`).join('');
}

function openBillForm() {
  document.getElementById('billId').value = '';
  document.getElementById('billSupplier').value = '';
  document.getElementById('billDate').value = today();
  document.getElementById('billAmount').value = '';
  document.getElementById('billDetails').value = '';
  document.getElementById('billImagePreview').innerHTML = '<span class="upload-hint">Tap to capture / upload bill photo</span>';
  document.getElementById('billImageInput').value = '';
  document.getElementById('billModalTitle').textContent = I18n.t('addBill');
  openModal('billModal');
}
function editBill(r) {
  document.getElementById('billId').value = r.id;
  document.getElementById('billSupplier').value = r.supplierName;
  document.getElementById('billDate').value = r.billDate;
  document.getElementById('billAmount').value = r.billAmount;
  document.getElementById('billDetails').value = r.details || '';
  document.getElementById('billImagePreview').innerHTML = r.imagePath
    ? `<img src="${r.imagePath}" alt="Bill" style="max-height:180px;max-width:100%;border-radius:8px">`
    : '<span class="upload-hint">Tap to capture / upload bill photo</span>';
  document.getElementById('billModalTitle').textContent = I18n.t('editBill');
  openModal('billModal');
}
function previewBillImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  document.getElementById('billImagePreview').innerHTML = `<img src="${url}" style="max-height:180px;max-width:100%;border-radius:8px">`;
}
async function saveBill(e) {
  e.preventDefault();
  const id = document.getElementById('billId').value;
  const fd = new FormData();
  fd.append('supplierName', document.getElementById('billSupplier').value.trim());
  fd.append('billDate', document.getElementById('billDate').value);
  fd.append('billAmount', document.getElementById('billAmount').value);
  fd.append('details', document.getElementById('billDetails').value.trim());
  const img = document.getElementById('billImageInput').files[0];
  if (img) fd.append('image', img);
  try {
    if (id) await fetch(`/api/bills/${id}`, { method: 'PUT', body: fd });
    else await fetch('/api/bills', { method: 'POST', body: fd });
    closeModal('billModal');
    showToast(id ? 'Bill updated!' : 'Bill saved!', 'success');
    loadBills();
    if (State.currentPage === 'dashboard') loadDashboard();
  } catch { showToast('Error saving bill', 'error'); }
}

// ─── PAYMENTS ───────────────────────────────────────────
let paymentsData = [];
async function loadPayments() {
  const month = document.getElementById('paymentsMonthFilter').value || thisMonth();
  const [from, to] = monthRange(month);
  const supplier = document.getElementById('paymentsSupplierFilter').value;
  let url = `/api/payments?from=${from}&to=${to}`;
  if (supplier) url += `&supplier=${encodeURIComponent(supplier)}`;
  document.getElementById('paymentsList').innerHTML = '<div class="loading">Loading...</div>';
  try {
    paymentsData = await api('GET', url);
    renderPayments();
    renderDuesSummary();
    loadSupplierSuggestions();
  } catch { showToast('Error loading payments', 'error'); }
}
function renderPayments() {
  const el = document.getElementById('paymentsList');
  if (!paymentsData.length) { el.innerHTML = emptyState(); return; }
  el.innerHTML = paymentsData.map(r => `
    <div class="data-card">
      <div class="dc-header">
        <div><div class="dc-date">${fmtDate(r.paymentDate)}</div><div class="dc-title">${r.supplierName}</div>
        ${r.note ? `<div style="font-size:12px;color:var(--text-muted);margin-top:3px">${r.note}</div>` : ''}</div>
        <div class="dc-amount pay-amt">${fmt(r.amount)}</div>
      </div>
      <div class="dc-meta"><span class="dc-tag green">${r.mode}</span></div>
      <div class="dc-actions">
        <button class="dc-btn wa" onclick="showPaymentWA(${JSON.stringify(r).replace(/"/g,'&quot;')})">WA</button>
        <button class="dc-btn" onclick="editPayment(${JSON.stringify(r).replace(/"/g,'&quot;')})">Edit</button>
        <button class="dc-btn del" onclick="confirmDelete('payment','${r.id}')">Delete</button>
      </div>
    </div>`).join('');
}
async function renderDuesSummary() {
  try {
    const r = await api('GET', '/api/reports');
    const el = document.getElementById('supplierDuesSummary');
    const pending = r.supplierPending || {};
    const suppliers = Object.keys(pending).filter(k => pending[k] > 0);
    if (!suppliers.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="section-title">Pending Dues</div>` +
      suppliers.map(name => `
        <div class="dues-card">
          <div class="dues-name">${name}</div>
          <div class="dues-amounts">
            <div class="dues-pending">${fmt(pending[name])}</div>
            <div class="dues-sub">Bill: ${fmt(r.supplierBills[name]||0)} · Paid: ${fmt(r.supplierPaid[name]||0)}</div>
          </div>
        </div>`).join('');
  } catch {}
}
async function loadSupplierSuggestions() {
  try {
    const bills = await api('GET', '/api/bills');
    const names = [...new Set(bills.map(b => b.supplierName))];
    document.getElementById('supplierSuggestions').innerHTML = names.map(n => `<option value="${n}">`).join('');
  } catch {}
}

function openPaymentForm() {
  document.getElementById('paymentId').value = '';
  document.getElementById('paymentSupplier').value = '';
  document.getElementById('paymentDate').value = today();
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentMode').value = 'Cash';
  document.getElementById('paymentNote').value = '';
  document.getElementById('paymentModalTitle').textContent = I18n.t('addPayment');
  openModal('paymentModal');
}
function editPayment(r) {
  document.getElementById('paymentId').value = r.id;
  document.getElementById('paymentSupplier').value = r.supplierName;
  document.getElementById('paymentDate').value = r.paymentDate;
  document.getElementById('paymentAmount').value = r.amount;
  document.getElementById('paymentMode').value = r.mode;
  document.getElementById('paymentNote').value = r.note || '';
  document.getElementById('paymentModalTitle').textContent = I18n.t('editPayment');
  openModal('paymentModal');
}
async function savePayment(e) {
  e.preventDefault();
  const id = document.getElementById('paymentId').value;
  const body = {
    supplierName: document.getElementById('paymentSupplier').value.trim(),
    paymentDate: document.getElementById('paymentDate').value,
    amount: parseFloat(document.getElementById('paymentAmount').value) || 0,
    mode: document.getElementById('paymentMode').value,
    note: document.getElementById('paymentNote').value.trim()
  };
  if (!body.supplierName || !body.amount) return showToast('Fill required fields', 'error');
  try {
    if (id) await api('PUT', `/api/payments/${id}`, body);
    else await api('POST', '/api/payments', body);
    closeModal('paymentModal');
    showToast(id ? 'Payment updated!' : 'Payment saved!', 'success');
    loadPayments();
    if (State.currentPage === 'dashboard') loadDashboard();
  } catch { showToast('Error saving payment', 'error'); }
}

// ─── DELETE ─────────────────────────────────────────────
function confirmDelete(type, id) {
  document.getElementById('confirmText').textContent = I18n.t('deleteConfirm');
  State.deleteCallback = async () => {
    try {
      if (type === 'sale') await api('DELETE', `/api/sales/${id}`);
      else if (type === 'bill') await api('DELETE', `/api/bills/${id}`);
      else await api('DELETE', `/api/payments/${id}`);
      closeModal('confirmModal');
      showToast('Deleted', 'success');
      if (type === 'sale') loadSales();
      else if (type === 'bill') loadBills();
      else loadPayments();
    } catch { showToast('Error deleting', 'error'); }
  };
  document.getElementById('confirmOkBtn').onclick = State.deleteCallback;
  openModal('confirmModal');
}

// ─── REPORTS ────────────────────────────────────────────
function initReports() {
  const now = today();
  const firstOfMonth = now.slice(0, 8) + '01';
  document.getElementById('reportFrom').value = firstOfMonth;
  document.getElementById('reportTo').value = now;
  loadReports();
}
async function loadReports() {
  const from = document.getElementById('reportFrom').value;
  const to = document.getElementById('reportTo').value;
  let url = '/api/reports';
  if (from) url += `?from=${from}`;
  if (to) url += `${from ? '&' : '?'}to=${to}`;
  try {
    const r = await api('GET', url);
    const el = document.getElementById('reportCards');
    el.innerHTML = `
      <div class="report-card"><div class="rc-label">Total Sales</div><div class="rc-val gold">${fmt(r.totalSale)}</div></div>
      <div class="report-card"><div class="rc-label">Cash</div><div class="rc-val green">${fmt(r.totalCash)}</div></div>
      <div class="report-card"><div class="rc-label">PhonePe</div><div class="rc-val blue">${fmt(r.totalPhonePe)}</div></div>
      <div class="report-card"><div class="rc-label">Total Bills</div><div class="rc-val red">${fmt(r.totalBills)}</div></div>
      <div class="report-card"><div class="rc-label">Total Paid</div><div class="rc-val green">${fmt(r.totalPayments)}</div></div>
      <div class="report-card"><div class="rc-label">Pending Dues</div><div class="rc-val red">${fmt(r.pendingDues)}</div></div>`;
    // Supplier report
    const supp = r.supplierPending || {};
    const suppNames = Object.keys(r.supplierBills || {});
    if (suppNames.length) {
      document.getElementById('supplierReport').innerHTML =
        `<div class="section-title" style="margin-top:8px">Supplier Summary</div>` +
        suppNames.map(name => `
          <div class="sup-row">
            <div>
              <div class="sup-row-name">${name}</div>
              <div style="font-size:11px;color:var(--text-muted)">Paid: ${fmt(r.supplierPaid[name]||0)}</div>
            </div>
            <div style="text-align:right">
              <div class="sup-row-amt" style="color:var(--red)">${fmt(supp[name]||0)}</div>
              <div style="font-size:10px;color:var(--text-muted)">Bill: ${fmt(r.supplierBills[name]||0)}</div>
            </div>
          </div>`).join('');
    } else { document.getElementById('supplierReport').innerHTML = ''; }
    State.lastReport = r;
  } catch { showToast('Error loading reports', 'error'); }
}

// ─── WHATSAPP MESSAGES ──────────────────────────────────
const shop = () => (State.settings.shopName || 'Om Cloth Store').toUpperCase();
const owners = () => State.settings.owners || 'Omprakash Vijay, Nishant Vijay';
const msgDate = (d) => d ? fmtDate(d) : fmtDate(today());
const LINE = '-----------------------------------';

function showSaleWA(r) {
  const msg = `${LINE}\n${shop()}\nDate: ${msgDate(r.date)}\n\nDAILY SALES\nTotal Sale: ${fmt(r.totalSale)}\nCash: ${fmt(r.cash)}\nPhonePe: ${fmt(r.phonePe)}\n${r.notes ? `Notes: ${r.notes}\n` : ''}\nOwners: ${owners()}\n${LINE}`;
  showWAModal(msg);
}
function showBillWA(r) {
  const msg = `${LINE}\n${shop()}\nDate: ${msgDate(r.billDate)}\n\nSUPPLIER BILL\nSupplier: ${r.supplierName}\nBill Amount: ${fmt(r.billAmount)}\n${r.details ? `Details: ${r.details}\n` : ''}Owners: ${owners()}\n${LINE}`;
  showWAModal(msg);
}
function showPaymentWA(r) {
  const msg = `${LINE}\n${shop()}\nDate: ${msgDate(r.paymentDate)}\n\nSUPPLIER PAYMENT\nSupplier: ${r.supplierName}\nPaid: ${fmt(r.amount)}\nMode: ${r.mode}\n${r.note ? `Note: ${r.note}\n` : ''}Owners: ${owners()}\n${LINE}`;
  showWAModal(msg);
}
async function showDailySummaryWA() {
  const todayStr = today();
  try {
    const [sales, bills, payments, reports] = await Promise.all([
      api('GET', `/api/sales?date=${todayStr}`),
      api('GET', `/api/bills?from=${todayStr}&to=${todayStr}`),
      api('GET', `/api/payments?from=${todayStr}&to=${todayStr}`),
      api('GET', '/api/reports')
    ]);
    const totalSale = sales.reduce((s, r) => s + Number(r.totalSale||0), 0);
    const totalCash = sales.reduce((s, r) => s + Number(r.cash||0), 0);
    const totalPP = sales.reduce((s, r) => s + Number(r.phonePe||0), 0);
    let msg = `${LINE}\n${shop()}\nDate: ${msgDate(todayStr)}\n\nDAILY SUMMARY\n\nTotal Sale: ${fmt(totalSale)}\nCash: ${fmt(totalCash)}\nPhonePe: ${fmt(totalPP)}`;
    if (bills.length) {
      msg += `\n\nSupplier Bills:`;
      bills.forEach(b => { msg += `\n- ${b.supplierName}: ${fmt(b.billAmount)}`; });
    }
    if (payments.length) {
      msg += `\n\nSupplier Payments:`;
      payments.forEach(p => { msg += `\n- ${p.supplierName}: ${fmt(p.amount)} (${p.mode})`; });
    }
    const pending = reports.supplierPending || {};
    const pendingKeys = Object.keys(pending).filter(k => pending[k] > 0);
    if (pendingKeys.length) {
      msg += `\n\nPending:`;
      pendingKeys.forEach(name => { msg += `\n- ${name}: ${fmt(pending[name])}`; });
    }
    msg += `\n\nOwners: ${owners()}\n${LINE}`;
    showWAModal(msg);
  } catch { showToast('Error generating message', 'error'); }
}
async function showSummaryWAReport() {
  const from = document.getElementById('reportFrom').value;
  const to = document.getElementById('reportTo').value;
  const r = State.lastReport;
  if (!r) return showToast('Generate report first', 'error');
  const supp = r.supplierPending || {};
  const suppNames = Object.keys(r.supplierBills || {});
  let msg = `${LINE}\n${shop()}\nReport: ${fmtDate(from)} to ${fmtDate(to)}\n\nSALES SUMMARY\nTotal Sale: ${fmt(r.totalSale)}\nCash: ${fmt(r.totalCash)}\nPhonePe: ${fmt(r.totalPhonePe)}\n\nSUPPLIER SUMMARY\nTotal Bills: ${fmt(r.totalBills)}\nTotal Paid: ${fmt(r.totalPayments)}\nPending: ${fmt(r.pendingDues)}`;
  if (suppNames.length) {
    msg += `\n\nSupplier Outstanding:`;
    suppNames.forEach(name => { if (supp[name] > 0) msg += `\n- ${name}: ${fmt(supp[name])}`; });
  }
  msg += `\n\nOwners: ${owners()}\n${LINE}`;
  showWAModal(msg);
}
function showWAModal(msg) {
  State.waMessage = msg;
  document.getElementById('waMessagePreview').textContent = msg;
  document.getElementById('copyConfirm').style.display = 'none';
  openModal('waModal');
}
function copyWAMessage() {
  navigator.clipboard.writeText(State.waMessage).then(() => {
    document.getElementById('copyConfirm').style.display = 'block';
    showToast('Copied!', 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = State.waMessage;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    document.getElementById('copyConfirm').style.display = 'block';
    showToast('Copied!', 'success');
  });
}
function openWA() {
  const waLink = State.settings.waLink;
  const encoded = encodeURIComponent(State.waMessage);
  if (waLink && waLink.startsWith('https://chat.whatsapp.com')) {
    window.open(waLink, '_blank');
    showToast('Copy message first, then paste in group', '');
  } else if (waLink && !waLink.startsWith('http')) {
    window.open(`https://wa.me/${waLink}?text=${encoded}`, '_blank');
  } else {
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
}

// ─── IMAGE VIEWER ────────────────────────────────────────
function viewImage(src) {
  document.getElementById('fullImage').src = src;
  openModal('imageModal');
}

// ─── EMPTY STATE ────────────────────────────────────────
function emptyState() {
  return `<div class="empty-state"><div class="empty-icon">◻</div><p class="empty-text">${I18n.t('noData')}<br>${I18n.t('addFirst')}</p></div>`;
}

// ─── TOPBAR DATE ────────────────────────────────────────
function updateTopbarDate() {
  document.getElementById('topbarDate').textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── CLOSE MODAL ON OVERLAY CLICK ───────────────────────
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ─── THEME & LANG TOGGLE BUTTONS ────────────────────────
document.getElementById('themeToggleBtn').addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  setTheme(cur === 'dark' ? 'light' : 'dark');
});
document.getElementById('langToggleBtn').addEventListener('click', () => {
  const cur = I18n.lang;
  setLang(cur === 'en' ? 'hi' : 'en');
  document.getElementById('langToggleBtn').textContent = I18n.lang === 'en' ? 'A' : 'अ';
});

// ─── EXPOSE GLOBALLY FOR INLINE HANDLERS ────────────────
const App = {
  nav, openSaleForm, openBillForm, openPaymentForm,
  closeModal, saveSale, saveBill, savePayment,
  loadSales, loadBills, loadPayments, loadReports, filterSalesList,
  calcSaleTotal, autoSplitSale,
  previewBillImage,
  showDailySummaryWA, showSummaryWAReport,
  copyWAMessage, openWA,
  saveShopSettings, saveWASettings,
  setTheme, setLang,
  viewImage
};
window.showSaleWA = showSaleWA;
window.showBillWA = showBillWA;
window.showPaymentWA = showPaymentWA;
window.editSale = editSale;
window.editBill = editBill;
window.editPayment = editPayment;
window.confirmDelete = confirmDelete;

// ─── PWA SETUP ──────────────────────────────────────────
let deferredInstallPrompt = null;

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW error:', err));
  });
}

// Capture install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'flex';
});

// Install button click
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('installBtn');
  const installClose = document.getElementById('installClose');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        document.getElementById('installBanner').style.display = 'none';
        showToast('App installed!', 'success');
      }
      deferredInstallPrompt = null;
    });
  }
  if (installClose) {
    installClose.addEventListener('click', () => {
      document.getElementById('installBanner').style.display = 'none';
    });
  }
});

// Hide banner once installed
window.addEventListener('appinstalled', () => {
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'none';
  showToast('App installed on home screen!', 'success');
});

// Offline / online indicator
const offlineBar = document.createElement('div');
offlineBar.className = 'offline-bar';
offlineBar.textContent = 'You are offline. Data will sync when reconnected.';
document.body.appendChild(offlineBar);
window.addEventListener('offline', () => offlineBar.classList.add('show'));
window.addEventListener('online', () => { offlineBar.classList.remove('show'); showToast('Back online', 'success'); });

// ─── INIT ────────────────────────────────────────────────
async function init() {
  const theme = localStorage.getItem('ocs_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const lang = localStorage.getItem('ocs_lang') || 'en';
  I18n.setLang(lang);
  updateTopbarDate();
  // Load settings from server
  try {
    const s = await api('GET', '/api/settings');
    Object.assign(State.settings, s);
    if (s.theme) setTheme(s.theme);
    if (s.language) setLang(s.language);
    if (s.shopName) document.getElementById('topShopName').textContent = s.shopName;
    document.getElementById('salesMonthFilter').value = thisMonth();
    document.getElementById('billsMonthFilter').value = thisMonth();
    document.getElementById('paymentsMonthFilter').value = thisMonth();
  } catch (e) { console.error('Settings load error:', e); }
  loadDashboard();
}

init();
