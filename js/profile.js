/* TripMate — Profile Page Logic */

(function () {
    "use strict";

    const accountForm = document.getElementById("accountForm");
    const securityForm = document.getElementById("securityForm");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const bioInput = document.getElementById("bio");
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
    const adminSettingsBtn = document.getElementById("adminSettingsBtn");

    const notificationInputs = {
        booking: document.getElementById("notifBooking"),
        payment: document.getElementById("notifPayment"),
        reminders: document.getElementById("notifReminders"),
        promo: document.getElementById("notifPromo")
    };

    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = "login.html?redirect=profile.html";
        return;
    }

    const user = { ...currentUser };

    function populateUserInfo() {
        if (!dropdownName || !dropdownEmail || !avatarPlaceholder) return;

        dropdownName.textContent = user.name || "Guest";
        dropdownEmail.textContent = user.email || "";

        const initials = (user.name || "Guest")
            .split(" ")
            .map(name => name[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        avatarPlaceholder.textContent = initials;

        const nameParts = (user.name || "").split(" ");
        firstNameInput.value = nameParts[0] || "";
        lastNameInput.value = nameParts.slice(1).join(" ") || "";
        emailInput.value = user.email || "";
        phoneInput.value = user.phone || "";
        bioInput.value = user.bio || "";

        if (adminSettingsBtn) {
            adminSettingsBtn.style.display = (user.role || user.type || "guest") === "admin" ? "flex" : "none";
        }

        const notifications = JSON.parse(localStorage.getItem(`tripmate_notifications_${user.id}`) || "null") || {
            booking: true,
            payment: true,
            reminders: true,
            promo: false
        };

        Object.entries(notificationInputs).forEach(([key, input]) => {
            if (input) input.checked = notifications[key] !== false;
        });
    }

    accountForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const bio = bioInput.value.trim();

        if (!firstName || !lastName || !email) {
            showToast("Please fill in all required fields.", true);
            return;
        }

        if (!isValidEmail(email)) {
            showToast("Please enter a valid email address.", true);
            return;
        }

        const updatedUser = updateUser(user.id, {
            name: `${firstName} ${lastName}`.trim(),
            email,
            phone,
            bio
        });

        if (!updatedUser) {
            showToast("Unable to save your profile.", true);
            return;
        }

        localStorage.setItem("tripmate_user", JSON.stringify(updatedUser));
        showToast("Profile updated successfully!");
        populateUserInfo();
    });

    securityForm.addEventListener("submit", (event) => {
        event.preventDefault();

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

        const result = changePassword(user.id, currentPassword, newPassword);
        if (!result.ok) {
            showToast(result.error || "Could not update password.", true);
            return;
        }

        showToast("Password updated successfully!");
        securityForm.reset();
    });

    Object.entries(notificationInputs).forEach(([key, input]) => {
        input?.addEventListener("change", () => {
            const notifications = Object.fromEntries(
                Object.entries(notificationInputs).map(([name, checkbox]) => [name, checkbox?.checked !== false])
            );
            localStorage.setItem(`tripmate_notifications_${user.id}`, JSON.stringify(notifications));
            showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} notifications updated.`);
        });
    });

    deleteAccountBtn.addEventListener("click", () => {
        if (!confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) return;

        const users = JSON.parse(localStorage.getItem("tripmate_users") || "[]");
        const filteredUsers = users.filter(item => item.id !== user.id);
        localStorage.setItem("tripmate_users", JSON.stringify(filteredUsers));
        localStorage.removeItem("tripmate_user");
        localStorage.removeItem("tripmate_session");

        const bookings = JSON.parse(localStorage.getItem("tripmate_bookings") || "[]");
        localStorage.setItem("tripmate_bookings", JSON.stringify(bookings.filter(item => item.userId !== user.id)));

        const wishlist = JSON.parse(localStorage.getItem("tripmate_wishlist") || "[]");
        localStorage.setItem("tripmate_wishlist", JSON.stringify(wishlist.filter(item => item.userId !== user.id)));

        showToast("Account deleted successfully.");
        setTimeout(() => {
            window.location.href = "homepage.html";
        }, 1500);
    });

    userAvatarBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        userDropdown?.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
        if (userDropdown && userAvatarBtn && !userAvatarBtn.contains(event.target) && !userDropdown.contains(event.target)) {
            userDropdown.classList.remove("open");
        }
    });

    logoutBtn?.addEventListener("click", (event) => {
        event.preventDefault();
        logoutUser();
        window.location.href = "homepage.html";
    });

    populateUserInfo();
})();