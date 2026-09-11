/* TripMate — Profile Page Logic */

(function () {
    "use strict";

    // DOM elements
    const accountForm = document.getElementById("accountForm");
    const securityForm = document.getElementById("securityForm");
    const avatarInput = document.getElementById("avatarInput");
    const avatarPreview = document.getElementById("avatarPreview");
    const avatarInitials = document.getElementById("avatarInitials");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const currentPasswordInput = document.getElementById("currentPassword");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");

    const userAvatarBtn = document.getElementById("userAvatarBtn");
    const userDropdown = document.getElementById("userDropdown");
    const dropdownName = document.getElementById("dropdownName");
    const dropdownEmail = document.getElementById("dropdownEmail");
    const avatarPlaceholder = document.getElementById("avatarPlaceholder");
    const logoutBtn = document.getElementById("logoutBtn");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");

    // Auth check
    const user = JSON.parse(localStorage.getItem("tripmate_user") || "null");
    const session = JSON.parse(localStorage.getItem("tripmate_session") || "null");

    if (!user || !session) {
        window.location.href = "login.html?redirect=profile.html";
        return;
    }

    // Populate user info
    function populateUserInfo() {
        dropdownName.textContent = user.name || "Guest";
        dropdownEmail.textContent = user.email || "";
        if (user.name) {
            const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            avatarPlaceholder.textContent = initials;
            avatarInitials.textContent = initials;
        }

        // Populate form fields
        const nameParts = (user.name || "").split(" ");
        firstNameInput.value = nameParts[0] || "";
        lastNameInput.value = nameParts.slice(1).join(" ") || "";
        emailInput.value = user.email || "";
        phoneInput.value = user.phone || "";
    }

    // Save account info
    accountForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!firstName || !lastName || !email) {
            showToast("Please fill in all required fields.", true);
            return;
        }

        if (!email.includes("@")) {
            showToast("Please enter a valid email address.", true);
            return;
        }

        // Update user in localStorage
        const updatedUser = { ...user, name: `${firstName} ${lastName}`, email, phone };
        localStorage.setItem("tripmate_user", JSON.stringify(updatedUser));

        // Also update in users array if exists
        const users = JSON.parse(localStorage.getItem("tripmate_users") || "[]");
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updatedUser };
            localStorage.setItem("tripmate_users", JSON.stringify(users));
        }

        showToast("Profile updated successfully!");
        populateUserInfo();
    });

    // Change password
    securityForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast("Please fill in all password fields.", true);
            return;
        }

        if (newPassword.length < 8) {
            showToast("New password must be at least 8 characters.", true);
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast("New passwords do not match.", true);
            return;
        }

        // Verify the current password and apply the change via the shared
        // auth.js helper, rather than overwriting unconditionally.
        if (typeof changePassword !== "function") {
            showToast("Unable to update password right now.", true);
            return;
        }

        const result = changePassword(user.id, currentPassword, newPassword);
        if (!result.ok) {
            showToast(result.error || "Could not update password.", true);
            return;
        }

        showToast("Password updated successfully!");
        securityForm.reset();
    });

    // Avatar upload
    avatarInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            showToast("Please select an image file.", true);
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast("Image must be less than 2MB.", true);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            avatarPreview.innerHTML = `<img src="${dataUrl}" alt="Profile">`;
            avatarPreview.style.background = "transparent";

            // Save to localStorage (in a real app, this would be uploaded to a server)
            const updatedUser = { ...user, avatar: dataUrl };
            localStorage.setItem("tripmate_user", JSON.stringify(updatedUser));

            // Also persist to the master users array — without this the
            // photo is lost the next time the user logs in, since login
            // rebuilds the session copy from tripmate_users.
            const users = JSON.parse(localStorage.getItem("tripmate_users") || "[]");
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], avatar: dataUrl };
                localStorage.setItem("tripmate_users", JSON.stringify(users));
            }

            showToast("Profile photo updated!");
        };
        reader.readAsDataURL(file);
    });

    // Delete account
    deleteAccountBtn.addEventListener("click", () => {
        if (!confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.")) return;

        if (!confirm("This will delete all your bookings, wishlist, and account information. Are you sure?")) return;

        // Remove user data
        localStorage.removeItem("tripmate_user");
        localStorage.removeItem("tripmate_session");

        // Remove from users array
        const users = JSON.parse(localStorage.getItem("tripmate_users") || "[]");
        const filteredUsers = users.filter(u => u.id !== user.id);
        localStorage.setItem("tripmate_users", JSON.stringify(filteredUsers));

        // Remove user's bookings
        const bookings = JSON.parse(localStorage.getItem("tripmate_bookings") || "[]");
        const filteredBookings = bookings.filter(b => b.userId !== user.id);
        localStorage.setItem("tripmate_bookings", JSON.stringify(filteredBookings));

        // Remove user's wishlist
        const wishlist = JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
        const filteredWishlist = wishlist.filter(w => w.userId !== user.id);
        localStorage.setItem("tripmate_wishlist", JSON.stringify(filteredWishlist));

        showToast("Account deleted successfully.");
        setTimeout(() => {
            window.location.href = "homepage.html";
        }, 1500);
    });

    // User dropdown toggle
    userAvatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!userAvatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove("open");
        }
    });

    // Logout
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
        window.location.href = "homepage.html";
    });

    // Toast notification
    function showToast(message, isError = false) {
        let toast = document.querySelector(".toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "toast";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.toggle("error-toast", isError);
        toast.classList.add("show");
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => toast.classList.remove("show"), 3200);
    }

    const style = document.createElement("style");
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 14px 24px;
            border-radius: 12px;
            background: var(--teal-900);
            color: var(--white);
            font-weight: 500;
            font-size: 0.9rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s;
        }
        .toast.show {
            opacity: 1;
            transform: translateY(0);
        }
        .toast.error-toast {
            background: #EF4444;
        }
    `;
    document.head.appendChild(style);

    // Initialize
    populateUserInfo();
})();