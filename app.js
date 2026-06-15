// Initialize jsPDF reference
const { jsPDF } = window.jspdf || {};

// Mock Data to populate on first visit
const DEFAULT_PRODUCTS = [
  { id: "1", name: "Ergonomic Office Chair", category: "Furniture", quantity: 12, price: 199.99, threshold: 5, updatedAt: new Date().toISOString() },
  { id: "2", name: "Wireless Mechanical Keyboard", category: "Electronics", quantity: 4, price: 89.50, threshold: 10, updatedAt: new Date().toISOString() },
  { id: "3", name: "USB-C Hub Multiport", category: "Electronics", quantity: 25, price: 45.00, threshold: 8, updatedAt: new Date().toISOString() },
  { id: "4", name: "Stainless Steel Water Bottle", category: "Kitchenware", quantity: 0, price: 24.99, threshold: 5, updatedAt: new Date().toISOString() },
  { id: "5", name: "Premium Coffee Beans 1kg", category: "Groceries", quantity: 8, price: 18.00, threshold: 10, updatedAt: new Date().toISOString() }
];

// App State
let products = [];
let currentEditId = null;

// DOM Elements
const productForm = document.getElementById("product-form");
const productIdInput = document.getElementById("product-id");
const productNameInput = document.getElementById("product-name");
const productCategoryInput = document.getElementById("product-category");
const productQuantityInput = document.getElementById("product-quantity");
const productPriceInput = document.getElementById("product-price");
const productThresholdInput = document.getElementById("product-threshold");

const formTitle = document.getElementById("form-title");
const btnSubmit = document.getElementById("btn-submit");
const btnCancelEdit = document.getElementById("btn-cancel-edit");

const searchInput = document.getElementById("search-input");
const filterCategory = document.getElementById("filter-category");
const tableBody = document.getElementById("table-body");
const emptyState = document.getElementById("empty-state");
const categoryDatalist = document.getElementById("category-suggestions");

// Stat Elements
const statTotalProducts = document.getElementById("stat-total-products");
const statTotalValue = document.getElementById("stat-total-value");
const statLowStock = document.getElementById("stat-low-stock");
const statOutOfStock = document.getElementById("stat-out-of-stock");

// Export Buttons
const btnExportCSV = document.getElementById("btn-export-csv");
const btnExportPDF = document.getElementById("btn-export-pdf");

// App Init
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  setupEventListeners();
  renderApp();
  
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
});

// Load data from LocalStorage
function loadProducts() {
  const stored = localStorage.getItem("apexstock_products");
  if (stored) {
    products = JSON.parse(stored);
  } else {
    products = [...DEFAULT_PRODUCTS];
    saveProducts();
  }
}

// Save data to LocalStorage
function saveProducts() {
  localStorage.setItem("apexstock_products", JSON.stringify(products));
}

// Set up Event Listeners
function setupEventListeners() {
  productForm.addEventListener("submit", handleFormSubmit);
  btnCancelEdit.addEventListener("click", resetForm);
  
  searchInput.addEventListener("input", renderTable);
  filterCategory.addEventListener("change", renderTable);
  
  btnExportCSV.addEventListener("click", exportCSV);
  btnExportPDF.addEventListener("click", exportPDF);
}

// Render the application interface
function renderApp() {
  renderTable();
  updateDashboardStats();
  updateCategoryDropdowns();
}

