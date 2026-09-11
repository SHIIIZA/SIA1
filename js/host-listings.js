/* TripMate — Host Listings Logic */

(function () {
    "use strict";

    // DOM elements
    const listingsGrid = document.getElementById("listingsGrid");
    const listingsEmpty = document.getElementById("listingsEmpty");
    const addListingBtn = document.getElementById("addListingBtn");
    const listingFormModal = document.getElementById("listingFormModal");
    const listingForm = document.getElementById("listingForm");
    const modalTitle = document.getElementById("modalTitle");
    const cancelBtn = document.getElementById("cancelBtn");
    const userAvatarBtn = document.getElementById("userAvatarBtn");
    const userDropdown = document.getElementById("userDropdown");
    const dropdownName = document.getElementById("dropdownName");
    const dropdownEmail = document.getElementById("dropdownEmail");
    const avatarPlaceholder = document.getElementById("avatarPlaceholder");
    const logoutBtn = document.getElementById("logoutBtn");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.getElementById("sidebar");
    const sidebarClose = document.getElementById("sidebarClose");

    // Form step elements
    const formSteps = document.querySelectorAll(".form-step");
    const stepItems = document.querySelectorAll(".form-step-item");
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");
    const submitBtn = document.getElementById("submitBtn");

    // Current state
    let currentStep = 1;
    let editingListingId = null;

    // Auth check - host must be logged in
    const user = JSON.parse(localStorage.getItem("tripmate_user") || "null");
    const session = JSON.parse(localStorage.getItem("tripmate_session") || "null");

    if (!user || !session) {
        window.location.href = "../login.html?redirect=host/listings.html";
        return;
    }

    // Populate user info
    function populateUserInfo() {
        dropdownName.textContent = user.name || "Host";
        dropdownEmail.textContent = user.email || "";
        if (user.name) {
            const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase();
            avatarPlaceholder.textContent = initials.slice(0, 2);
        }
    }

    // Get host's listings from localStorage
    function getHostListings() {
        const allListings = JSON.parse(localStorage.getItem("tripmate_listings") || "[]");
        return allListings.filter(l => l.hostId === user.id);
    }

    // Save listing to localStorage
    function saveListing(listingData) {
        const allListings = JSON.parse(localStorage.getItem("tripmate_listings") || "[]");
        const existingIndex = allListings.findIndex(l => l.id === listingData.id);
        if (existingIndex >= 0) {
            allListings[existingIndex] = listingData;
        } else {
            allListings.push(listingData);
        }
        localStorage.setItem("tripmate_listings", JSON.stringify(allListings));
    }

    // Delete listing
    function deleteListing(listingId) {
        const allListings = JSON.parse(localStorage.getItem("tripmate_listings") || "[]");
        const filtered = allListings.filter(l => l.id !== listingId);
        localStorage.setItem("tripmate_listings", JSON.stringify(filtered));
    }

    // Format PHP currency
    function formatPHP(amount) {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Render listings grid
    function renderListings() {
        const listings = getHostListings();

        if (listings.length === 0) {
            listingsGrid.style.display = "none";
            listingsEmpty.style.display = "block";
            return;
        }

        listingsGrid.style.display = "grid";
        listingsEmpty.style.display = "none";

        listingsGrid.innerHTML = listings.map(listing => `
            <article class="listing-card" data-id="${listing.id}">
                <div class="listing-image">
                    <img src="${listing.images?.[0] || '../images/placeholder-property.svg'}" alt="${listing.title}">
                    <span class="listing-status status-${listing.status || 'draft'}">${listing.status || 'Draft'}</span>
                </div>
                <div class="listing-content">
                    <h3 class="listing-title">${listing.title}</h3>
                    <p class="listing-location">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        ${listing.location}
                    </p>
                    <div class="listing-meta">
                        <span>${listing.propertyType || 'Property'}</span>
                        <span>·</span>
                        <span>${listing.bedrooms || 1} bed · ${listing.bathrooms || 1} bath</span>
                        <span>·</span>
                        <span>Max ${listing.maxGuests || 1} guests</span>
                    </div>
                    <div class="listing-price-row">
                        <span class="listing-price">₱${formatPHP(listing.pricePerNight || 0)}/night</span>
                    </div>
                    <div class="listing-actions">
                        <button class="btn btn-sm btn-outline edit-listing" data-id="${listing.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit
                        </button>
                        <button class="btn btn-sm btn-outline delete-listing" data-id="${listing.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete
                        </button>
                    </div>
                </div>
            </article>
        `).join("");

        // Attach event listeners
        document.querySelectorAll(".edit-listing").forEach(btn => {
            btn.addEventListener("click", () => openEditModal(btn.dataset.id));
        });
        document.querySelectorAll(".delete-listing").forEach(btn => {
            btn.addEventListener("click", () => confirmDelete(btn.dataset.id));
        });
    }

    // Open modal for new listing
    function openNewModal() {
        editingListingId = null;
        modalTitle.textContent = "Add New Listing";
        resetForm();
        showStep(1);
        listingFormModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    // Open modal for editing
    function openEditModal(listingId) {
        const listings = getHostListings();
        const listing = listings.find(l => l.id === listingId);
        if (!listing) return;

        editingListingId = listingId;
        modalTitle.textContent = "Edit Listing";
        populateForm(listing);
        showStep(1);
        listingFormModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    // Close modal
    function closeModal() {
        listingFormModal.classList.remove("active");
        document.body.style.overflow = "";
        editingListingId = null;
    }

    // Reset form
    function resetForm() {
        listingForm.reset();
        document.getElementById("listingId").value = "";
    }

    // Populate form with listing data
    function populateForm(listing) {
        document.getElementById("listingId").value = listing.id;
        document.getElementById("title").value = listing.title || "";
        document.getElementById("description").value = listing.description || "";
        document.getElementById("propertyType").value = listing.propertyType || "";
        document.getElementById("location").value = listing.location || "";
        document.getElementById("address").value = listing.address || "";
        document.getElementById("pricePerNight").value = listing.pricePerNight || "";
        document.getElementById("bedrooms").value = listing.bedrooms || 1;
        document.getElementById("bathrooms").value = listing.bathrooms || 1;
        document.getElementById("maxGuests").value = listing.maxGuests || 1;
        document.getElementById("checkInTime").value = listing.checkInTime || "15:00";
        document.getElementById("checkOutTime").value = listing.checkOutTime || "11:00";
        // Amenities
        const amenities = listing.amenities || [];
        document.querySelectorAll('input[name="amenities"]').forEach(cb => {
            cb.checked = amenities.includes(cb.value);
        });
        // Images - would need file handling for actual uploads
    }

    // Collect form data
    function collectFormData() {
        const amenities = [];
        document.querySelectorAll('input[name="amenities"]:checked').forEach(cb => {
            amenities.push(cb.value);
        });

        return {
            id: document.getElementById("listingId").value || "listing_" + Date.now(),
            hostId: user.id,
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            propertyType: document.getElementById("propertyType").value,
            location: document.getElementById("location").value,
            address: document.getElementById("address").value,
            pricePerNight: parseFloat(document.getElementById("pricePerNight").value) || 0,
            bedrooms: parseInt(document.getElementById("bedrooms").value) || 1,
            bathrooms: parseInt(document.getElementById("bathrooms").value) || 1,
            maxGuests: parseInt(document.getElementById("maxGuests").value) || 1,
            checkInTime: document.getElementById("checkInTime").value,
            checkOutTime: document.getElementById("checkOutTime").value,
            amenities: amenities,
            status: editingListingId ? "active" : "draft",
            images: editingListingId ? getExistingImages() : ["../images/placeholder-property.svg"],
            updatedAt: new Date().toISOString()
        };
    }

    function getExistingImages() {
        const listings = getHostListings();
        const listing = listings.find(l => l.id === editingListingId);
        return listing?.images || ["../images/placeholder-property.svg"];
    }

    // Validate current step
    function validateStep(step) {
        const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
        const requiredFields = stepEl.querySelectorAll("[required]");
        let valid = true;
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add("error");
                valid = false;
            } else {
                field.classList.remove("error");
            }
        });
        return valid;
    }

    // Show step
    function showStep(step) {
        formSteps.forEach(s => s.classList.remove("active"));
        stepItems.forEach((item, i) => {
            item.classList.remove("active", "completed");
            if (i + 1 < step) item.classList.add("completed");
            if (i + 1 === step) item.classList.add("active");
        });
        document.querySelector(`.form-step[data-step="${step}"]`).classList.add("active");
        currentStep = step;

        prevBtn.style.display = step > 1 ? "inline-flex" : "none";
        nextBtn.style.display = step < formSteps.length ? "inline-flex" : "none";
        submitBtn.style.display = step === formSteps.length ? "inline-flex" : "none";
    }

    // Next step
    function nextStep() {
        if (validateStep(currentStep)) {
            showStep(currentStep + 1);
        }
    }

    // Previous step
    function prevStep() {
        showStep(currentStep - 1);
    }

    // Submit form
    function submitForm(e) {
        e.preventDefault();
        if (!validateStep(currentStep)) return;

        const listingData = collectFormData();
        saveListing(listingData);
        closeModal();
        renderListings();
    }

    // Confirm delete
    function confirmDelete(listingId) {
        if (confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
            deleteListing(listingId);
            renderListings();
        }
    }

    // Sidebar toggle
    function toggleSidebar() {
        sidebar.classList.toggle("open");
    }

    // User dropdown toggle
    function toggleDropdown() {
        userDropdown.classList.toggle("open");
    }

    // Logout
    function logout() {
        localStorage.removeItem("tripmate_session");
        localStorage.removeItem("tripmate_user");
        window.location.href = "../login.html";
    }

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
        if (!userAvatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove("open");
        }
    });

    // Event listeners
    addListingBtn?.addEventListener("click", openNewModal);
    cancelBtn?.addEventListener("click", closeModal);
    listingForm?.addEventListener("submit", submitForm);
    nextBtn?.addEventListener("click", nextStep);
    prevBtn?.addEventListener("click", prevStep);
    userAvatarBtn?.addEventListener("click", toggleDropdown);
    logoutBtn?.addEventListener("click", logout);
    mobileMenuBtn?.addEventListener("click", toggleSidebar);
    sidebarClose?.addEventListener("click", toggleSidebar);

    // Close modal on overlay click
    listingFormModal?.addEventListener("click", (e) => {
        if (e.target === listingFormModal) closeModal();
    });

    // Initialize
    populateUserInfo();
    renderListings();
})();