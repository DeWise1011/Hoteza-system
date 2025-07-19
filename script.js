class HotezaApp {
    constructor() {
        this.currentUser = null;
        this.waiters = [];
        this.orders = [];
        this.menuItems = [];
        this.expenses = [];
        this.wasteRecords = [];
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
        
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                if (window.location.pathname.includes('index.html')) {
                    window.location.href = "dashboard.html";
                } else if (window.location.pathname.includes('dashboard.html')) {
                    this.initDashboard();
                }
            } else {
                // User is signed out
                if (window.location.pathname.includes('dashboard.html')) {
                    window.location.href = "index.html";
                } else {
                    this.initAuth();
                }
            }
        });
        
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
        
        // Logout button
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
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

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                localStorage.setItem('hoteza_user', JSON.stringify({
                    name: userCredential.user.displayName || email.split('@')[0],
                    email: userCredential.user.email,
                    profileImage: userCredential.user.photoURL || 'https://via.placeholder.com/40'
                }));
                
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                this.showAlert(error.message, 'error');
            });
    }

    handleSignup() {
        const restaurantName = document.getElementById('restaurant-name').value;
        const fullName = document.getElementById('full-name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const location = document.getElementById('location').value;
        const title = document.getElementById('title').value;

        if (password !== confirmPassword) {
            this.showAlert('Passwords do not match', 'error');
            return;
        }

        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return userCredential.user.updateProfile({
                    displayName: fullName
                }).then(() => {
                    localStorage.setItem('hoteza_user', JSON.stringify({
                        name: fullName,
                        email: email,
                        restaurant: restaurantName,
                        location: location,
                        title: title,
                        profileImage: 'https://via.placeholder.com/40'
                    }));
                    
                    window.location.href = "dashboard.html";
                });
            })
            .catch((error) => {
                this.showAlert(error.message, 'error');
            });
    }

    handleLogout() {
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('hoteza_user');
            window.location.href = "index.html";
        });
    }

    // ==================== DASHBOARD ====================
    initDashboard() {
        const user = firebase.auth().currentUser;
        
        if (!user) {
            window.location.href = "index.html";
            return;
        }

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
            case 'waste-management':
                this.renderWasteManagement();
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
        this.wasteRecords = JSON.parse(localStorage.getItem('hoteza_wasteRecords') || '[]');
        this.vouchers = JSON.parse(localStorage.getItem('hoteza_vouchers') || '[]');
        this.walletBalance = parseFloat(localStorage.getItem('hoteza_walletBalance')) || 0;
        
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
            localStorage.setItem('hoteza_wasteRecords', JSON.stringify(this.wasteRecords));
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
        
        // Sample waste records
        this.wasteRecords = [
            { type: 'organic', quantity: 5, date: today },
            { type: 'plastic', quantity: 3, date: today }
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
                    <button class="btn btn-action" data-page="waste-management">
                        <i class="fas fa-trash-alt"></i> <span class="action-text">Record Waste</span>
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

    // ==================== WASTE MANAGEMENT ====================
    renderWasteManagement() {
        const container = document.getElementById('waste-management');
        if (!container) return;
        
        container.innerHTML = `
            <div class="content-header">
                <h2><i class="fas fa-trash-alt"></i> Waste Management</h2>
                <div class="breadcrumbs">
                    <span>Home</span> <i class="fas fa-chevron-right"></i> <span>Waste</span>
                </div>
            </div>

            <div class="waste-grid">
                <div class="waste-card" data-type="organic">
                    <div class="waste-icon">
                        <i class="fas fa-apple-alt"></i>
                    </div>
                    <div class="waste-name">Organic Waste</div>
                    <div class="waste-quantity" id="organic-quantity">0 kg</div>
                    <input type="checkbox" class="waste-checkbox" id="organic-checkbox">
                </div>
                
                <div class="waste-card" data-type="plastic">
                    <div class="waste-icon">
                        <i class="fas fa-wine-bottle"></i>
                    </div>
                    <div class="waste-name">Plastic Waste</div>
                    <div class="waste-quantity" id="plastic-quantity">0 kg</div>
                    <input type="checkbox" class="waste-checkbox" id="plastic-checkbox">
                </div>
                
                <div class="waste-card" data-type="glass">
                    <div class="waste-icon">
                        <i class="fas fa-glass-whiskey"></i>
                    </div>
                    <div class="waste-name">Glass Waste</div>
                    <div class="waste-quantity" id="glass-quantity">0 kg</div>
                    <input type="checkbox" class="waste-checkbox" id="glass-checkbox">
                </div>
                
                <div class="waste-card" data-type="metal">
                    <div class="waste-icon">
                        <i class="fas fa-cog"></i>
                    </div>
                    <div class="waste-name">Metal Waste</div>
                    <div class="waste-quantity" id="metal-quantity">0 kg</div>
                    <input type="checkbox" class="waste-checkbox" id="metal-checkbox">
                </div>
                
                <div class="waste-card" data-type="other">
                    <div class="waste-icon">
                        <i class="fas fa-trash"></i>
                    </div>
                    <div class="waste-name">Other Waste</div>
                    <div class="waste-quantity" id="other-quantity">0 kg</div>
                    <input type="checkbox" class="waste-checkbox" id="other-checkbox">
                </div>
            </div>

            <div class="waste-table">
                <div class="table-header">
                    <span>Date</span>
                    <span>Type</span>
                    <span>Quantity</span>
                    <span>Actions</span>
                </div>
                <div class="table-body" id="waste-list"></div>
            </div>
        `;

        // Set up event listeners for waste checkboxes
        document.querySelectorAll('.waste-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const wasteCard = e.target.closest('.waste-card');
                const wasteType = wasteCard.getAttribute('data-type');
                
                if (e.target.checked) {
                    this.showWasteQuantityModal(wasteType);
                } else {
                    this.removeWasteRecord(wasteType);
                }
            });
        });

        this.updateWasteStats();
        this.renderWasteList();
    }

    showWasteQuantityModal(wasteType) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Record ${this.capitalizeFirstLetter(wasteType)} Waste</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="waste-quantity-form">
                        <div class="form-group">
                            <label for="waste-quantity">Quantity (kg)</label>
                            <input type="number" id="waste-quantity" min="0" step="0.1" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" id="cancel-waste">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
            document.getElementById(`${wasteType}-checkbox`).checked = false;
        });

        modal.querySelector('#cancel-waste').addEventListener('click', () => {
            modal.remove();
            document.getElementById(`${wasteType}-checkbox`).checked = false;
        });

        modal.querySelector('#waste-quantity-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const quantity = parseFloat(document.getElementById('waste-quantity').value);
            
            if (isNaN(quantity) || quantity <= 0) {
                this.showAlert('Please enter a valid quantity', 'error');
                return;
            }

            this.addWasteRecord(wasteType, quantity);
            modal.remove();
        });
    }

    addWasteRecord(type, quantity) {
        const today = new Date().toISOString().split('T')[0];
        
        // Remove any existing record for today
        this.wasteRecords = this.wasteRecords.filter(record => 
            !(record.type === type && record.date === today)
        );
        
        this.wasteRecords.push({
            type,
            quantity,
            date: today
        });
        
        this.saveData('hoteza_wasteRecords', this.wasteRecords);
        this.updateWasteStats();
        this.renderWasteList();
        this.showAlert(`${this.capitalizeFirstLetter(type)} waste recorded successfully`, 'success');
    }

    removeWasteRecord(type) {
        const today = new Date().toISOString().split('T')[0];
        this.wasteRecords = this.wasteRecords.filter(record => 
            !(record.type === type && record.date === today)
        );
        
        this.saveData('hoteza_wasteRecords', this.wasteRecords);
        this.updateWasteStats();
        this.renderWasteList();
    }

    updateWasteStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayWaste = this.wasteRecords.filter(record => record.date === today);
        
        const wasteTypes = ['organic', 'plastic', 'glass', 'metal', 'other'];
        
        wasteTypes.forEach(type => {
            const record = todayWaste.find(r => r.type === type);
            const quantityElement = document.getElementById(`${type}-quantity`);
            const checkbox = document.getElementById(`${type}-checkbox`);
            
            if (quantityElement) {
                quantityElement.textContent = record ? `${record.quantity} kg` : '0 kg';
            }
            
            if (checkbox) {
                checkbox.checked = !!record;
            }
        });
    }

    renderWasteList() {
        const container = document.getElementById('waste-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.wasteRecords.length === 0) {
            container.innerHTML = '<div class="empty-state">No waste records found</div>';
            return;
        }
        
        // Sort by date (newest first)
        const sortedRecords = [...this.wasteRecords].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sortedRecords.forEach((record, index) => {
            const wasteEl = document.createElement('div');
            wasteEl.className = 'waste-item';
            wasteEl.innerHTML = `
                <span>${record.date}</span>
                <span>${this.capitalizeFirstLetter(record.type)}</span>
                <span>${record.quantity} kg</span>
                <span class="action-buttons">
                    <button class="btn-delete" data-index="${index}">
                        <i class="fas fa-trash"></i>
                        <span class="mobile-only">Delete</span>
                    </button>
                </span>
            `;
            container.appendChild(wasteEl);
        });
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                this.deleteWasteRecord(index);
            });
        });
    }

    deleteWasteRecord(index) {
        if (confirm('Are you sure you want to delete this waste record?')) {
            this.wasteRecords.splice(index, 1);
            this.saveData('hoteza_wasteRecords', this.wasteRecords);
            this.updateWasteStats();
            this.renderWasteList();
            this.showAlert('Waste record deleted successfully', 'success');
        }
    }

    // ==================== UTILITY METHODS ====================
    updateUI() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name;
            document.getElementById('user-avatar').src = this.currentUser.profileImage;
        }
    }

    showAlert(message, type = 'info') {
        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${type} slide-in`;
        alertEl.innerHTML = `
            <span>${message}</span>
            <button class="close-alert">&times;</button>
        `;
        
        document.body.appendChild(alertEl);
        
        setTimeout(() => {
            alertEl.classList.remove('slide-in');
            alertEl.classList.add('slide-out');
            setTimeout(() => alertEl.remove(), 300);
        }, 5000);
        
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
    const firebaseConfig = {
        apiKey: "AIzaSyCLoFFo9X2i_Km-LbZJtGZlsVbW9JvM-VE",
        authDomain: "hoteza-615a3.firebaseapp.com",
        projectId: "hoteza-615a3",
        storageBucket: "hoteza-615a3.firebasestorage.app",
        messagingSenderId: "661475932399",
        appId: "1:661475932399:web:4b5bc3743ea0a2eb31c31a",
        measurementId: "G-ZWP05T1NQ7"
    };

    firebase.initializeApp(firebaseConfig);

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
