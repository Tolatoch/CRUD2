import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Chart.js imports
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// Declare Leaflet to avoid TypeScript errors
declare let L: any;

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './product.html',
  styleUrl: './product.css'
})
export class Product implements OnInit, AfterViewInit, OnDestroy {
  
  // Original data properties
  data: any[] = [];
  filteredData: any[] = [];
  isEditMode = false;
  isFormVisible = false;
  searchTerm: string = '';
  
  // Pagination Properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginatedData: any[] = [];
  
  // Analytics properties
  private priceChart: any;
  private categoryChart: any;
  private supplierMap: any;
  private mapMarkers: any[] = [];
  private initTimeout: any; // ✅ ADDED

  newProduct = {
    ProductID: '',
    ProductName: '',
    SupplierID: '',
    CategoryID: '',
    Unit: '',
    Price: ''
  };

  private apiUrl = 'http://localhost/ajbo';

  // Sample supplier locations (you can replace with real data from your database)
  private supplierLocations = [
    { 
      id: 'S001', 
      name: 'Tech Supplies Inc.', 
      lat: 40.7128, 
      lng: -74.0060, // New York
      products: 15,
      avgPrice: 45.50,
      type: 'high-price'
    },
    { 
      id: 'S002', 
      name: 'Global Distributors', 
      lat: 34.0522, 
      lng: -118.2437, // Los Angeles
      products: 8,
      avgPrice: 22.75,
      type: 'medium-price'
    },
    { 
      id: 'S003', 
      name: 'Quality Goods Co.', 
      lat: 41.8781, 
      lng: -87.6298, // Chicago
      products: 12,
      avgPrice: 18.30,
      type: 'low-price'
    },
    { 
      id: 'S004', 
      name: 'Premium Merchants', 
      lat: 29.7604, 
      lng: -95.3698, // Houston
      products: 6,
      avgPrice: 75.20,
      type: 'high-price'
    },
    { 
      id: 'S005', 
      name: 'Value Suppliers Ltd.', 
      lat: 33.4484, 
      lng: -112.0740, // Phoenix
      products: 9,
      avgPrice: 28.45,
      type: 'medium-price'
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.viewProducts();
  }

  ngAfterViewInit() {
    // ✅ FIXED: Add proper timeout with cleanup
    this.initTimeout = setTimeout(() => {
      if (this.priceChart || this.categoryChart || this.supplierMap) return;
      
      this.initializeCharts();
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy() {
    // ✅ FIXED: Clear timeout first
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
      this.initTimeout = null;
    }
    
    // Clean up charts
    if (this.priceChart) {
      this.priceChart.destroy();
      this.priceChart = null;
    }
    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = null;
    }
    
    // Clean up map
    if (this.supplierMap) {
      this.supplierMap.off();
      this.supplierMap.remove();
      this.supplierMap = null;
    }
    
    // Clear markers
    this.mapMarkers = [];
  }

  // ==================== LEAFLET MAP METHODS ====================

initializeMap() {
  const mapElement = document.getElementById('supplierMap');
  if (!mapElement) {
    console.warn('Map element not found');
    return;
  }
  
  if (this.supplierMap) {
    console.warn('Map already initialized');
    return;
  }

  try {
    // Wait a bit for Leaflet to be loaded
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded');
      setTimeout(() => this.initializeMap(), 500);
      return;
    }

    // Initialize the map
    this.supplierMap = L.map('supplierMap').setView([39.8283, -98.5795], 4);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      minZoom: 3
    }).addTo(this.supplierMap);

    // Add supplier markers to the map
    this.addSupplierMarkers();

    console.log('Map initialized successfully');
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

  addSupplierMarkers() {
    // Clear existing markers
    this.mapMarkers.forEach(marker => {
      this.supplierMap.removeLayer(marker);
    });
    this.mapMarkers = [];

    this.supplierLocations.forEach(supplier => {
      // Determine marker color based on price type
      let markerColor = 'blue';
      let markerSize = [20, 20];
      
      switch(supplier.type) {
        case 'high-price':
          markerColor = 'red';
          markerSize = [25, 25];
          break;
        case 'medium-price':
          markerColor = 'orange';
          markerSize = [22, 22];
          break;
        case 'low-price':
          markerColor = 'green';
          markerSize = [18, 18];
          break;
      }

      // Create custom icon
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div class="marker-pulse ${supplier.type}"></div>`, // ✅ FIXED
        iconSize: markerSize,
        iconAnchor: [markerSize[0]/2, markerSize[1]/2]
      });

      // Create marker with popup
      const marker = L.marker([supplier.lat, supplier.lng], { icon: customIcon })
        .addTo(this.supplierMap)
        .bindPopup(this.createSupplierPopup(supplier));

      this.mapMarkers.push(marker);
    });

    // Fit map to show all markers
    if (this.mapMarkers.length > 0) {
      const group = new L.featureGroup(this.mapMarkers);
      this.supplierMap.fitBounds(group.getBounds().pad(0.1));
    }
  } // ✅ FIXED: Added closing brace

  createSupplierPopup(supplier: any): string {
    return `
      <div class="supplier-popup">
        <h4>${supplier.name}</h4>
        <div class="supplier-info">
          <p><strong>ID:</strong> ${supplier.id}</p>
          <p><strong>Products:</strong> ${supplier.products}</p>
          <p><strong>Avg Price:</strong> $${supplier.avgPrice}</p>
          <p><strong>Type:</strong> ${supplier.type.replace('-', ' ').toUpperCase()}</p>
        </div>
      </div>
    `; // ✅ FIXED: Proper HTML syntax
  }

  getCityName(lat: number, lng: number): string {
    // Simple city mapping based on coordinates
    if (lat === 40.7128 && lng === -74.0060) return 'New York, NY';
    if (lat === 34.0522 && lng === -118.2437) return 'Los Angeles, CA';
    if (lat === 41.8781 && lng === -87.6298) return 'Chicago, IL';
    if (lat === 29.7604 && lng === -95.3698) return 'Houston, TX';
    if (lat === 33.4484 && lng === -112.0740) return 'Phoenix, AZ';
    return 'Unknown Location';
  }

  resetMapView() {
    if (this.supplierMap && this.mapMarkers.length > 0) {
      const group = new L.featureGroup(this.mapMarkers);
      this.supplierMap.fitBounds(group.getBounds().pad(0.1));
    }
  } // ✅ FIXED: Added closing brace

  updateMap() {
    this.addSupplierMarkers();
  }

  // ==================== CHART METHODS ====================

  refreshAnalytics() {
    this.updateCharts();
    this.updateMap();
  }

  initializeCharts() {
    // ✅ FIXED: Add safety check
    if (this.priceChart || this.categoryChart) return;
    
    this.createPriceChart();
    this.createCategoryChart();
  }

  createPriceChart() {
    const ctx = document.getElementById('priceChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Price chart canvas not found');
      return;
    }

    // ✅ FIXED: Destroy existing chart if it exists
    if (this.priceChart) {
      this.priceChart.destroy();
    }

    const priceData = this.calculatePriceRanges();
    
    this.priceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['$0-10', '$10-25', '$25-50', '$50-100', '$100+'],
        datasets: [{
          label: 'Number of Products',
          data: priceData,
          backgroundColor: [
            'rgba(46, 204, 113, 0.8)',
            'rgba(52, 152, 219, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(231, 76, 60, 0.8)'
          ],
          borderColor: [
            'rgb(46, 204, 113)',
            'rgb(52, 152, 219)',
            'rgb(155, 89, 182)',
            'rgb(241, 196, 15)',
            'rgb(231, 76, 60)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Products'
            }
          }
        }
      }
    });
  }

  createCategoryChart() {
    const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('Category chart canvas not found');
      return;
    }

    // ✅ FIXED: Destroy existing chart if it exists
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const categoryData = this.calculateCategoryDistribution();
    
    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryData.labels,
        datasets: [{
          data: categoryData.data,
          backgroundColor: [
            'rgba(52, 152, 219, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(231, 76, 60, 0.8)',
            'rgba(26, 188, 156, 0.8)',
            'rgba(230, 126, 34, 0.8)'
          ],
          borderWidth: 2,
          borderColor: 'white'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          }
        }
      }
    });
  }

  updateCharts() {
    if (this.data.length === 0) return;

    // Update Price Distribution Chart
    const priceRanges = this.calculatePriceRanges();
    if (this.priceChart) {
      this.priceChart.data.datasets[0].data = priceRanges;
      this.priceChart.update();
    }

    // Update Category Distribution Chart
    const categoryData = this.calculateCategoryDistribution();
    if (this.categoryChart) {
      this.categoryChart.data.labels = categoryData.labels;
      this.categoryChart.data.datasets[0].data = categoryData.data;
      this.categoryChart.update();
    }
  }

  calculatePriceRanges(): number[] {
    const ranges = [0, 0, 0, 0, 0];
    
    this.data.forEach(product => {
      const price = parseFloat(product.Price) || 0;
      if (price <= 10) ranges[0]++;
      else if (price <= 25) ranges[1]++;
      else if (price <= 50) ranges[2]++;
      else if (price <= 100) ranges[3]++;
      else ranges[4]++;
    });
    
    return ranges;
  }

  calculateCategoryDistribution() {
    const categoryMap = new Map();
    
    this.data.forEach(product => {
      const category = product.CategoryID || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return {
      labels: Array.from(categoryMap.keys()),
      data: Array.from(categoryMap.values())
    };
  }

  getAveragePrice(): number {
    if (this.data.length === 0) return 0;
    const total = this.data.reduce((sum, product) => sum + (parseFloat(product.Price) || 0), 0);
    return total / this.data.length;
  }

  getUniqueSuppliers(): number {
    const suppliers = new Set(this.data.map(product => product.SupplierID));
    return suppliers.size;
  }

  getUniqueCategories(): number {
    const categories = new Set(this.data.map(product => product.CategoryID));
    return categories.size;
  }

  // ==================== ORIGINAL CRUD METHODS ====================

  viewProducts() {
    const url = `${this.apiUrl}/select.php`;
    this.http.get<any>(url).subscribe({
      next: (res) => { 
        this.data = Array.isArray(res) ? [...res] : [];
        this.filteredData = [...this.data];
        this.updatePagination();
        this.updateCharts(); // Update charts when data loads
        console.log('Products loaded:', this.data.length);
      },
      error: (err) => {
        console.error('Error fetching data:', err);
        this.data = [];
        this.filteredData = [];
        this.updatePagination();
      }
    });
  }

  searchProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredData = [...this.data];
    } else {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredData = this.data.filter(product => 
        product.ProductName?.toLowerCase().includes(searchLower) ||
        product.Unit?.toLowerCase().includes(searchLower) ||
        product.Price?.toString().includes(searchLower) ||
        product.ProductID?.toString().includes(searchLower) ||
        product.SupplierID?.toString().includes(searchLower) ||
        product.CategoryID?.toString().includes(searchLower)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
    this.updateCharts();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredData = [...this.data];
    this.currentPage = 1;
    this.updatePagination();
    this.updateCharts();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToFirstPage() {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToLastPage() {
    this.currentPage = this.totalPages;
    this.updatePagination();
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  showAddForm() {
    this.isFormVisible = true;
    this.isEditMode = false;
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  hideForm() {
    this.isFormVisible = false;
    this.isEditMode = false;
    this.resetForm();
  }

  insertProduct() {
    if (
      !this.newProduct.ProductName ||
      !this.newProduct.SupplierID ||
      !this.newProduct.CategoryID ||
      !this.newProduct.Unit ||
      !this.newProduct.Price
    ) {
      alert('Please fill in all fields!');
      return;
    }

    const url = `${this.apiUrl}/insert.php`;
    this.http.post<any>(url, this.newProduct).subscribe({
      next: (res) => {
        alert('Product inserted successfully!');
        this.viewProducts();
        this.hideForm();
      },
      error: (err) => {
        alert('Error inserting product!');
        console.error('Insert error:', err);
      }
    });
  }

  deleteProduct(productId: any) {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const url = `${this.apiUrl}/delete.php`;
    const payload = { ProductID: productId };
    
    this.http.post<any>(url, payload).subscribe({
      next: (response) => {
        if (response.success) {
          alert('✅ Product deleted successfully!');
          this.viewProducts();
        } else {
          alert('❌ Error: ' + response.message);
        }
      },
      error: (error) => {
        console.error('Delete error:', error);
        alert('❌ Error deleting product!');
      }
    });
  }

  editProduct(product: any) {
    console.log('Editing product:', product);
    this.isFormVisible = true;
    this.isEditMode = true;
    this.newProduct = {
      ProductID: product.ProductID,
      ProductName: product.ProductName,
      SupplierID: product.SupplierID,
      CategoryID: product.CategoryID,
      Unit: product.Unit,
      Price: product.Price
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateProduct() {
    if (
      !this.newProduct.ProductName ||
      !this.newProduct.SupplierID ||
      !this.newProduct.CategoryID ||
      !this.newProduct.Unit ||
      !this.newProduct.Price
    ) {
      alert('Please fill in all fields!');
      return;
    }

    const url = `${this.apiUrl}/update.php`;
    this.http.post<any>(url, this.newProduct).subscribe({
      next: (res) => {
        alert('Product updated successfully!');
        this.viewProducts();
        this.hideForm();
      },
      error: (err) => {
        alert('Error updating product!');
        console.error('Update error:', err);
      }
    });
  }

  onSubmit() {
    if (this.isEditMode) {
      this.updateProduct();
    } else {
      this.insertProduct();
    }
  }

  cancelEdit() {
    this.hideForm();
  }

  resetForm() {
    this.newProduct = {
      ProductID: '',
      ProductName: '',
      SupplierID: '',
      CategoryID: '',
      Unit: '',
      Price: ''
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * TrackBy function for *ngFor to improve performance
   * Tracks products by their unique ProductID
   */
  trackByProductID(index: number, product: any): string | number {
    return product?.ProductID || index;
  }
}