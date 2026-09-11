// Host Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mock Data Seeding
    seedMockData();

    // 2. Load Data from LocalStorage
    const listings = JSON.parse(localStorage.getItem('host_listings')) || [];
    const bookings = JSON.parse(localStorage.getItem('tripmate_trips')) || [];

    // 3. UI Bindings
    setupUserMenu();
    setupTabSwitching();
    renderOverview(listings, bookings);
});

// --- Data Seeding ---
function seedMockData() {
    if (!localStorage.getItem('host_listings')) {
        const mockListings = [
            { id: 'L1', name: 'Sunset Villa', type: 'House', price: 4500, status: 'published', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
            { id: 'L2', name: 'Cozy Condo', type: 'Apartment', price: 2500, status: 'published', img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80' },
            { id: 'L3', name: 'Untitled Property', type: 'House', price: null, status: 'draft', img: null }
        ];
        localStorage.setItem('host_listings', JSON.stringify(mockListings));
    }
    
    if (!localStorage.getItem('tripmate_trips')) {
        const mockTrips = [
            { id: 'T1', listingId: 'L1', propertyName: 'Sunset Villa', guestName: 'Maria Clara', checkin: '2026-10-12', checkout: '2026-10-15', status: 'confirmed', amount: 13500 },
            { id: 'T2', listingId: 'L2', propertyName: 'Cozy Condo', guestName: 'Jose Rizal', checkin: '2026-10-18', checkout: '2026-10-20', status: 'pending', amount: 5000 },
            { id: 'T3', listingId: 'L1', propertyName: 'Sunset Villa', guestName: 'Andres Bonifacio', checkin: '2026-11-01', checkout: '2026-11-05', status: 'confirmed', amount: 18000 }
        ];
        localStorage.setItem('tripmate_trips', JSON.stringify(mockTrips));
    }
}

// --- UI Logic ---
function setupUserMenu() {
    const userAvatarBtn = document.getElementById('userAvatarBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userAvatarBtn && userDropdown) {
        userAvatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('open');
        });
        
        document.addEventListener('click', (e) => {
            if (!userAvatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('open');
            }
        });
    }
}

function setupTabSwitching() {
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    const sections = document.querySelectorAll('.tab-section');
    const contentTitle = document.getElementById('contentTitle');
    const contentSubtitle = document.getElementById('contentSubtitle');
    
    const titles = {
        'overview': { title: 'Host Overview', subtitle: 'Welcome back. Here\'s what\'s happening with your properties.' },
        'listings': { title: 'My Listings', subtitle: 'Manage your properties and draft new ones.' },
        'bookings': { title: 'All Bookings', subtitle: 'View and manage all guest reservations.' },
        'earnings': { title: 'Earnings', subtitle: 'Track your payouts and performance.' }
    };

    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.dataset.tab;
            
            // Toggle active state on tabs
            sidebarTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update Header
            contentTitle.textContent = titles[filter].title;
            contentSubtitle.textContent = titles[filter].subtitle;
            
            // Toggle Sections
            sections.forEach(sec => sec.style.display = 'none');
            const targetSection = document.getElementById(`${filter}Section`);
            if(targetSection) targetSection.style.display = 'block';
            
            // Refresh data if needed (just calling render logic again)
            const listings = JSON.parse(localStorage.getItem('host_listings')) || [];
            const bookings = JSON.parse(localStorage.getItem('tripmate_trips')) || [];
            
            if(filter === 'listings') renderListingsSection(listings);
            if(filter === 'bookings') renderBookingsSection(bookings);
        });
    });
}

// --- Render Logic ---
function renderOverview(listings, bookings) {
    // 1. Stats
    const totalListings = listings.filter(l => l.status === 'published').length;
    const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalEarnings = bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + b.amount, 0);
    
    document.getElementById('statTotalListings').textContent = totalListings;
    document.getElementById('statActiveBookings').textContent = activeBookings;
    document.getElementById('statEarnings').textContent = `₱${totalEarnings.toLocaleString()}`;
    document.getElementById('statOccupancy').textContent = '78%'; // Hardcoded demo value

    // 2. Recent Bookings Table
    const recentTableBody = document.getElementById('recentBookingsTableBody');
    const recentEmpty = document.getElementById('overviewBookingsEmpty');
    
    if (bookings.length === 0) {
        recentEmpty.style.display = 'block';
    } else {
        recentEmpty.style.display = 'none';
        recentTableBody.innerHTML = bookings.slice(0, 5).map(createBookingRow).join('');
    }
}

function renderListingsSection(listings) {
    const grid = document.getElementById('allListingsGrid');
    const emptyState = document.getElementById('listingsEmpty');
    
    if (listings.length === 0) {
        emptyState.style.display = 'block';
        grid.innerHTML = '';
    } else {
        emptyState.style.display = 'none';
        grid.innerHTML = listings.map(createListingCard).join('');
    }
}

function renderBookingsSection(bookings) {
    const tableBody = document.getElementById('allBookingsTableBody');
    const emptyState = document.getElementById('bookingsEmpty');
    
    if (bookings.length === 0) {
        emptyState.style.display = 'block';
        tableBody.innerHTML = '';
    } else {
        emptyState.style.display = 'none';
        tableBody.innerHTML = bookings.map(createBookingRow).join('');
    }
}

// --- HTML Generators ---
function createBookingRow(booking) {
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return `
        <tr>
            <td><strong>${booking.guestName}</strong></td>
            <td>${booking.propertyName}</td>
            <td>${formatDate(booking.checkin)} - ${formatDate(booking.checkout)}</td>
            <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
            <td>₱${booking.amount.toLocaleString()}</td>
        </tr>
    `;
}

function createListingCard(listing) {
    const isDraft = listing.status === 'draft';
    const priceStr = isDraft ? '₱--' : `₱${listing.price.toLocaleString()}`;
    
    const imageHTML = isDraft 
        ? `<div class="listing-img-container draft-img">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span class="status-badge draft">Draft</span>
           </div>`
        : `<div class="listing-img-container">
                <img src="${listing.img}" alt="${listing.name}">
                <span class="status-badge published">Published</span>
           </div>`;
           
    const actionsHTML = isDraft
        ? `<button class="btn btn-primary btn-sm" style="width: 100%;">Continue Setup</button>`
        : `<button class="btn btn-secondary btn-sm">Edit</button>
           <button class="btn btn-secondary btn-sm">Calendar</button>`;

    return `
        <div class="host-listing-card">
            ${imageHTML}
            <div class="listing-content">
                <h3>${listing.name}</h3>
                <p class="price">${priceStr} <span>/ night</span></p>
                <div class="listing-actions">
                    ${actionsHTML}
                </div>
            </div>
        </div>
    `;
}
