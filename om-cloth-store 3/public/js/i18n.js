const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard', dailySales: 'Daily Sales', supplierBills: 'Supplier Bills',
    supplierPayments: 'Supplier Payments', reports: 'Reports', settings: 'Settings',
    sales: 'Sales', bills: 'Bills', payments: 'Paid',
    todaySale: "Today's Sale", cash: 'Cash', todayBills: "Today's Bills",
    todayPaid: 'Paid Today', pendingDues: 'Pending Dues',
    quickActions: 'Quick Actions', addSale: 'Add Sale', addBill: 'Add Bill',
    addPayment: 'Add Payment', sendWA: 'Send to WA',
    recentActivity: 'Recent Activity',
    date: 'Date', totalSale: 'Total Sale (₹)', notes: 'Notes',
    supplierName: 'Supplier Name', billDate: 'Bill Date', billAmount: 'Bill Amount (₹)',
    details: 'Details / Stock Notes', billPhoto: 'Bill Photo',
    paymentDate: 'Payment Date', amount: 'Amount Paid (₹)', mode: 'Payment Mode',
    shopInfo: 'Shop Information', shopName: 'Shop Name', owners: 'Owners',
    waGroupLink: 'WhatsApp Group Link', preferences: 'Preferences', theme: 'Theme', language: 'Language',
    save: 'Save', cancel: 'Cancel', close: 'Close', confirm: 'Confirm',
    saveSettings: 'Save Settings',
    generateReport: 'Generate Report',
    waCopy: 'Copy the message below', waOpen: 'Open your WhatsApp group', waPaste: 'Paste and send',
    deleteConfirm: 'Delete this entry? This cannot be undone.',
    editSale: 'Edit Sale', editBill: 'Edit Bill', editPayment: 'Edit Payment',
    noData: 'No entries yet.', addFirst: 'Tap the button above to add your first entry.',
    totalSales: 'Total Sales', totalCash: 'Total Cash', totalPhonePe: 'Total PhonePe',
    totalBills: 'Total Bills', totalPaid: 'Total Paid', pending: 'Pending',
    supplierSummary: 'Supplier Summary',
  },
  hi: {
    dashboard: 'डैशबोर्ड', dailySales: 'दैनिक बिक्री', supplierBills: 'आपूर्तिकर्ता बिल',
    supplierPayments: 'आपूर्तिकर्ता भुगतान', reports: 'रिपोर्ट', settings: 'सेटिंग',
    sales: 'बिक्री', bills: 'बिल', payments: 'भुगतान',
    todaySale: 'आज की बिक्री', cash: 'नकद', todayBills: 'आज के बिल',
    todayPaid: 'आज का भुगतान', pendingDues: 'बकाया राशि',
    quickActions: 'त्वरित कार्य', addSale: 'बिक्री जोड़ें', addBill: 'बिल जोड़ें',
    addPayment: 'भुगतान जोड़ें', sendWA: 'WhatsApp भेजें',
    recentActivity: 'हालिया गतिविधि',
    date: 'तारीख', totalSale: 'कुल बिक्री (₹)', notes: 'टिप्पणी',
    supplierName: 'आपूर्तिकर्ता नाम', billDate: 'बिल तारीख', billAmount: 'बिल राशि (₹)',
    details: 'विवरण / स्टॉक नोट्स', billPhoto: 'बिल फोटो',
    paymentDate: 'भुगतान तारीख', amount: 'भुगतान राशि (₹)', mode: 'भुगतान का तरीका',
    shopInfo: 'दुकान की जानकारी', shopName: 'दुकान का नाम', owners: 'मालिक',
    waGroupLink: 'WhatsApp ग्रुप लिंक', preferences: 'प्राथमिकताएं', theme: 'थीम', language: 'भाषा',
    save: 'सहेजें', cancel: 'रद्द करें', close: 'बंद करें', confirm: 'पुष्टि करें',
    saveSettings: 'सेटिंग सहेजें',
    generateReport: 'रिपोर्ट बनाएं',
    waCopy: 'नीचे दिया संदेश कॉपी करें', waOpen: 'अपना WhatsApp ग्रुप खोलें', waPaste: 'पेस्ट करें और भेजें',
    deleteConfirm: 'इस प्रविष्टि को हटाएं? यह वापस नहीं होगा।',
    editSale: 'बिक्री संपादित करें', editBill: 'बिल संपादित करें', editPayment: 'भुगतान संपादित करें',
    noData: 'कोई प्रविष्टि नहीं।', addFirst: 'पहली प्रविष्टि जोड़ने के लिए ऊपर बटन दबाएं।',
    totalSales: 'कुल बिक्री', totalCash: 'कुल नकद', totalPhonePe: 'कुल PhonePe',
    totalBills: 'कुल बिल', totalPaid: 'कुल भुगतान', pending: 'बकाया',
    supplierSummary: 'आपूर्तिकर्ता सारांश',
  }
};

const I18n = {
  lang: localStorage.getItem('ocs_lang') || 'en',
  t(key) { return (TRANSLATIONS[this.lang] || TRANSLATIONS.en)[key] || key; },
  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('ocs_lang', lang);
    this.apply();
  },
  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
  }
};
