class HotezaApp {
    constructor() {
        this.currentUser = null;
        this.waiters = [];
        this.orders = [];
        this.menuItems = [];
        this.expenses = [];
        this.subscription = {
            plan: "Basic (50 orders/day)",
            expiry: this.getFutureDate(30),
            dailyLimit: 50,
            ordersToday: 0,
            price: 10000,
            autoRenew: false
        };
        this.vouchers = [];
        this.walletBalance = 0;
        this.paymentMethods = [
            { id: 'cash', name: 'Cash', icon: 'fa-money-bill-wave' },
            { id: 'mpesa', name: 'M-PESA', icon: 'fa-mobile-alt' },
            { id: 'airtel', name: 'Airtel Money', icon: 'fa-mobile-alt' },
            { id: 'tigo', name: 'Tigo Pesa', icon: 'fa-mobile-alt' },
            { id: 'halo', name: 'Halo Pesa', icon: 'fa-mobile-alt' }
        ];
        
        this.initApp();
    }

    initApp() {
        this.setupGlobalEventListeners();
        
        if (document.getElementById('login-page') || document.getElementById('signup-page')) {
            this.initAuth();
        } else if (document.getElementById('dashboard-home')) {
            this.initDashboard();
        }
        
        this.loadData();
    }

    setupGlobalEventListeners() {
        // Mobile menu toggle
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth <= 1024 && sidebar && 
                !e.target.closest('#sidebar') && 
                !e.target.closest('#menu-toggle')) {
                sidebar.classList.remove('active');
            }
        });

        // Window resize handler
        window.addEventListener('resize', this.handleWindowResize.bind(this));
    }

    handleWindowResize() {
        if (window.innerWidth > 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('active');
        }
    }

    getFutureDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    }

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }

    // ==================== AUTHENTICATION ====================
    initAuth() {
        this.setupAuthNavigation();
        
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signup-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });
    }

    setupAuthNavigation() {
        const showPage = (page) => {
            document.querySelectorAll('.auth-page').forEach(p => p.classList.remove('active'));
            document.getElementById(`${page}-page`).classList.add('active');
        };

        document.getElementById('login-btn')?.addEventListener('click', () => showPage('login'));
        document.getElementById('signup-btn')?.addEventListener('click', () => showPage('signup'));
        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('login');
        });
        document.getElementById('show-signup')?.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('signup');
        });
        document.getElementById('back-from-login')?.addEventListener('click', () => showPage('welcome'));
        document.getElementById('back-from-signup')?.addEventListener('click', () => showPage('welcome'));
    }

    handleLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }
        
        // In a real app, this would validate with a server
        this.currentUser = {
            name: "Admin User",
            email: email,
            restaurant: "Demo Restaurant",
            location: "Dar es Salaam",
            title: "Manager",
            profileImage: "https://via.placeholder.com/150"
        };
        
        this.saveData();
        window.location.href = "dashboard.html";
    }

    handleSignup() {
        const restaurantName = document.getElementById('restaurant-name').value;
        const fullName = document.getElementById('full-name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!restaurantName || !fullName || !email || !password || !confirmPassword) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showAlert('Passwords do not match', 'error');
            return;
        }

        if (password.length < 8) {
            this.showAlert('Password must be at least 8 characters', 'error');
            return;
        }

        if (!document.getElementById('terms').checked) {
            this.showAlert('Please accept the terms and agreements', 'error');
            return;
        }

        this.currentUser = {
            name: fullName,
            email: email,
            restaurant: restaurantName,
            location: document.getElementById('location').value,
            title: document.getElementById('title').value,
            profileImage: "https://via.placeholder.com/150"
        };
        
        this.saveData();
        document.getElementById('signup-form').reset();
        window.location.href = "dashboard.html";
    }

    // ==================== DASHBOARD ====================
    initDashboard() {
        const userData = localStorage.getItem('hoteza_user');
        if (!userData) {
            window.location.href = "index.html";
            return;
        }
        
        this.currentUser = JSON.parse(userData);
        const subscriptionData = localStorage.getItem('hoteza_subscription');
        if (subscriptionData) {
            this.subscription = JSON.parse(subscriptionData);
        }
        
        this.loadData();
        this.updateUI();
        this.initSidebar();
        this.initContentPages();
        this.initUserMenu();
        this.checkDailyReset();
    }

    checkDailyReset() {
        const today = new Date().toISOString().split('T')[0];
        const lastReset = localStorage.getItem('hoteza_lastReset');
        
        if (lastReset !== today) {
            this.subscription.ordersToday = 0;
            this.saveData('hoteza_subscription', this.subscription);
            localStorage.setItem('hoteza_lastReset', today);
        }
    }

    initSidebar() {
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.showContentPage(page);
            });
        });

        document.getElementById('help-support-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showHelpSupport();
        });
    }

    initContentPages() {
        this.showContentPage('dashboard-home');
    }

    initUserMenu() {
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            localStorage.removeItem('hoteza_user');
            window.location.href = "index.html";
        });

        document.getElementById('account-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showContentPage('account-page');
        });
    }

    showContentPage(pageId) {
        document.querySelectorAll('.content-page').forEach(page => {
            page.classList.remove('active');
            page.innerHTML = '';
        });

        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === pageId) {
                    link.classList.add('active');
                }
            });

            this.loadPageContent(pageId);
        }
    }

    loadPageContent(pageId) {
        switch(pageId) {
            case 'dashboard-home':
                this.renderDashboardHome();
                break;
            case 'waiter-management':
                this.renderWaiterManagement();
                break;
            case 'order-management':
                this.renderOrderManagement();
                break;
            case 'food-service':
                this.renderFoodService();
                break;
            case 'expenses':
                this.renderExpensesPage();
                break;
            case 'reports':
                this.renderReports();
                break;
            case 'subscription':
                this.renderSubscription();
                break;
            case 'account-page':
                this.renderAccountPage();
                break;
        }
    }

    // ==================== DATA MANAGEMENT ====================
    loadData() {
        this.waiters = JSON.parse(localStorage.getItem('hoteza_waiters') || '[]');
        this.orders = JSON.parse(localStorage.getItem('hoteza_orders') || '[]');
        this.menuItems = JSON.parse(localStorage.getItem('hoteza_menuItems') || '[]');
        this.expenses = JSON.parse(localStorage.getItem('hoteza_expenses') || '[]');
        this.vouchers = JSON.parse(localStorage.getItem('hoteza_vouchers') || '[]');
        this.walletBalance = parseFloat(localStorage.getItem('hoteza_walletBalance')) || 0;
        
        // Load sample data if no data exists
        if (this.waiters.length === 0 && this.orders.length === 0) {
            this.loadSampleData();
        }
    }

    saveData(key = null, data = null) {
        if (key && data) {
            localStorage.setItem(key, JSON.stringify(data));
        } else {
            localStorage.setItem('hoteza_user', JSON.stringify(this.currentUser));
            localStorage.setItem('hoteza_subscription', JSON.stringify(this.subscription));
            localStorage.setItem('hoteza_waiters', JSON.stringify(this.waiters));
            localStorage.setItem('hoteza_orders', JSON.stringify(this.orders));
            localStorage.setItem('hoteza_menuItems', JSON.stringify(this.menuItems));
            localStorage.setItem('hoteza_expenses', JSON.stringify(this.expenses));
            localStorage.setItem('hoteza_vouchers', JSON.stringify(this.vouchers));
            localStorage.setItem('hoteza_walletBalance', this.walletBalance.toString());
        }
    }

    loadSampleData() {
        // Sample waiters
        this.waiters = [
            { id: 1, name: 'John Doe', shift: 'morning', tables: '1-5,10', color: '#4361ee' },
            { id: 2, name: 'Jane Smith', shift: 'afternoon', tables: '6-9,12', color: '#f72585' },
            { id: 3, name: 'Mike Johnson', shift: 'night', tables: '11,13-15', color: '#4cc9f0' }
        ];
        
        // Sample menu items
        this.menuItems = [
            { id: 1, name: 'Chicken Curry', price: 12000, category: 'Main Course', type: 'food' },
            { id: 2, name: 'Beef Steak', price: 15000, category: 'Main Course', type: 'food' },
            { id: 3, name: 'Vegetable Soup', price: 8000, category: 'Starter', type: 'food' },
            { id: 4, name: 'Soda', price: 2000, category: 'Beverages', type: 'drink' },
            { id: 5, name: 'Room Service', price: 5000, category: 'Services', type: 'service' }
        ];
        
        // Sample orders
        const today = new Date().toISOString().split('T')[0];
        this.orders = [
            {
                id: 'ORD-1001',
                date: today,
                waiter: 'John Doe',
                waiterId: 1,
                table: 5,
                items: [
                    { id: 1, name: 'Chicken Curry', quantity: 2, price: 12000 },
                    { id: 4, name: 'Soda', quantity: 2, price: 2000 }
                ],
                total: 28000,
                paymentMethod: 'mpesa',
                status: 'completed'
            },
            {
                id: 'ORD-1002',
                date: today,
                waiter: 'Jane Smith',
                waiterId: 2,
                table: 8,
                items: [
                    { id: 2, name: 'Beef Steak', quantity: 1, price: 15000 },
                    { id: 3, name: 'Vegetable Soup', quantity: 1, price: 8000 }
                ],
                total: 23000,
                paymentMethod: 'cash',
                status: 'pending'
            }
        ];
        
        // Sample expenses
        this.expenses = [
            { name: 'Groceries', amount: 50000, date: today },
            { name: 'Utilities', amount: 15000, date: today }
        ];
        
        // Sample vouchers
        this.vouchers = [
            { id: 'VOU-5001', date: today, orders: 250, price: 5000, remaining: 150 },
            { id: 'VOU-5002', date: today, orders: 500, price: 10000, remaining: 500 }
        ];
        
        this.saveData();
    }

    // ==================== PAGE RENDERERS ====================
    renderDashboardHome() {
        const container = document.getElementById('dashboard-home');
        if (!container) return;
        
        const greeting = this.getGreeting();
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-home"></i> Dashboard Overview</h2>
                <div class="breadcrumbs">
                    <span>Home</span>
                </div>
            </div>
            
            <div class="greeting">
                <i class="fas ${this.getGreetingIcon()}"></i>
                <span>${greeting}, ${this.currentUser.name.split(' ')[0]}!</span>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon bg-primary-light">
                        <i class="fas fa-clipboard-list text-primary"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Today's Orders</h3>
                        <span class="stat-value" id="today-orders">0</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon bg-success-light">
                        <i class="fas fa-money-bill-wave text-success"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Today's Revenue</h3>
                        <span class="stat-value" id="today-revenue">0 TZS</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon bg-info-light">
                        <i class="fas fa-users text-info"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Active Waiters</h3>
                        <span class="stat-value" id="active-waiters">0</span>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon bg-warning-light">
                        <i class="fas fa-box-open text-warning"></i>
                    </div>
                    <div class="stat-info">
                        <h3>Menu Items</h3>
                        <span class="stat-value" id="menu-items">0</span>
                    </div>
                </div>
            </div>
            
            <div class="quick-actions">
                <h3>Quick Actions</h3>
                <div class="action-buttons">
                    <button class="btn btn-action" data-page="order-management">
                        <i class="fas fa-plus-circle"></i> <span class="action-text">New Order</span>
                    </button>
                    <button class="btn btn-action" data-page="waiter-management">
                        <i class="fas fa-user-plus"></i> <span class="action-text">Add Waiter</span>
                    </button>
                    <button class="btn btn-action" data-page="food-service">
                        <i class="fas fa-utensil-spoon"></i> <span class="action-text">Add Menu Item</span>
                    </button>
                </div>
            </div>
            
            <div class="recent-orders">
                <h3>Recent Orders</h3>
                <div class="orders-table">
                    <div class="table-header">
                        <span>Order ID</span>
                        <span class="desktop-only">Waiter</span>
                        <span>Items</span>
                        <span>Total</span>
                    </div>
                    <div class="table-body" id="recent-orders-list"></div>
                </div>
            </div>
        `;

        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.getAttribute('data-page');
                this.showContentPage(page);
            });
        });

        this.updateDashboardStats();
    }

    getGreetingIcon() {
        const hour = new Date().getHours();
        if (hour < 12) return "fa-sun";
        if (hour < 18) return "fa-cloud-sun";
        return "fa-moon";
    }

    updateDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = this.orders.filter(order => 
            new Date(order.date).toISOString().split('T')[0] === today
        );
        
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const todayExpenses = this.expenses.filter(exp => exp.date === today)
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        document.getElementById('today-orders').textContent = todayOrders.length;
        document.getElementById('today-revenue').textContent = `${todayRevenue.toLocaleString()} TZS`;
        document.getElementById('active-waiters').textContent = this.waiters.length;
        document.getElementById('menu-items').textContent = this.menuItems.length;
        
        this.updateRecentOrders(todayOrders);
    }

    updateRecentOrders(orders) {
        const container = document.getElementById('recent-orders-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No orders today</div>';
            return;
        }
        
        orders.slice(0, 5).forEach(order => {
            const orderEl = document.createElement('div');
            orderEl.className = 'order-item';
            orderEl.innerHTML = `
                <span>${order.id}</span>
                <span class="desktop-only">${order.waiter}</span>
                <span>${order.items.map(i => i.name).join(', ')}</span>
                <span>${order.total.toLocaleString()} TZS</span>
            `;
            container.appendChild(orderEl);
        });
    }

    // ==================== WAITER MANAGEMENT ====================
    renderWaiterManagement() {
        const container = document.getElementById('waiter-management');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-user-tie"></i> Waiter Management</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> <span>Waiters</span>
                </div>
            </div>

            <div class="waiter-controls">
                <button class="btn btn-primary" id="add-waiter-btn">
                    <i class="fas fa-user-plus"></i> Add Waiter
                </button>
            </div>

            <div class="waiter-table">
                <div class="table-header">
                    <span>Name</span>
                    <span class="desktop-only">Shift</span>
                    <span class="desktop-only">Tables</span>
                    <span>Orders</span>
                    <span>Actions</span>
                </div>
                <div id="waiters-list" class="table-body"></div>
            </div>
        `;
        
        document.getElementById('add-waiter-btn')?.addEventListener('click', () => {
            this.showAddWaiterForm();
        });
        
        this.renderWaitersList();
    }

    showAddWaiterForm() {
        const container = document.getElementById('waiter-management');
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-user-plus"></i> Add Waiter</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> 
                    <span>Waiters</span> <i class="fas fa-chevron-right"></i> 
                    <span>Add</span>
                </div>
            </div>

            <form id="add-waiter-form" class="waiter-form">
                <div class="form-group">
                    <label for="waiter-name">Waiter Name</label>
                    <input type="text" id="waiter-name" required>
                </div>
                
                <div class="form-group">
                    <label for="waiter-id">Waiter ID (1-27)</label>
                    <input type="number" id="waiter-id" min="1" max="27" required>
                </div>
                
                <div class="form-group">
                    <label for="waiter-shift">Shift</label>
                    <select id="waiter-shift" required>
                        <option value="">Select Shift</option>
                        <option value="morning">Morning (8AM-2PM)</option>
                        <option value="afternoon">Afternoon (2PM-8PM)</option>
                        <option value="night">Night (8PM-2AM)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="waiter-tables">Assign Tables (1-100)</label>
                    <input type="text" id="waiter-tables" placeholder="e.g., 1,5,7-10">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancel-add-waiter">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Waiter</button>
                </div>
            </form>
        `;
        
        document.getElementById('cancel-add-waiter')?.addEventListener('click', () => {
            this.showContentPage('waiter-management');
        });
        
        document.getElementById('add-waiter-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addWaiter();
        });
    }

    addWaiter() {
        const name = document.getElementById('waiter-name').value;
        const id = parseInt(document.getElementById('waiter-id').value);
        const shift = document.getElementById('waiter-shift').value;
        const tables = document.getElementById('waiter-tables').value || 'Not assigned';
        
        if (!name || isNaN(id) || !shift) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }
        
        if (id < 1 || id > 27) {
            this.showAlert('Waiter ID must be between 1 and 27', 'error');
            return;
        }
        
        if (this.waiters.some(w => w.id === id)) {
            this.showAlert(`Waiter with ID ${id} already exists`, 'error');
            return;
        }
        
        let color;
        switch(shift) {
            case 'morning': color = '#4361ee'; break;
            case 'afternoon': color = '#f72585'; break;
            case 'night': color = '#4cc9f0'; break;
            default: color = '#6c757d';
        }
        
        this.waiters.push({ id, name, shift, tables, color });
        this.saveData('hoteza_waiters', this.waiters);
        this.showAlert('Waiter added successfully', 'success');
        this.showContentPage('waiter-management');
    }

    renderWaitersList() {
        const container = document.getElementById('waiters-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.waiters.length === 0) {
            container.innerHTML = '<div class="empty-state">No waiters added yet</div>';
            return;
        }
        
        this.waiters.forEach(waiter => {
            const waiterOrders = this.orders.filter(order => order.waiterId === waiter.id);
            const orderCount = waiterOrders.length;
            const totalSales = waiterOrders.reduce((sum, order) => sum + order.total, 0);
            
            const waiterEl = document.createElement('div');
            waiterEl.className = 'waiter-item';
            waiterEl.innerHTML = `
                <span>${waiter.name}</span>
                <span class="desktop-only">${this.capitalizeFirstLetter(waiter.shift)}</span>
                <span class="desktop-only">${waiter.tables || 'Not assigned'}</span>
                <span>${orderCount}</span>
                <span class="action-buttons">
                    <button class="btn-edit" data-id="${waiter.id}">
                        <i class="fas fa-edit"></i>
                        <span class="mobile-only">Edit</span>
                    </button>
                    <button class="btn-delete" data-id="${waiter.id}">
                        <i class="fas fa-trash"></i>
                        <span class="mobile-only">Delete</span>
                    </button>
                </span>
            `;
            container.appendChild(waiterEl);
        });
        
        this.setupWaiterActionButtons();
    }

    setupWaiterActionButtons() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const waiterId = parseInt(btn.getAttribute('data-id'));
                this.editWaiter(waiterId);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const waiterId = parseInt(btn.getAttribute('data-id'));
                this.deleteWaiter(waiterId);
            });
        });
    }

    editWaiter(id) {
        const waiter = this.waiters.find(w => w.id === id);
        if (!waiter) return;
        
        const container = document.getElementById('waiter-management');
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-user-edit"></i> Edit Waiter</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> 
                    <span>Waiters</span> <i class="fas fa-chevron-right"></i> 
                    <span>Edit</span>
                </div>
            </div>

            <form id="edit-waiter-form" class="waiter-form">
                <div class="form-group">
                    <label for="edit-waiter-name">Waiter Name</label>
                    <input type="text" id="edit-waiter-name" value="${waiter.name}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-waiter-id">Waiter ID</label>
                    <input type="number" id="edit-waiter-id" value="${waiter.id}" readonly>
                </div>
                
                <div class="form-group">
                    <label for="edit-waiter-shift">Shift</label>
                    <select id="edit-waiter-shift" required>
                        <option value="morning" ${waiter.shift === 'morning' ? 'selected' : ''}>Morning (8AM-2PM)</option>
                        <option value="afternoon" ${waiter.shift === 'afternoon' ? 'selected' : ''}>Afternoon (2PM-8PM)</option>
                        <option value="night" ${waiter.shift === 'night' ? 'selected' : ''}>Night (8PM-2AM)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-waiter-tables">Assign Tables (1-100)</label>
                    <input type="text" id="edit-waiter-tables" value="${waiter.tables}" placeholder="e.g., 1,5,7-10">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancel-edit-waiter">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        `;
        
        document.getElementById('cancel-edit-waiter')?.addEventListener('click', () => {
            this.showContentPage('waiter-management');
        });
        
        document.getElementById('edit-waiter-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWaiterChanges(waiter.id);
        });
    }

    saveWaiterChanges(id) {
        const name = document.getElementById('edit-waiter-name').value;
        const shift = document.getElementById('edit-waiter-shift').value;
        const tables = document.getElementById('edit-waiter-tables').value || 'Not assigned';
        
        if (!name || !shift) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }
        
        const waiterIndex = this.waiters.findIndex(w => w.id === id);
        if (waiterIndex === -1) return;
        
        let color;
        switch(shift) {
            case 'morning': color = '#4361ee'; break;
            case 'afternoon': color = '#f72585'; break;
            case 'night': color = '#4cc9f0'; break;
            default: color = '#6c757d';
        }
        
        this.waiters[waiterIndex] = {
            ...this.waiters[waiterIndex],
            name,
            shift,
            tables,
            color
        };
        
        this.saveData('hoteza_waiters', this.waiters);
        this.showAlert('Waiter updated successfully', 'success');
        this.showContentPage('waiter-management');
    }

    deleteWaiter(id) {
        if (confirm('Are you sure you want to delete this waiter?')) {
            this.waiters = this.waiters.filter(waiter => waiter.id !== id);
            this.saveData('hoteza_waiters', this.waiters);
            this.renderWaitersList();
            this.showAlert('Waiter deleted successfully', 'success');
        }
    }

    // ==================== ORDER MANAGEMENT ====================
    renderOrderManagement() {
        const container = document.getElementById('order-management');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-clipboard-list"></i> Order Management</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> <span>Orders</span>
                </div>
            </div>

            <div class="order-controls">
                <button class="btn btn-primary" id="new-order-btn">
                    <i class="fas fa-plus-circle"></i> Add Order
                </button>
            </div>

            <div class="orders-table">
                <div class="table-header">
                    <span>Order ID</span>
                    <span class="desktop-only">Table</span>
                    <span>Total</span>
                    <span>Status</span>
                    <span>Actions</span>
                </div>
                <div class="table-body" id="orders-list"></div>
            </div>
        `;
        
        document.getElementById('new-order-btn')?.addEventListener('click', () => {
            this.showNewOrderForm();
        });
        
        this.renderOrdersList();
    }

    showNewOrderForm() {
        // Check order limit
        if (this.subscription.ordersToday >= this.subscription.dailyLimit) {
            this.showAlert(`You've reached your daily order limit of ${this.subscription.dailyLimit}. Please upgrade your plan or wait until tomorrow.`, 'error');
            return;
        }
        
        const container = document.getElementById('order-management');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-plus-circle"></i> Add New Order</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> 
                    <span>Orders</span> <i class="fas fa-chevron-right"></i> 
                    <span>Add</span>
                </div>
            </div>

            <form id="add-order-form" class="order-form">
                <div class="form-group">
                    <label for="order-waiter">Waiter</label>
                    <select id="order-waiter" required>
                        <option value="">Select Waiter</option>
                        ${this.waiters.map(waiter => 
                            `<option value="${waiter.id}">${waiter.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="order-table">Table Number</label>
                    <input type="number" id="order-table" min="1" max="100" required>
                </div>

                <div class="order-items" id="order-items">
                    <div class="item-header">
                        <h4>Order Items</h4>
                        <button type="button" class="btn btn-sm btn-primary" id="add-item-btn">
                            <i class="fas fa-plus"></i> Add Item
                        </button>
                    </div>
                    <div id="items-list"></div>
                </div>

                <div class="form-group">
                    <label>Payment Method</label>
                    <div class="payment-options">
                        ${this.paymentMethods.map(method => `
                            <label class="payment-option">
                                <input type="radio" name="payment" value="${method.id}" ${method.id === 'cash' ? 'checked' : ''}>
                                <i class="fas ${method.icon}"></i> ${method.name}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancel-order">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Order</button>
                </div>
            </form>
        `;
        
        document.getElementById('add-item-btn')?.addEventListener('click', () => {
            this.addOrderItem();
        });
        
        document.getElementById('cancel-order')?.addEventListener('click', () => {
            this.showContentPage('order-management');
        });
        
        document.getElementById('add-order-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNewOrder();
        });
        
        this.addOrderItem();
    }

    addOrderItem() {
        const container = document.getElementById('items-list');
        if (!container) return;
        
        const itemId = Date.now();
        const itemEl = document.createElement('div');
        itemEl.className = 'order-item-row';
        itemEl.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Item</label>
                    <select class="item-select" required>
                        <option value="">Select Item</option>
                        ${this.menuItems.map(item => 
                            `<option value="${item.id}" data-price="${item.price}">${item.name} - ${item.price.toLocaleString()} TZS</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" class="item-quantity" min="1" value="1" required>
                </div>
                <div class="form-group">
                    <label>Price</label>
                    <input type="number" class="item-price" readonly>
                </div>
                <div class="form-group">
                    <label>&nbsp;</label>
                    <button type="button" class="btn btn-sm btn-danger remove-item" data-id="${itemId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(itemEl);
        
        const select = itemEl.querySelector('.item-select');
        const quantity = itemEl.querySelector('.item-quantity');
        const price = itemEl.querySelector('.item-price');
        
        select.addEventListener('change', () => {
            if (select.value) {
                const selectedOption = select.options[select.selectedIndex];
                price.value = selectedOption.getAttribute('data-price');
            } else {
                price.value = '';
            }
        });
        
        quantity.addEventListener('change', () => {
            if (select.value) {
                const selectedOption = select.options[select.selectedIndex];
                const itemPrice = parseFloat(selectedOption.getAttribute('data-price'));
                price.value = (itemPrice * parseInt(quantity.value)).toFixed(2);
            }
        });
        
        itemEl.querySelector('.remove-item').addEventListener('click', (e) => {
            if (container.children.length > 1) {
                itemEl.remove();
            } else {
                this.showAlert('An order must have at least one item', 'error');
            }
        });
        
        if (select.options.length > 1) {
            select.selectedIndex = 1;
            select.dispatchEvent(new Event('change'));
        }
    }

    saveNewOrder() {
        const waiterId = parseInt(document.getElementById('order-waiter').value);
        const table = parseInt(document.getElementById('order-table').value);
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        
        if (!waiterId || !table) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }
        
        const waiter = this.waiters.find(w => w.id === waiterId);
        if (!waiter) {
            this.showAlert('Invalid waiter selected', 'error');
            return;
        }
        
        // Collect order items
        const items = [];
        let total = 0;
        
        document.querySelectorAll('.order-item-row').forEach(row => {
            const select = row.querySelector('.item-select');
            const quantity = parseInt(row.querySelector('.item-quantity').value);
            const price = parseFloat(row.querySelector('.item-price').value);
            
            if (select.value && quantity && price) {
                const menuItem = this.menuItems.find(item => item.id === parseInt(select.value));
                items.push({
                    id: menuItem.id,
                    name: menuItem.name,
                    quantity: quantity,
                    price: menuItem.price
                });
                total += price;
            }
        });
        
        if (items.length === 0) {
            this.showAlert('Please add at least one item to the order', 'error');
            return;
        }
        
        // Create new order
        const newOrder = {
            id: 'ORD-' + Math.floor(Math.random() * 1000000),
            date: new Date().toISOString(),
            waiter: waiter.name,
            waiterId: waiter.id,
            table: table,
            items: items,
            total: total,
            paymentMethod: paymentMethod,
            status: 'pending'
        };
        
        this.orders.push(newOrder);
        this.subscription.ordersToday++;
        
        this.saveData('hoteza_orders', this.orders);
        this.saveData('hoteza_subscription', this.subscription);
        
        this.showAlert('Order added successfully', 'success');
        this.showContentPage('order-management');
    }

    renderOrdersList(orders = this.orders) {
        const container = document.getElementById('orders-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No orders found</div>';
            return;
        }
        
        orders.forEach(order => {
            const orderEl = document.createElement('div');
            orderEl.className = 'order-item';
            
            orderEl.innerHTML = `
                <span>${order.id}</span>
                <span class="desktop-only">${order.table}</span>
                <span>${order.total.toLocaleString()} TZS</span>
                <span class="status-badge ${order.status}">${this.capitalizeFirstLetter(order.status)}</span>
                <span class="action-buttons">
                    <button class="btn-mark-paid" data-id="${order.id}">
                        <i class="fas fa-check-circle"></i>
                        <span class="mobile-only">Paid</span>
                    </button>
                    <button class="btn-edit" data-id="${order.id}">
                        <i class="fas fa-edit"></i>
                        <span class="mobile-only">Edit</span>
                    </button>
                    <button class="btn-delete" data-id="${order.id}">
                        <i class="fas fa-trash"></i>
                        <span class="mobile-only">Delete</span>
                    </button>
                </span>
            `;
            container.appendChild(orderEl);
        });

        this.setupOrderActionButtons();
    }

    setupOrderActionButtons() {
        document.querySelectorAll('.btn-mark-paid').forEach(button => {
            button.addEventListener('click', () => {
                const orderId = button.getAttribute('data-id');
                const order = this.orders.find(o => o.id === orderId);
                
                if (order) {
                    order.status = 'completed';
                    this.saveData('hoteza_orders', this.orders);
                    this.renderOrdersList();
                }
            });
        });
        
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.getAttribute('data-id');
                this.editOrder(orderId);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const orderId = btn.getAttribute('data-id');
                this.deleteOrder(orderId);
            });
        });
    }

    editOrder(id) {
        const order = this.orders.find(o => o.id === id);
        if (!order) return;
        
        const container = document.getElementById('order-management');
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-edit"></i> Edit Order</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> 
                    <span>Orders</span> <i class="fas fa-chevron-right"></i> 
                    <span>Edit</span>
                </div>
            </div>

            <form id="edit-order-form" class="order-form">
                <div class="form-group">
                    <label for="edit-order-waiter">Waiter</label>
                    <select id="edit-order-waiter" required>
                        ${this.waiters.map(waiter => 
                            `<option value="${waiter.id}" ${order.waiterId === waiter.id ? 'selected' : ''}>${waiter.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-order-table">Table Number</label>
                    <input type="number" id="edit-order-table" min="1" max="100" value="${order.table}" required>
                </div>

                <div class="order-items" id="order-items">
                    <div class="item-header">
                        <h4>Order Items</h4>
                        <button type="button" class="btn btn-sm btn-primary" id="add-item-btn">
                            <i class="fas fa-plus"></i> Add Item
                        </button>
                    </div>
                    <div id="items-list"></div>
                </div>

                <div class="form-group">
                    <label>Payment Method</label>
                    <div class="payment-options">
                        ${this.paymentMethods.map(method => `
                            <label class="payment-option">
                                <input type="radio" name="edit-payment" value="${method.id}" ${order.paymentMethod === method.id ? 'checked' : ''}>
                                <i class="fas ${method.icon}"></i> ${method.name}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancel-edit-order">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        `;
        
        // Add existing items
        order.items.forEach(item => {
            this.addOrderItemToEditForm(item);
        });
        
        document.getElementById('add-item-btn')?.addEventListener('click', () => {
            this.addOrderItemToEditForm();
        });
        
        document.getElementById('cancel-edit-order')?.addEventListener('click', () => {
            this.showContentPage('order-management');
        });
        
        document.getElementById('edit-order-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveOrderChanges(id);
        });
    }

    addOrderItemToEditForm(item = null) {
        const container = document.getElementById('items-list');
        if (!container) return;
        
        const itemId = Date.now();
        const itemEl = document.createElement('div');
        itemEl.className = 'order-item-row';
        
        const menuOptions = this.menuItems.map(menuItem => {
            const selected = item && item.id === menuItem.id ? 'selected' : '';
            return `<option value="${menuItem.id}" data-price="${menuItem.price}" ${selected}>${menuItem.name} - ${menuItem.price.toLocaleString()} TZS</option>`;
        }).join('');
        
        itemEl.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Item</label>
                    <select class="item-select" required>
                        <option value="">Select Item</option>
                        ${menuOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" class="item-quantity" min="1" value="${item ? item.quantity : 1}" required>
                </div>
                <div class="form-group">
                    <label>Price</label>
                    <input type="number" class="item-price" value="${item ? (item.price * item.quantity).toFixed(2) : ''}" readonly>
                </div>
                <div class="form-group">
                    <label>&nbsp;</label>
                    <button type="button" class="btn btn-sm btn-danger remove-item" data-id="${itemId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(itemEl);
        
        const select = itemEl.querySelector('.item-select');
        const quantity = itemEl.querySelector('.item-quantity');
        const price = itemEl.querySelector('.item-price');
        
        select.addEventListener('change', () => {
            if (select.value) {
                const selectedOption = select.options[select.selectedIndex];
                price.value = selectedOption.getAttribute('data-price');
            } else {
                price.value = '';
            }
        });
        
        quantity.addEventListener('change', () => {
            if (select.value) {
                const selectedOption = select.options[select.selectedIndex];
                const itemPrice = parseFloat(selectedOption.getAttribute('data-price'));
                price.value = (itemPrice * parseInt(quantity.value)).toFixed(2);
            }
        });
        
        itemEl.querySelector('.remove-item').addEventListener('click', (e) => {
            if (container.children.length > 1) {
                itemEl.remove();
            } else {
                this.showAlert('An order must have at least one item', 'error');
            }
        });
        
        if (item) {
            select.dispatchEvent(new Event('change'));
        } else if (select.options.length > 1) {
            select.selectedIndex = 1;
            select.dispatchEvent(new Event('change'));
        }
    }

    saveOrderChanges(id) {
        const waiterId = parseInt(document.getElementById('edit-order-waiter').value);
        const table = parseInt(document.getElementById('edit-order-table').value);
        const paymentMethod = document.querySelector('input[name="edit-payment"]:checked').value;
        
        if (!waiterId || !table) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }
        
        const waiter = this.waiters.find(w => w.id === waiterId);
        if (!waiter) {
            this.showAlert('Invalid waiter selected', 'error');
            return;
        }
        
        // Collect order items
        const items = [];
        let total = 0;
        
        document.querySelectorAll('.order-item-row').forEach(row => {
            const select = row.querySelector('.item-select');
            const quantity = parseInt(row.querySelector('.item-quantity').value);
            const price = parseFloat(row.querySelector('.item-price').value);
            
            if (select.value && quantity && price) {
                const menuItem = this.menuItems.find(item => item.id === parseInt(select.value));
                items.push({
                    id: menuItem.id,
                    name: menuItem.name,
                    quantity: quantity,
                    price: menuItem.price
                });
                total += price;
            }
        });
        
        if (items.length === 0) {
            this.showAlert('Please add at least one item to the order', 'error');
            return;
        }
        
        // Update order
        const orderIndex = this.orders.findIndex(o => o.id === id);
        if (orderIndex === -1) return;
        
        this.orders[orderIndex] = {
            ...this.orders[orderIndex],
            waiter: waiter.name,
            waiterId: waiter.id,
            table: table,
            items: items,
            total: total,
            paymentMethod: paymentMethod
        };
        
        this.saveData('hoteza_orders', this.orders);
        this.showAlert('Order updated successfully', 'success');
        this.showContentPage('order-management');
    }

    deleteOrder(id) {
        if (confirm('Are you sure you want to delete this order?')) {
            this.orders = this.orders.filter(order => order.id !== id);
            this.saveData('hoteza_orders', this.orders);
            this.renderOrdersList();
            this.showAlert('Order deleted successfully', 'success');
        }
    }

    // ==================== MENU MANAGEMENT ====================
    renderFoodService() {
        const container = document.getElementById('food-service');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-utensils"></i> Menu Management</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> <span>Menu</span>
                </div>
            </div>

            <div class="menu-controls">
                <button class="btn btn-primary" id="add-menu-item-btn">
                    <i class="fas fa-plus"></i> Add Menu Item
                </button>
            </div>

            <div class="menu-items-grid" id="menu-items-list"></div>
        `;
        
        document.getElementById('add-menu-item-btn')?.addEventListener('click', () => {
            this.showAddMenuItemForm();
        });
        
        this.renderMenuItems();
    }

    showAddMenuItemForm() {
        const container = document.getElementById('food-service');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-plus-circle"></i> Add Menu Item</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> 
                    <span>Menu</span> <i class="fas fa-chevron-right"></i> 
                    <span>Add Item</span>
                </div>
            </div>

            <form id="add-menu-item-form" class="menu-item-form">
                <div class="form-group">
                    <label for="item-type">Type</label>
                    <select id="item-type" required>
                        <option value="">Select Type</option>
                        <option value="food">Food</option>
                        <option value="drink">Drink</option>
                        <option value="service">Service</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="item-name">Name</label>
                    <input type="text" id="item-name" required>
                </div>
                
                <div class="form-group">
                    <label for="item-price">Price (TZS)</label>
                    <input type="number" id="item-price" min="0" step="100" required>
                </div>
                
                <div class="form-group">
                    <label for="item-category">Category</label>
                    <input type="text" id="item-category" placeholder="e.g., Main Course, Beverages">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancel-menu-item">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Item</button>
                </div>
            </form>
        `;
        
        document.getElementById('cancel-menu-item')?.addEventListener('click', () => {
            this.showContentPage('food-service');
        });
        
        document.getElementById('add-menu-item-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMenuItem();
        });
    }

    saveMenuItem() {
        const type = document.getElementById('item-type').value;
        const name = document.getElementById('item-name').value;
        const price = parseFloat(document.getElementById('item-price').value);
        const category = document.getElementById('item-category').value || 'Uncategorized';
        
        if (!type || !name || isNaN(price)) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }
        
        const newItem = {
            id: Date.now(),
            name: name,
            price: price,
            category: category,
            type: type
        };
        
        this.menuItems.push(newItem);
        this.saveData('hoteza_menuItems', this.menuItems);
        this.showAlert('Menu item added successfully', 'success');
        this.showContentPage('food-service');
    }

    renderMenuItems(items = this.menuItems) {
        const container = document.getElementById('menu-items-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state">No menu items found</div>';
            return;
        }
        
        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item-card';
            
            let icon;
            switch(item.type) {
                case 'food': icon = 'fa-utensils'; break;
                case 'drink': icon = 'fa-glass-water'; break;
                case 'service': icon = 'fa-concierge-bell'; break;
                default: icon = 'fa-circle-question';
            }
            
            itemEl.innerHTML = `
                <div class="item-header">
                    <div class="item-type-badge ${item.type}">
                        <i class="fas ${icon}"></i>
                        <span>${this.capitalizeFirstLetter(item.type)}</span>
                    </div>
                    <h4 class="text-ellipsis">${item.name}</h4>
                    <span class="item-price">${item.price.toLocaleString()} TZS</span>
                </div>
                <div class="item-category">${item.category}</div>
                <div class="item-actions">
                    <button class="btn-edit" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                        <span class="mobile-only">Edit</span>
                    </button>
                    <button class="btn-delete" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                        <span class="mobile-only">Delete</span>
                    </button>
                </div>
            `;
            container.appendChild(itemEl);
        });
        
        this.setupMenuItemActionButtons();
    }

    setupMenuItemActionButtons() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = parseInt(btn.getAttribute('data-id'));
                this.editMenuItem(itemId);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = parseInt(btn.getAttribute('data-id'));
                this.deleteMenuItem(itemId);
            });
        });
    }

    editMenuItem(id) {
        const item = this.menuItems.find(i => i.id === id);
        if (!item) return;
        
        const container = document.getElementById('food-service');
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-edit"></i> Edit Menu Item</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> 
                    <span>Menu</span> <i class="fas fa-chevron-right"></i> 
                    <span>Edit</span>
                </div>
            </div>

            <form id="edit-menu-item-form" class="menu-item-form">
                <div class="form-group">
                    <label for="edit-item-type">Type</label>
                    <select id="edit-item-type" required>
                        <option value="food" ${item.type === 'food' ? 'selected' : ''}>Food</option>
                        <option value="drink" ${item.type === 'drink' ? 'selected' : ''}>Drink</option>
                        <option value="service" ${item.type === 'service' ? 'selected' : ''}>Service</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="edit-item-name">Name</label>
                    <input type="text" id="edit-item-name" value="${item.name}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-item-price">Price (TZS)</label>
                    <input type="number" id="edit-item-price" min="0" step="100" value="${item.price}" required>
                </div>
                
                <div class="form-group">
                    <label for="edit-item-category">Category</label>
                    <input type="text" id="edit-item-category" value="${item.category}" placeholder="e.g., Main Course, Beverages">
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" id="cancel-edit-menu-item">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
            </form>
        `;
        
        document.getElementById('cancel-edit-menu-item')?.addEventListener('click', () => {
            this.showContentPage('food-service');
        });
        
        document.getElementById('edit-menu-item-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMenuItemChanges(id);
        });
    }

    saveMenuItemChanges(id) {
        const type = document.getElementById('edit-item-type').value;
        const name = document.getElementById('edit-item-name').value;
        const price = parseFloat(document.getElementById('edit-item-price').value);
        const category = document.getElementById('edit-item-category').value || 'Uncategorized';
        
        if (!type || !name || isNaN(price)) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }
        
        const itemIndex = this.menuItems.findIndex(i => i.id === id);
        if (itemIndex === -1) return;
        
        this.menuItems[itemIndex] = {
            ...this.menuItems[itemIndex],
            type,
            name,
            price,
            category
        };
        
        this.saveData('hoteza_menuItems', this.menuItems);
        this.showAlert('Menu item updated successfully', 'success');
        this.showContentPage('food-service');
    }

    deleteMenuItem(id) {
        if (confirm('Are you sure you want to delete this menu item?')) {
            this.menuItems = this.menuItems.filter(item => item.id !== id);
            this.saveData('hoteza_menuItems', this.menuItems);
            this.renderMenuItems();
            this.showAlert('Menu item deleted successfully', 'success');
        }
    }

    // ==================== EXPENSES MANAGEMENT ====================
    renderExpensesPage() {
        const container = document.getElementById('expenses');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-wallet"></i> Expense Tracker</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> <span>Expenses</span>
                </div>
            </div>

            <div class="expense-content">
                <form id="expense-form" class="compact-form">
                    <div class="form-row compact-row">
                        <div class="form-group">
                            <label for="expense-name">Expense Name</label>
                            <input type="text" id="expense-name" required>
                        </div>
                        <div class="form-group">
                            <label for="expense-amount">Amount (TZS)</label>
                            <input type="number" id="expense-amount" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Add Expense</button>
                    </div>
                </form>

                <div class="expenses-table-container">
                    <div class="expenses-table">
                        <div class="table-header">
                            <span class="col-date">Date</span>
                            <span class="col-name">Expense</span>
                            <span class="col-amount">Amount</span>
                            <span class="col-actions">Actions</span>
                        </div>
                        <div class="table-body" id="expenses-list"></div>
                        <div class="table-footer">
                            <span class="total-label">Total:</span>
                            <span id="total-expenses">0 TZS</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('expense-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        this.renderExpensesList();
    }

    addExpense() {
        const name = document.getElementById('expense-name').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        
        if (!name || isNaN(amount)) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }

        const expense = { 
            name, 
            amount, 
            date: new Date().toISOString().split('T')[0] 
        };
        
        this.expenses.push(expense);
        this.saveData('hoteza_expenses', this.expenses);
        this.renderExpensesList();
        document.getElementById('expense-form').reset();
        this.showAlert('Expense added successfully', 'success');
    }

    renderExpensesList() {
        const container = document.getElementById('expenses-list');
        const totalElement = document.getElementById('total-expenses');
        if (!container || !totalElement) return;

        container.innerHTML = '';
        
        if (this.expenses.length === 0) {
            container.innerHTML = '<div class="empty-state">No expenses recorded yet</div>';
            totalElement.textContent = '0 TZS';
            return;
        }

        // Sort expenses by date (newest first)
        const sortedExpenses = [...this.expenses].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        let total = 0;
        
        sortedExpenses.forEach((expense, index) => {
            total += expense.amount;
            
            const expenseEl = document.createElement('div');
            expenseEl.className = 'expense-item';
            expenseEl.innerHTML = `
                <span>${expense.date}</span>
                <span>${expense.name}</span>
                <span>${expense.amount.toLocaleString()} TZS</span>
                <span class="action-buttons">
                    <button class="btn-delete" data-index="${index}">
                        <i class="fas fa-trash"></i>
                        <span class="mobile-only">Delete</span>
                    </button>
                </span>
            `;
            container.appendChild(expenseEl);
        });

        // Update total
        totalElement.textContent = `${total.toLocaleString()} TZS`;

        // Add event listeners for delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.deleteExpense(index);
            });
        });
    }

    deleteExpense(index) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses.splice(index, 1);
            this.saveData('hoteza_expenses', this.expenses);
            this.renderExpensesList();
            this.showAlert('Expense deleted successfully', 'success');
        }
    }

    // ==================== REPORTS ====================
    renderReports() {
        const container = document.getElementById('reports');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-chart-bar"></i> Reports</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> <span>Reports</span>
                </div>
            </div>

            <div class="report-filters">
                <div class="form-row">
                    <div class="form-group">
                        <label for="report-type">Report Type</label>
                        <select id="report-type">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="report-date">Date</label>
                        <input type="date" id="report-date">
                    </div>
                    <button class="btn btn-primary" id="generate-report">
                        <i class="fas fa-chart-line"></i> Generate
                    </button>
                </div>
            </div>

            <div class="report-results">
                <canvas id="sales-chart"></canvas>
                <div class="report-summary" id="report-summary"></div>
            </div>
        `;
        
        document.getElementById('generate-report')?.addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('report-date').valueAsDate = new Date();
        this.generateReport();
    }

    generateReport() {
        // Destroy previous chart if exists
        if (this.salesChart) {
            this.salesChart.destroy();
        }
        
        const ctx = document.getElementById('sales-chart').getContext('2d');
        const reportType = document.getElementById('report-type').value;
        const reportDate = document.getElementById('report-date').value;
        const today = new Date(reportDate).toISOString().split('T')[0];
        
        // Calculate actual values from data
        const todayOrders = this.orders.filter(order => 
            new Date(order.date).toISOString().split('T')[0] === today
        );
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const todayExpenses = this.expenses.filter(exp => exp.date === today)
            .reduce((sum, exp) => sum + exp.amount, 0);
        const todayProfit = todayRevenue - todayExpenses;
        
        // Update the report summary in the app
        document.getElementById('report-summary').innerHTML = `
            <div class="summary-card">
                <h4>Report Summary - ${new Date(reportDate).toLocaleDateString()}</h4>
                <div class="summary-item">
                    <span>Total Orders:</span>
                    <span>${todayOrders.length}</span>
                </div>
                <div class="summary-item">
                    <span>Total Sales:</span>
                    <span>${todayRevenue.toLocaleString()} TZS</span>
                </div>
                <div class="summary-item">
                    <span>Total Expenses:</span>
                    <span>${todayExpenses.toLocaleString()} TZS</span>
                </div>
                <div class="summary-item">
                    <span>Profit:</span>
                    <span>${todayProfit.toLocaleString()} TZS</span>
                </div>
            </div>
        `;
        
        // Chart data (sample - you should replace with real calculations)
        let labels, data;
        if (reportType === 'daily') {
            labels = ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'];
            data = [12000, 35000, 42000, 38000, 45000, 28000, 15000];
        } else if (reportType === 'weekly') {
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            data = [120000, 95000, 135000, 110000, 150000, 180000, 200000];
        } else { // monthly
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            data = [450000, 520000, 480000, 550000];
        }
        
        this.salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales (TZS)',
                    data: data,
                    backgroundColor: 'rgba(67, 97, 238, 0.7)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + ' TZS';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toLocaleString() + ' TZS';
                            }
                        }
                    }
                }
            }
        });
    }

    // ==================== SUBSCRIPTION ====================
    renderSubscription() {
        const container = document.getElementById('subscription');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-credit-card"></i> Subscription</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> <span>Subscription</span>
                </div>
            </div>

            <div class="subscription-status-card">
                <div class="status-header">
                    <h3>Current Plan</h3>
                    <span class="status-badge active">Active</span>
                </div>
                
                <div class="plan-details">
                    <div class="detail-item">
                        <span class="detail-label">Plan Name:</span>
                        <span class="detail-value">${this.subscription.plan}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Expiry Date:</span>
                        <span class="detail-value">${this.subscription.expiry}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Daily Order Limit:</span>
                        <span class="detail-value">${this.subscription.dailyLimit}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Orders Today:</span>
                        <span class="detail-value">${this.subscription.ordersToday} / ${this.subscription.dailyLimit}</span>
                    </div>
                </div>
            </div>
            
            <div class="upgrade-options">
                <h3>Upgrade Your Plan</h3>
                
                <div class="plan-cards">
                    <div class="plan-card ${this.subscription.plan.includes('Basic') ? 'current-plan' : ''}">
                        <h4>Basic</h4>
                        <div class="plan-price">10,000 TZS/month</div>
                        <ul class="plan-features">
                            <li>50 orders/day</li>
                            <li>Basic reporting</li>
                            <li>Email support</li>
                        </ul>
                        <button class="btn ${this.subscription.plan.includes('Basic') ? 'btn-outline' : 'btn-primary'}" 
                                id="basic-plan-btn">
                            ${this.subscription.plan.includes('Basic') ? 'Current Plan' : 'Select Plan'}
                        </button>
                    </div>
                    
                    <div class="plan-card ${this.subscription.plan.includes('Professional') ? 'current-plan' : 'recommended'}">
                        ${!this.subscription.plan.includes('Professional') ? 
                            '<div class="recommended-badge">Recommended</div>' : ''}
                        <h4>Professional</h4>
                        <div class="plan-price">12,000 TZS/month</div>
                        <ul class="plan-features">
                            <li>100 orders/day</li>
                            <li>Advanced reporting</li>
                            <li>Priority support</li>
                        </ul>
                        <button class="btn ${this.subscription.plan.includes('Professional') ? 'btn-outline' : 'btn-primary'}" 
                                id="professional-plan-btn">
                            ${this.subscription.plan.includes('Professional') ? 'Current Plan' : 'Upgrade'}
                        </button>
                    </div>
                    
                    <div class="plan-card ${this.subscription.plan.includes('Enterprise') ? 'current-plan' : ''}">
                        <h4>Enterprise</h4>
                        <div class="plan-price">15,000 TZS/month</div>
                        <ul class="plan-features">
                            <li>Unlimited orders</li>
                            <li>Premium reporting</li>
                            <li>24/7 support</li>
                        </ul>
                        <button class="btn ${this.subscription.plan.includes('Enterprise') ? 'btn-outline' : 'btn-primary'}" 
                                id="enterprise-plan-btn">
                            ${this.subscription.plan.includes('Enterprise') ? 'Current Plan' : 'Contact Sales'}
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="wallet-section">
                <h3>Wallet</h3>
                <div class="wallet-balance">
                    <span>Current Balance:</span>
                    <span id="wallet-balance-display">${this.walletBalance.toLocaleString()} TZS</span>
                </div>
                <button class="btn btn-primary" id="top-up-wallet">
                    <i class="fas fa-plus-circle"></i> Top Up Wallet
                </button>
            </div>
        `;
        
        this.setupSubscriptionButtons();
    }

    setupSubscriptionButtons() {
        // Basic Plan Button
        document.getElementById('basic-plan-btn')?.addEventListener('click', () => {
            if (!this.subscription.plan.includes('Basic')) {
                this.updateSubscriptionPlan('Basic', 50, 10000);
            }
        });
        
        // Professional Plan Button
        document.getElementById('professional-plan-btn')?.addEventListener('click', () => {
            if (!this.subscription.plan.includes('Professional')) {
                this.updateSubscriptionPlan('Professional', 100, 12000);
            }
        });
        
        // Enterprise Plan Button
        document.getElementById('enterprise-plan-btn')?.addEventListener('click', () => {
            if (!this.subscription.plan.includes('Enterprise')) {
                this.showContactSalesForm();
            }
        });
        
        // Wallet Top Up
        document.getElementById('top-up-wallet')?.addEventListener('click', () => {
            this.showTopUpForm();
        });
    }

    updateSubscriptionPlan(planName, dailyLimit, price) {
        if (confirm(`Are you sure you want to upgrade to the ${planName} plan for ${price.toLocaleString()} TZS/month?`)) {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            
            this.subscription = {
                plan: `${planName} (${dailyLimit} orders/day)`,
                expiry: expiryDate.toISOString().split('T')[0],
                dailyLimit: dailyLimit,
                ordersToday: 0,
                price: price,
                autoRenew: this.subscription.autoRenew
            };
            
            this.saveData('hoteza_subscription', this.subscription);
            this.showAlert(`Successfully upgraded to ${planName} plan!`, 'success');
            this.renderSubscription();
        }
    }

    showTopUpForm() {
        const container = document.getElementById('subscription');
        container.innerHTML += `
            <div class="top-up-form">
                <h4>Top Up Wallet</h4>
                <form id="wallet-topup-form">
                    <div class="form-group">
                        <label for="topup-amount">Amount (TZS)</label>
                        <input type="number" id="topup-amount" min="1000" step="1000" required>
                    </div>
                    <div class="form-group">
                        <label>Payment Method</label>
                        <div class="payment-options">
                            ${this.paymentMethods.map(method => `
                                <label class="payment-option">
                                    <input type="radio" name="topup-payment" value="${method.id}" ${method.id === 'mpesa' ? 'checked' : ''}>
                                    <i class="fas ${method.icon}"></i> ${method.name}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="cancel-topup">Cancel</button>
                        <button type="submit" class="btn btn-primary">Proceed to Payment</button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('cancel-topup')?.addEventListener('click', () => {
            this.renderSubscription();
        });
        
        document.getElementById('wallet-topup-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processTopUp();
        });
    }

    processTopUp() {
        const amount = parseFloat(document.getElementById('topup-amount').value);
        const paymentMethod = document.querySelector('input[name="topup-payment"]:checked').value;
        
        if (isNaN(amount) || amount < 1000) {
            this.showAlert('Please enter a valid amount (minimum 1000 TZS)', 'error');
            return;
        }
        
        // In a real app, this would process payment
        this.walletBalance += amount;
        this.saveData('hoteza_walletBalance', this.walletBalance);
        
        this.showAlert(`Wallet topped up successfully with ${amount.toLocaleString()} TZS`, 'success');
        this.renderSubscription();
    }

    showContactSalesForm() {
        const container = document.getElementById('subscription');
        container.innerHTML += `
            <div class="contact-sales-form">
                <h4>Contact Sales for Enterprise Plan</h4>
                <form id="sales-contact-form">
                    <div class="form-group">
                        <label for="contact-name">Your Name</label>
                        <input type="text" id="contact-name" required>
                    </div>
                    <div class="form-group">
                        <label for="contact-email">Email</label>
                        <input type="email" id="contact-email" required>
                    </div>
                    <div class="form-group">
                        <label for="contact-phone">Phone Number</label>
                        <input type="tel" id="contact-phone" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="cancel-contact">Cancel</button>
                        <button type="submit" class="btn btn-primary">Send Request</button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('cancel-contact')?.addEventListener('click', () => {
            this.renderSubscription();
        });
        
        document.getElementById('sales-contact-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSalesContact();
        });
    }

    handleSalesContact() {
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const phone = document.getElementById('contact-phone').value;
        
        if (!name || !email || !phone) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }
        
        this.showAlert('Your request has been sent to our sales team. They will contact you shortly.', 'success');
        this.renderSubscription();
    }

    // ==================== ACCOUNT MANAGEMENT ====================
    renderAccountPage() {
        const container = document.getElementById('account-page');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-user-cog"></i> My Account</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> <span>My Account</span>
                </div>
            </div>
            
            <div class="account-details">
                <div class="profile-section">
                    <div class="profile-image">
                        <img src="${this.currentUser.profileImage}" alt="Profile">
                        <button class="btn btn-sm btn-outline" id="change-photo">
                            <i class="fas fa-camera"></i> Change Photo
                        </button>
                    </div>
                    
                    <div class="profile-info">
                        <h3>${this.currentUser.name}</h3>
                        <p>${this.currentUser.title}</p>
                        <p>${this.currentUser.restaurant}</p>
                        <p>${this.currentUser.location}</p>
                    </div>
                </div>
                
                <form class="account-form" id="account-form">
                    <div class="form-group">
                        <label for="account-name">Full Name</label>
                        <input type="text" id="account-name" value="${this.currentUser.name}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-email">Email</label>
                        <input type="email" id="account-email" value="${this.currentUser.email}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-restaurant">Restaurant/Hotel Name</label>
                        <input type="text" id="account-restaurant" value="${this.currentUser.restaurant}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-title">Title</label>
                        <input type="text" id="account-title" value="${this.currentUser.title}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="account-location">Location</label>
                        <input type="text" id="account-location" value="${this.currentUser.location}" required>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" id="cancel-changes">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('account-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateAccountDetails();
        });
        
        document.getElementById('cancel-changes')?.addEventListener('click', () => {
            this.showContentPage('dashboard-home');
        });
        
        document.getElementById('change-photo')?.addEventListener('click', () => {
            this.showPhotoUploadOptions();
        });
    }

    updateAccountDetails() {
        const name = document.getElementById('account-name').value;
        const email = document.getElementById('account-email').value;
        const restaurant = document.getElementById('account-restaurant').value;
        const title = document.getElementById('account-title').value;
        const location = document.getElementById('account-location').value;
        
        this.currentUser = {
            ...this.currentUser,
            name,
            email,
            restaurant,
            title,
            location
        };
        
        this.saveData('hoteza_user', this.currentUser);
        this.updateUI();
        this.showAlert('Account details updated successfully', 'success');
    }

    showPhotoUploadOptions() {
        const container = document.getElementById('account-page');
        container.innerHTML += `
            <div class="photo-upload-options">
                <h4>Change Profile Photo</h4>
                <div class="upload-buttons">
                    <button class="btn btn-primary" id="choose-photo">
                        <i class="fas fa-folder-open"></i> Choose from Files
                    </button>
                    <button class="btn btn-outline" id="cancel-upload">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('choose-photo')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.currentUser.profileImage = event.target.result;
                        this.saveData('hoteza_user', this.currentUser);
                        this.updateUI();
                        this.showAlert('Profile photo updated successfully', 'success');
                        this.renderAccountPage();
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });
        
        document.getElementById('cancel-upload')?.addEventListener('click', () => {
            this.renderAccountPage();
        });
    }

    // ==================== HELP & SUPPORT ====================
    showHelpSupport() {
        const modal = document.createElement('div');
        modal.className = 'support-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Help & Support</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="support-options">
                        <button id="faq-option" class="support-option btn-hover">
                            <i class="fas fa-question-circle"></i>
                            <span>FAQs</span>
                        </button>
                        <button id="contact-option" class="support-option btn-hover">
                            <i class="fas fa-envelope"></i>
                            <span>Contact Us</span>
                        </button>
                        <button id="call-option" class="support-option btn-hover">
                            <i class="fas fa-phone"></i>
                            <span>Call Support</span>
                        </button>
                    </div>
                    <div id="support-form-container"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        this.setupSupportOptions();
    }

    setupSupportOptions() {
        document.getElementById('faq-option')?.addEventListener('click', () => {
            this.showFAQs();
        });
        
        document.getElementById('contact-option')?.addEventListener('click', () => {
            this.showContactForm();
        });
        
        document.getElementById('call-option')?.addEventListener('click', () => {
            this.initiateSupportCall();
        });
    }

    showFAQs() {
        const container = document.getElementById('support-form-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="faq-section">
                <h4>Frequently Asked Questions</h4>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <span>How do I add a new waiter?</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Go to Waiter Management and click "Add Waiter". Fill in the required details and save.</p>
                    </div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">
                        <span>How do I upgrade my subscription?</span>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>Navigate to Subscription page and click on your desired plan. Confirm the upgrade when prompted.</p>
                    </div>
                </div>
            </div>
        `;
        
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const icon = question.querySelector('i');
                
                answer.classList.toggle('active');
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            });
        });
    }

    showContactForm() {
        const container = document.getElementById('support-form-container');
        if (!container) return;
        
        container.innerHTML = `
            <form id="support-contact-form">
                <div class="form-group">
                    <label for="support-subject">Subject</label>
                    <input type="text" id="support-subject" required>
                </div>
                
                <div class="form-group">
                    <label for="support-message">Message</label>
                    <textarea id="support-message" rows="5" required></textarea>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-paper-plane"></i> Send Message
                </button>
            </form>
        `;
        
        document.getElementById('support-contact-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitSupportRequest();
        });
    }

    initiateSupportCall() {
        if (confirm('Call our support team at +255 123 456 789?')) {
            this.showAlert('Please call +255 123 456 789 for immediate assistance.', 'info');
        }
    }

    submitSupportRequest() {
        const subject = document.getElementById('support-subject').value;
        const message = document.getElementById('support-message').value;
        
        if (!subject || !message) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }
        
        this.showAlert('Your support request has been submitted. We will respond within 24 hours.', 'success');
        document.querySelector('.support-modal')?.remove();
    }

    // ==================== UTILITY METHODS ====================
    updateUI() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name;
            document.getElementById('user-avatar').src = this.currentUser.profileImage;
        }
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${type} slide-in`;
        alertEl.innerHTML = `
            <span>${message}</span>
            <button class="close-alert">&times;</button>
        `;
        
        // Add to body
        document.body.appendChild(alertEl);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alertEl.classList.remove('slide-in');
            alertEl.classList.add('slide-out');
            setTimeout(() => alertEl.remove(), 300);
        }, 5000);
        
        // Close button
        alertEl.querySelector('.close-alert').addEventListener('click', () => {
            alertEl.classList.remove('slide-in');
            alertEl.classList.add('slide-out');
            setTimeout(() => alertEl.remove(), 300);
        });
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new HotezaApp();
    
    // Add global togglePassword function
    window.togglePassword = function(inputId) {
        const input = document.getElementById(inputId);
        const icon = document.querySelector(`[onclick="togglePassword('${inputId}')"] i`);
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };
    
    // Add mobile menu toggle for small screens
    if (window.innerWidth <= 768) {
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.className = 'mobile-menu-toggle';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mobileMenuBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
        document.body.appendChild(mobileMenuBtn);
    }
});
