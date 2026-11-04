/**
 * โปรแกรม: ระบบบันทึกรายรับ-รายจ่ายประจำวัน (Daily Expense Tracker)
 * พัฒนาสำหรับ: โครงการประเมินวิชา Introduction to JavaScript (BorntoDev)
 * ภาษา: JavaScript (ES6+ Vanilla JS)
 */

// ========================================================
// 1. หมวดหมู่รายการ (Categories Data)
// ========================================================
const categories = {
    income: [
        { id: "salary", label: "เงินเดือน / ค่าจ้าง", icon: "fa-money-bill-wave" },
        { id: "freelance", label: "งานฟรีแลนซ์ / พาร์ทไทม์", icon: "fa-laptop-code" },
        { id: "investment", label: "เงินปันผล / ลงทุน", icon: "fa-chart-line" },
        { id: "bonus", label: "โบนัส / รางวัล", icon: "fa-gift" },
        { id: "other_income", label: "รายรับอื่นๆ", icon: "fa-hand-holding-dollar" }
    ],
    expense: [
        { id: "food", label: "อาหารและเครื่องดื่ม", icon: "fa-utensils" },
        { id: "travel", label: "การเดินทาง / ค่าน้ำมัน", icon: "fa-car" },
        { id: "shopping", label: "ช้อปปิ้ง / ของใช้ส่วนตัว", icon: "fa-bag-shopping" },
        { id: "bills", label: "บิลค่าน้ำ / ค่าไฟ / เน็ต", icon: "fa-receipt" },
        { id: "entertainment", label: "บันเทิง / พักผ่อน", icon: "fa-gamepad" },
        { id: "medical", label: "ค่ารักษาพยาบาล / สุขภาพ", icon: "fa-heart-pulse" },
        { id: "other_expense", label: "รายจ่ายอื่นๆ", icon: "fa-circle-dollar-to-slot" }
    ]
};

// ========================================================
// 2. ดึง Elements จาก HTML (DOM Elements Selection)
// ========================================================
const balanceEl = document.getElementById("netBalance");
const incomeEl = document.getElementById("totalIncome");
const expenseEl = document.getElementById("totalExpense");
const currentDateEl = document.getElementById("currentDate");

const transactionForm = document.getElementById("transactionForm");
const typeIncomeRadio = document.getElementById("typeIncome");
const typeExpenseRadio = document.getElementById("typeExpense");
const titleInput = document.getElementById("title");
const categorySelect = document.getElementById("category");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");

const transactionListEl = document.getElementById("transactionList");
const emptyStateEl = document.getElementById("emptyState");
const clearAllBtn = document.getElementById("clearAllBtn");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");

const txCountBadge = document.getElementById("txCountBadge");
const sortSelect = document.getElementById("sortSelect");
const paginationBar = document.getElementById("paginationBar");
const pageInfoText = document.getElementById("pageInfoText");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageNumbers = document.getElementById("pageNumbers");

// ========================================================
// 3. ตัวแปรเก็บสถานะข้อมูล (State Variables)
// ========================================================
// โหลดรายการจาก LocalStorage (หากไม่มีจะให้เป็น array ว่าง หรือข้อมูลตัวอย่าง)
let transactions = JSON.parse(localStorage.getItem("expense_tracker_data")) || [
    {
        id: 1710000001,
        title: "เงินเดือนประจำเดือน",
        type: "income",
        category: "salary",
        amount: 30000,
        date: new Date().toISOString().split("T")[0]
    },
    {
        id: 1710000002,
        title: "ค่าอาหารและของสด",
        type: "expense",
        category: "food",
        amount: 450,
        date: new Date().toISOString().split("T")[0]
    }
];

let currentFilter = "all"; // 'all', 'income', หรือ 'expense'
let searchQuery = "";
let currentSort = "date-desc"; // 'date-desc', 'date-asc', 'amount-desc', 'amount-asc'
let currentPage = 1;
const itemsPerPage = 5; // แสดง 5 รายการต่อหน้าเพื่อความสมดุลของ Layout ไม่ให้ยืดหรือตัดตก