// Render product table and filter logic
function renderTable() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedCat = filterCategory.value;

  // Filter products
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCat === "" || p.category === selectedCat;
    return matchesSearch && matchesCategory;
  });

  // Clear current table rows
  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");

    filtered.forEach(p => {
      const tr = document.createElement("tr");
      
      // Determine inventory status classes
      let statusClass = "badge-success";
      let statusText = "In Stock";
      
      if (p.quantity === 0) {
        tr.classList.add("row-out-of-stock");
        statusClass = "badge-danger";
        statusText = "Out of Stock";
      } else if (p.quantity <= (p.threshold || 10)) {
        tr.classList.add("row-low-stock");
        statusClass = "badge-warning";
        statusText = "Low Stock";
      }

      const totalVal = (p.quantity * p.price).toFixed(2);
      const updatedDate = p.updatedAt ? new Date(p.updatedAt).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" }) : 'N/A';

      tr.innerHTML = `
        <td style="font-weight: 600;">
          ${escapeHTML(p.name)}
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal; margin-top: 2px;">
            Updated: ${updatedDate}
          </div>
        </td>
        <td>${escapeHTML(p.category)}</td>
        <td class="text-right">${p.quantity}</td>
        <td class="text-right">Rs. ${p.price.toFixed(2)}</td>
        <td class="text-right" style="font-weight: 500;">Rs. ${totalVal}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td class="text-center">
          <div class="action-buttons">
            <button class="btn-edit-link" onclick="editProduct('${p.id}')" title="Edit Product">
              <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
            </button>
            <button class="btn-danger-link" onclick="deleteProduct('${p.id}')" title="Delete Product">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  }
}

// Update dashboard key metrics
function updateDashboardStats() {
  const totalItems = products.length;
  
  const totalValue = products.reduce((acc, p) => acc + (p.quantity * p.price), 0);
  
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= (p.threshold || 10)).length;
  
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  statTotalProducts.textContent = totalItems;
  statTotalValue.textContent = `Rs. ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  statLowStock.textContent = lowStockCount;
  statOutOfStock.textContent = outOfStockCount;
}

// Dynamically update unique categories for search filter and datalist autocompletes
function updateCategoryDropdowns() {
  const categories = [...new Set(products.map(p => p.category))].sort();
  
  // Preserve selected value
  const currentSelected = filterCategory.value;

  // Update table filter category dropdown
  filterCategory.innerHTML = `<option value="">All Categories</option>`;
  categories.forEach(cat => {
    if (cat.trim() !== "") {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      filterCategory.appendChild(option);
    }
  });
  if (categories.includes(currentSelected)) {
    filterCategory.value = currentSelected;
  } else {
    filterCategory.value = "";
  }

  // Update datalist autocomplete for input category
  categoryDatalist.innerHTML = "";
  categories.forEach(cat => {
    if (cat.trim() !== "") {
      const option = document.createElement("option");
      option.value = cat;
      categoryDatalist.appendChild(option);
    }
  });
}

// Handle Add & Update form submissions
function handleFormSubmit(e) {
  e.preventDefault();
  
  if (validateForm()) {
    const name = productNameInput.value.trim();
    const category = productCategoryInput.value.trim();
    const quantity = parseInt(productQuantityInput.value, 10);
    const price = parseFloat(productPriceInput.value);
    const threshold = parseInt(productThresholdInput.value, 10) || 10;

    if (currentEditId) {
      // Edit mode
      const idx = products.findIndex(p => p.id === currentEditId);
      if (idx !== -1) {
        products[idx] = { 
          id: currentEditId, 
          name, 
          category, 
          quantity, 
          price, 
          threshold, 
          updatedAt: new Date().toISOString() 
        };
      }
    } else {
      // Add mode
      const newProduct = {
        id: Date.now().toString(),
        name,
        category,
        quantity,
        price,
        threshold,
        updatedAt: new Date().toISOString()
      };
      products.push(newProduct);
    }

    saveProducts();
    resetForm();
    renderApp();
  }
}

// Simple client-side form validations
function validateForm() {
  let isValid = true;
  
  // Reset previous error layouts
  document.querySelectorAll(".form-group").forEach(el => el.classList.remove("invalid"));

  if (productNameInput.value.trim() === "") {
    showError("err-name");
    isValid = false;
  }
  
  if (productCategoryInput.value.trim() === "") {
    showError("err-category");
    isValid = false;
  }

  const qty = parseInt(productQuantityInput.value, 10);
  if (isNaN(qty) || qty < 0) {
    showError("err-quantity");
    isValid = false;
  }

  const prc = parseFloat(productPriceInput.value);
  if (isNaN(prc) || prc < 0) {
    showError("err-price");
    isValid = false;
  }

  const thres = parseInt(productThresholdInput.value, 10);
  if (productThresholdInput.value !== "" && (isNaN(thres) || thres < 1)) {
    showError("err-threshold");
    isValid = false;
  }

  return isValid;
}

function showError(elementId) {
  const errSpan = document.getElementById(elementId);
  if (errSpan) {
    errSpan.parentElement.classList.add("invalid");
  }
}

// Pre-fill fields for editing
window.editProduct = function(id) {
  const product = products.find(p => p.id === id);
  if (product) {
    currentEditId = product.id;
    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productCategoryInput.value = product.category;
    productQuantityInput.value = product.quantity;
    productPriceInput.value = product.price;
    productThresholdInput.value = product.threshold;

    formTitle.textContent = "Edit Product";
    btnSubmit.textContent = "Update Product";
    btnCancelEdit.classList.remove("hidden");
    
    // Smooth scroll to form container on mobile/screens
    productForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// Reset Form State
function resetForm() {
  currentEditId = null;
  productForm.reset();
  productIdInput.value = "";
  
  // Clear any validation visual bugs
  document.querySelectorAll(".form-group").forEach(el => el.classList.remove("invalid"));

  formTitle.textContent = "Add New Product";
  btnSubmit.textContent = "Add Product";
  btnCancelEdit.classList.add("hidden");
}

// Delete item confirmation and action
window.deleteProduct = function(id) {
  const idx = products.findIndex(p => p.id === id);
  if (idx !== -1) {
    const conf = confirm(`Are you sure you want to delete "${products[idx].name}"?`);
    if (conf) {
      products.splice(idx, 1);
      saveProducts();
      
      // If we are currently editing the deleted product, reset form
      if (currentEditId === id) {
        resetForm();
      }

      renderApp();
    }
  }
};

// Export active data to CSV file
function exportCSV() {
  if (products.length === 0) {
    alert("No product data available to export.");
    return;
  }

  const headers = ["Product Name", "Category", "Quantity", "Unit Price (Rs.)", "Total Value (Rs.)", "Low Threshold", "Last Updated"];
  const rows = products.map(p => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.category.replace(/"/g, '""')}"`,
    p.quantity,
    p.price.toFixed(2),
    (p.quantity * p.price).toFixed(2),
    p.threshold,
    p.updatedAt ? `"${p.updatedAt}"` : '"N/A"'
  ]);

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `apexstock_inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export formatted corporate inventory invoice report to PDF
function exportPDF() {
  if (!jsPDF) {
    alert("jsPDF library could not be loaded. Check your internet connection.");
    return;
  }
  if (products.length === 0) {
    alert("No product data available to export.");
    return;
  }

  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const totalValue = products.reduce((acc, p) => acc + (p.quantity * p.price), 0);
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= (p.threshold || 10)).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  let pageNumber = 1;

  // Helper to draw headers on each page
  function drawPageHeader(isFirstPage) {
    // Header Box / Branding
    doc.setFillColor(11, 15, 25); // Slate Dark Blue
    doc.rect(0, 0, 210, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("ApexStock", 14, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text("BUSINESS INVENTORY STATUS SHEET", 14, 25);
    doc.text(`Generated on: ${dateStr}`, 14, 34);

    if (isFirstPage) {
      // Summary widgets
      doc.setFillColor(243, 244, 246);
      doc.rect(14, 48, 182, 22, "F");

      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("TOTAL PRODUCTS", 20, 56);
      doc.text("INVENTORY VALUE", 65, 56);
      doc.text("LOW STOCK WARNINGS", 120, 56);
      doc.text("OUT OF STOCK", 165, 56);

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(11);
      doc.text(products.length.toString(), 20, 64);
      doc.text(`Rs. ${totalValue.toFixed(2)}`, 65, 64);
      doc.text(lowStockCount.toString(), 120, 64);
      doc.text(outOfStockCount.toString(), 165, 64);
    }
  }

  // Helper to draw footer on each page
  function drawPageFooter() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`ApexStock Inventory Report | Page ${pageNumber}`, 14, 288);
    doc.text("Confidential & Proprietary", 196, 288, { align: "right" });
  }

  // Draw Table Header function
  function drawTableHeader(y) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setFillColor(55, 65, 81); // Slate Table header background
    doc.rect(14, y - 6, 182, 8, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.text("Product Details", 18, y - 1);
    doc.text("Category", 75, y - 1);
    doc.text("Qty", 110, y - 1, { align: "right" });
    doc.text("Price (Rs.)", 135, y - 1, { align: "right" });
    doc.text("Total (Rs.)", 160, y - 1, { align: "right" });
    doc.text("Last Updated", 192, y - 1, { align: "right" });
  }

  // Initial draw
  drawPageHeader(true);
  let startY = 82;
  drawTableHeader(startY);
  
  let currentY = startY;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  products.forEach((p) => {
    // If the next row overflows page height (leaving margin for footer)
    if (currentY > 265) {
      drawPageFooter();
      doc.addPage();
      pageNumber++;
      
      drawPageHeader(false);
      currentY = 56; // set initial Y after header box on new pages
      drawTableHeader(currentY);
      currentY += 8; // move down past headers
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    }

    // Draw row separator line
    doc.setDrawColor(229, 231, 235);
    doc.line(14, currentY + 2, 196, currentY + 2);

    // Color code row indicators for critical states in text format
    if (p.quantity === 0) {
      doc.setTextColor(239, 68, 68); // Red for Out of stock
    } else if (p.quantity <= (p.threshold || 10)) {
      doc.setTextColor(245, 158, 11); // Amber for Low stock
    } else {
      doc.setTextColor(55, 65, 81); // Dark Gray
    }

    const updatedDate = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("en-PK", { dateStyle: "short" }) : 'N/A';

    doc.text(truncateText(p.name, 30), 18, currentY);
    doc.setTextColor(55, 65, 81); // Reset column text color
    doc.text(truncateText(p.category, 18), 75, currentY);
    doc.text(p.quantity.toString(), 110, currentY, { align: "right" });
    doc.text(p.price.toFixed(2), 135, currentY, { align: "right" });
    doc.text((p.quantity * p.price).toFixed(2), 160, currentY, { align: "right" });
    doc.text(updatedDate, 192, currentY, { align: "right" });

    currentY += 8;
  });

  drawPageFooter();
  doc.save(`apexstock_inventory_report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Utility to truncate text if it exceeds a certain length
function truncateText(str, maxLen) {
  if (str.length > maxLen) {
    return str.substring(0, maxLen - 3) + "...";
  }
  return str;
}

// Escape html values to prevent basic XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