// State สำหรับงบประมาณและเป้าหมายการออม
let monthlyBudget = Number(localStorage.getItem("expense_tracker_budget")) || 15000;
let savingsGoals = JSON.parse(localStorage.getItem("expense_tracker_goals")) || [
    { id: 1, name: "เงินสำรองฉุกเฉิน", target: 30000, current: 15000 },
    { id: 2, name: "ท่องเที่ยวปลายปี", target: 12000, current: 4500 }
];

// Instances ของ Chart.js
let categoryChartInstance = null;
let comparisonChartInstance = null;

// ========================================================
// 4. ฟังก์ชันจัดการการเริ่มต้นโปรแกรม (Initialization)
// ========================================================
function init() {
    // 1. แสดงวันที่ปัจจุบันในหัวข้อ
    displayCurrentDate();

    // 2. ตั้งค่าวันที่ในช่อง input ให้แสดงผลเป็น 01/11/2026 (dd/mm/yyyy) ด้วย Flatpickr
    flatpickr(dateInput, {
        dateFormat: "Y-m-d",      // ค่าจริงที่ใช้บันทึก (YYYY-MM-DD เพื่อความถูกต้องของระบบ)
        altInput: true,           // เปิดใช้งานช่องแสดงผลแยก
        altFormat: "d/m/Y",        // รูปแบบวันที่ที่แสดงให้ผู้ใช้เห็น (วว/ดด/ปปปป)
        defaultDate: "2026-11-01", // กำหนดค่าเริ่มต้นเป็น 01/11/2026 (1 พฤศจิกายน 2026)
        locale: "th"              // เมนูและชื่อภาษาไทย
    });

    // 3. กำหนดตัวเลือกใน dropdown หมวดหมู่ตามประเภทเริ่มต้น (expense)
    updateCategoryDropdown("expense");

    // 4. อัปเดตและแสดงผลข้อมูลหน้าแรก
    renderTransactions();
    updateSummary();

    // 5. ระบบสลับหน้า (Tabs Navigation)
    initTabs();

    // 6. อัปเดตข้อมูลหน้าสถิติและงบประมาณ
    updateAnalytics();
    updateBudget();
    initBudgetAndGoals();

    // 7. ผูก Events ให้กับส่วนประกอบต่างๆ
    setupEventListeners();
}

// ฟังก์ชันแสดงวันที่แบบภาษาไทย
function displayCurrentDate() {
    const now = new Date();
    const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
    currentDateEl.textContent = now.toLocaleDateString("th-TH", options);
}

// ฟังก์ชันอัปเดตตัวเลือกใน select หมวดหมู่
function updateCategoryDropdown(type) {
    categorySelect.innerHTML = "";
    const list = categories[type] || [];
    list.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.label;
        categorySelect.appendChild(option);
    });
}

// ========================================================
// 5. ฟังก์ชันคำนวณและอัปเดต Dashboard สรุปยอด
// ========================================================
function updateSummary() {
    // คำนวณรายรับรวม
    const totalIncome = transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    // คำนวณรายจ่ายรวม
    const totalExpense = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + Number(item.amount), 0);

    // ยอดคงเหลือสุทธิ = รายรับ - รายจ่าย
    const netBalance = totalIncome - totalExpense;

    // แสดงผลตัวเลขพร้อมจัดรูปแบบค่าเงินบาท
    incomeEl.textContent = `+฿${formatCurrency(totalIncome)}`;
    expenseEl.textContent = `-฿${formatCurrency(totalExpense)}`;

    // ปรับสียอดคงเหลือสุทธิ (ถ้าติดลบให้แสดงเป็นสีแดง ถ้าบวกหรือศูนย์แสดงสีปกติ)
    if (netBalance < 0) {
        balanceEl.textContent = `-฿${formatCurrency(Math.abs(netBalance))}`;
        balanceEl.style.color = "var(--expense-color)";
    } else {
        balanceEl.textContent = `฿${formatCurrency(netBalance)}`;
        balanceEl.style.color = "var(--primary)";
    }
}

// ฟังก์ชันจัดรูปแบบตัวเลขให้มี comma คั่นหลักพัน และทศนิยม 2 ตำแหน่ง
function formatCurrency(num) {
    return Number(num).toLocaleString("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ========================================================
// 6. ฟังก์ชันแสดงผลรายการ (Render Transactions)
// ========================================================
function renderTransactions() {
    transactionListEl.innerHTML = "";

    // กรองข้อมูลตามประเภท (All / Income / Expense) และคำค้นหา
    const filteredList = transactions.filter(item => {
        const matchesFilter = (currentFilter === "all") || (item.type === currentFilter);
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // อัปเดตตัวเลขจำนวนรายการทั้งหมดใน Badge
    if (txCountBadge) {
        txCountBadge.textContent = `${filteredList.length} รายการ`;
    }

    // หากไม่มีรายการ ให้แสดงหน้าต่างว่าง (Empty state)
    if (filteredList.length === 0) {
        emptyStateEl.style.display = "block";
        if (paginationBar) paginationBar.style.display = "none";
        return;
    } else {
        emptyStateEl.style.display = "none";
    }

    // เรียงลำดับข้อมูลตามที่ผู้ใช้เลือกใน Dropdown
    const sortedList = [...filteredList].sort((a, b) => {
        if (currentSort === "date-desc") {
            return new Date(b.date) - new Date(a.date) || b.id - a.id;
        } else if (currentSort === "date-asc") {
            return new Date(a.date) - new Date(b.date) || a.id - b.id;
        } else if (currentSort === "amount-desc") {
            return Number(b.amount) - Number(a.amount) || b.id - a.id;
        } else if (currentSort === "amount-asc") {
            return Number(a.amount) - Number(b.amount) || a.id - b.id;
        }
        return 0;
    });

    // การคำนวณแบ่งหน้า (Pagination Logic)
    const totalPages = Math.ceil(sortedList.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedList = sortedList.slice(startIndex, startIndex + itemsPerPage);

    // แสดง/ซ่อนและอัปเดต Pagination Bar
    if (paginationBar) {
        if (sortedList.length > itemsPerPage) {
            paginationBar.style.display = "flex";
            const endCount = Math.min(startIndex + itemsPerPage, sortedList.length);
            if (pageInfoText) {
                pageInfoText.textContent = `แสดง ${startIndex + 1}-${endCount} จาก ${sortedList.length} รายการ`;
            }
            if (prevPageBtn) prevPageBtn.disabled = (currentPage === 1);
            if (nextPageBtn) nextPageBtn.disabled = (currentPage === totalPages);
            renderPageNumbers(totalPages);
        } else {
            paginationBar.style.display = "none";
        }
    }

    // สร้าง HTML Elements ในแต่ละรายการของหน้าปัจจุบัน
    paginatedList.forEach(item => {
        const li = document.createElement("li");
        li.className = `transaction-item ${item.type}`;

        // ค้นหา icon ของหมวดหมู่นั้นๆ
        const catInfo = categories[item.type].find(c => c.id === item.category);
        const iconClass = catInfo ? catInfo.icon : "fa-tag";
        const catLabel = catInfo ? catInfo.label : item.category;

        // จัดรูปแบบวันที่ให้อ่านง่าย เช่น 4 พ.ย. 2026
        const dateObj = new Date(item.date);
        const dateText = dateObj.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        const sign = item.type === "income" ? "+" : "-";

        li.innerHTML = `
            <div class="item-left">
                <div class="category-icon-wrapper">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div class="item-details">
                    <h4>${escapeHtml(item.title)}</h4>
                    <div class="item-meta">
                        <span><i class="fa-regular fa-folder"></i> ${catLabel}</span>
                        <span>•</span>
                        <span><i class="fa-regular fa-calendar"></i> ${dateText}</span>
                    </div>
                </div>
            </div>
            <div class="item-right">
                <span class="item-amount ${item.type}">
                    ${sign}฿${formatCurrency(item.amount)}
                </span>
                <button class="delete-btn" onclick="deleteTransaction(${item.id})" title="ลบรายการ">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;

        transactionListEl.appendChild(li);
    });
}

// ฟังก์ชันสร้างปุ่มเลขหน้า Pagination
function renderPageNumbers(totalPages) {
    if (!pageNumbers) return;
    pageNumbers.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = `page-num-btn ${i === currentPage ? "active" : ""}`;
        btn.textContent = i;
        btn.addEventListener("click", () => {
            currentPage = i;
            renderTransactions();
        });
        pageNumbers.appendChild(btn);
    }
}

// ฟังก์ชันป้องกัน XSS เมื่อพิมพ์ข้อความ
function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
}

// ========================================================
// 7. ฟังก์ชันบันทึกรายการใหม่ (Add Transaction)
// ========================================================
function handleAddTransaction(e) {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้าเว็บเมื่อกด submit

    const title = titleInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const type = typeIncomeRadio.checked ? "income" : "expense";
    const category = categorySelect.value;

    // ตรวจสอบความถูกต้องของข้อมูล (Validation)
    if (!title) {
        alert("กรุณากรอกชื่อรายการ");
        titleInput.focus();
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert("กรุณาระบุจำนวนเงินที่ถูกต้องและมากกว่า 0");
        amountInput.focus();
        return;
    }

    if (!date) {
        alert("กรุณาเลือกวันที่");
        return;
    }

    // สร้าง Object ข้อมูลใหม่
    const newTransaction = {
        id: Date.now(), // ใช้ timestamp เป็น ID ไม่ซ้ำกัน
        title: title,
        type: type,
        category: category,
        amount: amount,
        date: date
    };

    // เพิ่มเข้าไปในอาเรย์ transactions
    transactions.push(newTransaction);

    // กลับไปหน้าแรกเสมอเพื่อดูรายการที่เพิ่งเพิ่ม
    currentPage = 1;

    // บันทึกและรีเฟรช UI
    saveAndSync();

    // รีเซ็ตฟอร์ม (ยกเว้นวันที่ เพื่อความสะดวกในการกรอกหลายรายการในวันเดียวกัน)
    titleInput.value = "";
    amountInput.value = "";
    titleInput.focus();
}

// ========================================================
// 8. ฟังก์ชันลบรายการ (Delete Transaction)
// ========================================================
function deleteTransaction(id) {
    const confirmDelete = confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?");
    if (confirmDelete) {
        // กรองรายการที่ไม่ตรงกับ ID ออกไป
        transactions = transactions.filter(item => item.id !== id);
        saveAndSync();
    }
}

// ฟังก์ชันล้างข้อมูลทั้งหมด (Clear All)
function handleClearAll() {
    if (transactions.length === 0) {
        alert("ไม่มีรายการให้ล้างข้อมูล");
        return;
    }

    const confirmClear = confirm("คำเตือน: คุณต้องการลบรายการทั้งหมดใช่หรือไม่? ข้อมูลจะไม่สามารถกู้คืนได้");
    if (confirmClear) {
        transactions = [];
        saveAndSync();
    }
}

// ========================================================
// 9. ฟังก์ชันบันทึกลง LocalStorage และอัปเดตหน้าจอ
// ========================================================
function saveAndSync() {
    localStorage.setItem("expense_tracker_data", JSON.stringify(transactions));
    updateSummary();
    renderTransactions();
    updateAnalytics();
    updateBudget();
}

// ========================================================
// 10. ระบบสลับหน้า (Tabs Navigation System)
// ========================================================
function initTabs() {
    const navTabs = document.querySelectorAll(".nav-tab");
    const tabPanes = document.querySelectorAll(".tab-pane");

    navTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            navTabs.forEach(t => t.classList.remove("active"));
            tabPanes.forEach(p => p.classList.remove("active"));

            tab.classList.add("active");
            const target = tab.dataset.tab;
            const pane = document.getElementById(`tab-${target}`);
            if (pane) pane.classList.add("active");

            // เมื่อเปิดแท็บใด ให้คำนวณและวาดกราฟใหม่เพื่อให้ขนาดพอดีกับหน้าจอ
            if (target === "analytics") {
                updateAnalytics();
            } else if (target === "budget") {
                updateBudget();
            }
        });
    });
}

// ========================================================
// 11. หน้าที่ 2: สถิติและรายงาน (Analytics & Reports)
// ========================================================
function updateAnalytics() {
    const incomeItems = transactions.filter(t => t.type === "income");
    const expenseItems = transactions.filter(t => t.type === "expense");

    const totalIncome = incomeItems.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = expenseItems.reduce((sum, t) => sum + Number(t.amount), 0);
    const netBalance = totalIncome - totalExpense;

    // 1. คำนวณอัตราการออมเงิน (Savings Rate %)
    const savingsRateEl = document.getElementById("savingsRate");
    const savingsRateDesc = document.getElementById("savingsRateDesc");
    if (totalIncome > 0) {
        const rate = Math.max(0, Math.round((netBalance / totalIncome) * 100));
        savingsRateEl.textContent = `${rate}%`;
        savingsRateDesc.textContent = rate >= 20 ? "ยอดเยี่ยม! อัตราการออมอยู่ในเกณฑ์ที่ดี" : "พยายามควบคุมรายจ่ายเพื่อเพิ่มเงินออม";
    } else {
        savingsRateEl.textContent = "0%";
        savingsRateDesc.textContent = "ยังไม่มีข้อมูลรายรับสำหรับคำนวณ";
    }

    // 2. หมวดหมู่ใช้จ่ายสูงสุด (Top Spending Category)
    const topCategoryEl = document.getElementById("topCategory");
    const topCategoryAmountEl = document.getElementById("topCategoryAmount");
    const categoryTotals = {};

    expenseItems.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
    });

    let topCatKey = null;
    let maxExpense = 0;
    for (const [cat, amt] of Object.entries(categoryTotals)) {
        if (amt > maxExpense) {
            maxExpense = amt;
            topCatKey = cat;
        }
    }

    if (topCatKey) {
        const catInfo = categories.expense.find(c => c.id === topCatKey);
        topCategoryEl.textContent = catInfo ? catInfo.label : topCatKey;
        topCategoryAmountEl.textContent = `฿${formatCurrency(maxExpense)}`;
    } else {
        topCategoryEl.textContent = "ไม่มีรายจ่าย";
        topCategoryAmountEl.textContent = "฿0.00";
    }

    // 3. ค่าใช้จ่ายเฉลี่ยต่อรายการ
    const avgExpenseEl = document.getElementById("avgExpense");
    const expenseCountEl = document.getElementById("expenseCount");
    const avg = expenseItems.length > 0 ? totalExpense / expenseItems.length : 0;
    avgExpenseEl.textContent = `฿${formatCurrency(avg)}`;
    expenseCountEl.textContent = `${expenseItems.length} รายการรายจ่าย`;

    // 4. วาดกราฟโดนัท (Category Breakdown)
    renderCategoryChart(categoryTotals);

    // 5. วาดกราฟแท่งเปรียบเทียบ (Income vs Expense)
    renderComparisonChart(totalIncome, totalExpense);
}

function renderCategoryChart(categoryTotals) {
    const canvas = document.getElementById("categoryChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const labels = [];
    const data = [];
    const backgroundColors = [
        "#075057", "#0d7681", "#15803d", "#f59e0b", "#6366f1", "#b91c1c", "#8b5cf6", "#ec4899"
    ];

    for (const [catKey, val] of Object.entries(categoryTotals)) {
        const catInfo = categories.expense.find(c => c.id === catKey);
        labels.push(catInfo ? catInfo.label : catKey);
        data.push(val);
    }

    if (data.length === 0) {
        labels.push("ยังไม่มีรายจ่าย");
        data.push(1);
    }

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: data.length === 1 && labels[0] === "ยังไม่มีรายจ่าย" ? ["#dfdcd5"] : backgroundColors,
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        font: { family: "Prompt", size: 12 },
                        boxWidth: 12,
                        padding: 12
                    }
                }
            },
            cutout: "68%"
        }
    });
}

function renderComparisonChart(income, expense) {
    const canvas = document.getElementById("comparisonChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
    }

    comparisonChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["รายรับทั้งหมด", "รายจ่ายทั้งหมด"],
            datasets: [{
                label: "จำนวนเงิน (บาท)",
                data: [income, expense],
                backgroundColor: ["#15803d", "#b91c1c"],
                borderRadius: 8,
                barThickness: 45
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: "Plus Jakarta Sans" },
                        callback: val => "฿" + Number(val).toLocaleString()
                    },
                    grid: { color: "#ede8e2" }
                },
                x: {
                    ticks: { font: { family: "Prompt", size: 13 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// ========================================================
// 12. หน้าที่ 3: งบประมาณและเป้าหมาย (Budget & Goals)
// ========================================================
function updateBudget() {
    const totalExpense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const remaining = Math.max(0, monthlyBudget - totalExpense);
    const percent = monthlyBudget > 0 ? Math.min(100, Math.round((totalExpense / monthlyBudget) * 100)) : 0;

    document.getElementById("budgetLimitText").textContent = `฿${formatCurrency(monthlyBudget)}`;
    document.getElementById("budgetSpentText").textContent = `฿${formatCurrency(totalExpense)}`;
    document.getElementById("budgetRemainingText").textContent = `฿${formatCurrency(remaining)}`;

    const fill = document.getElementById("budgetProgressFill");
    const percentText = document.getElementById("budgetPercentText");
    const badge = document.getElementById("budgetStatusBadge");

    fill.style.width = `${percent}%`;
    percentText.textContent = `ใช้ไปแล้ว ${percent}%`;

    if (percent <= 70) {
        fill.style.backgroundColor = "var(--income-color)";
        badge.className = "status-badge safe";
        badge.textContent = "ปลอดภัย";
    } else if (percent <= 90) {
        fill.style.backgroundColor = "#f59e0b";
        badge.className = "status-badge warning";
        badge.textContent = "ใกล้เต็มงบ";
    } else {
        fill.style.backgroundColor = "var(--expense-color)";
        badge.className = "status-badge danger";
        badge.textContent = totalExpense > monthlyBudget ? "เกินงบแล้ว!" : "ระวังการใช้จ่าย";
    }

    renderGoals();
}

function renderGoals() {
    const grid = document.getElementById("goalsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (savingsGoals.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted);">
                <i class="fa-solid fa-piggy-bank" style="font-size: 32px; margin-bottom: 8px;"></i>
                <p>ยังไม่มีเป้าหมายการออมเงิน กดปุ่ม "เพิ่มเป้าหมายใหม่" ด้านบนได้เลย</p>
            </div>
        `;
        return;
    }

    savingsGoals.forEach(goal => {
        const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
        const div = document.createElement("div");
        div.className = "goal-item";
        div.innerHTML = `
            <div class="goal-header">
                <div class="goal-title-wrap">
                    <i class="fa-solid fa-bullseye"></i>
                    <h4>${escapeHtml(goal.name)}</h4>
                </div>
                <button class="goal-delete-btn" onclick="deleteGoal(${goal.id})" title="ลบเป้าหมาย">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
            <div class="goal-amounts">
                <div>
                    <span class="saved">฿${formatCurrency(goal.current)}</span>
                    <span class="target"> / ฿${formatCurrency(goal.target)}</span>
                </div>
                <span style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">${percent}%</span>
            </div>
            <div class="goal-progress-bar">
                <div class="goal-progress-fill" style="width: ${percent}%;"></div>
            </div>
            <div class="goal-actions">
                <button class="deposit-btn" onclick="openDepositModal(${goal.id}, '${escapeHtml(goal.name)}')">
                    <i class="fa-solid fa-plus"></i> หยอดกระปุก
                </button>
            </div>
        `;
        grid.appendChild(div);
    });
}

// จัดการ Modal และฟอร์มเป้าหมายการเงิน
function initBudgetAndGoals() {
    // ปุ่มตั้งค่างบประมาณ
    const setBudgetBtn = document.getElementById("setBudgetBtn");
    if (setBudgetBtn) {
        setBudgetBtn.addEventListener("click", () => {
            const input = prompt("ระบุงบประมาณรายจ่ายประจำเดือนใหม่ (บาท):", monthlyBudget);
            if (input !== null) {
                const val = parseFloat(input);
                if (!isNaN(val) && val > 0) {
                    monthlyBudget = val;
                    localStorage.setItem("expense_tracker_budget", monthlyBudget);
                    updateBudget();
                } else {
                    alert("กรุณาระบุจำนวนเงินที่ถูกต้องและมากกว่า 0");
                }
            }
        });
    }

    // Modal เพิ่มเป้าหมาย
    const goalModal = document.getElementById("goalModal");
    const openGoalModalBtn = document.getElementById("openGoalModalBtn");
    const closeGoalModal = document.getElementById("closeGoalModal");
    const goalForm = document.getElementById("goalForm");

    if (openGoalModalBtn) {
        openGoalModalBtn.addEventListener("click", () => {
            goalForm.reset();
            goalModal.style.display = "flex";
        });
    }

    if (closeGoalModal) {
        closeGoalModal.addEventListener("click", () => {
            goalModal.style.display = "none";
        });
    }

    if (goalForm) {
        goalForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("goalName").value.trim();
            const target = parseFloat(document.getElementById("goalTarget").value);
            const current = parseFloat(document.getElementById("goalCurrent").value) || 0;

            if (!name || isNaN(target) || target <= 0) {
                alert("กรุณากรอกข้อมูลเป้าหมายให้ถูกต้อง");
                return;
            }

            savingsGoals.push({
                id: Date.now(),
                name: name,
                target: target,
                current: current
            });

            localStorage.setItem("expense_tracker_goals", JSON.stringify(savingsGoals));
            goalModal.style.display = "none";
            renderGoals();
        });
    }

    // Modal หยอดกระปุก
    const depositModal = document.getElementById("depositModal");
    const closeDepositModal = document.getElementById("closeDepositModal");
    const depositForm = document.getElementById("depositForm");

    if (closeDepositModal) {
        closeDepositModal.addEventListener("click", () => {
            depositModal.style.display = "none";
        });
    }

    if (depositForm) {
        depositForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const goalId = parseInt(document.getElementById("depositGoalId").value);
            const amount = parseFloat(document.getElementById("depositAmount").value);

            if (isNaN(amount) || amount <= 0) {
                alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
                return;
            }

            const goal = savingsGoals.find(g => g.id === goalId);
            if (goal) {
                goal.current += amount;
                localStorage.setItem("expense_tracker_goals", JSON.stringify(savingsGoals));
                depositModal.style.display = "none";
                renderGoals();
            }
        });
    }
}

// เปิด Modal หยอดกระปุก
function openDepositModal(goalId, goalName) {
    document.getElementById("depositGoalId").value = goalId;
    document.getElementById("depositGoalTitle").textContent = `เป้าหมาย: ${goalName}`;
    document.getElementById("depositAmount").value = "";
    document.getElementById("depositModal").style.display = "flex";
}

// ลบเป้าหมายการออม
function deleteGoal(goalId) {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเป้าหมายนี้?")) {
        savingsGoals = savingsGoals.filter(g => g.id !== goalId);
        localStorage.setItem("expense_tracker_goals", JSON.stringify(savingsGoals));
        renderGoals();
    }
}

// ========================================================
// 10. การผูก Event Listeners
// ========================================================
function setupEventListeners() {
    // ฟอร์ม Submit
    transactionForm.addEventListener("submit", handleAddTransaction);

    // เปลี่ยนประเภทระหว่าง รายรับ และ รายจ่าย ให้ dropdown หมวดหมู่เปลี่ยนตาม
    typeIncomeRadio.addEventListener("change", () => updateCategoryDropdown("income"));
    typeExpenseRadio.addEventListener("change", () => updateCategoryDropdown("expense"));

    // ปุ่มตัวกรอง All, Income, Expense
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            currentPage = 1; // รีเซ็ตกลับไปหน้าแรกเมื่อเปลี่ยนตัวกรอง
            renderTransactions();
        });
    });

    // ค้นหารายการตามชื่อ
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim();
        currentPage = 1; // รีเซ็ตกลับไปหน้าแรกเมื่อค้นหา
        renderTransactions();
    });

    // เรียงลำดับรายการ (Sort)
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            renderTransactions();
        });
    }

    // ปุ่มเปลี่ยนหน้า Pagination (ก่อนหน้า / ถัดไป)
    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderTransactions();
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", () => {
            const filteredCount = transactions.filter(item => {
                const matchesFilter = (currentFilter === "all") || (item.type === currentFilter);
                const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesFilter && matchesSearch;
            }).length;
            const totalPages = Math.ceil(filteredCount / itemsPerPage) || 1;
            if (currentPage < totalPages) {
                currentPage++;
                renderTransactions();
            }
        });
    }

    // ปุ่มล้างรายการทั้งหมด
    clearAllBtn.addEventListener("click", handleClearAll);
}

// รันโปรแกรมเมื่อ DOM โหลดเสร็จสมบูรณ์
document.addEventListener("DOMContentLoaded", init);
