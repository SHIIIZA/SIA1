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
    const profilePasswordStrength = document.getElementById("profilePasswordStrength");
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    const deleteAccountDialog = document.getElementById("deleteAccountDialog");
    const deleteAccountForm = document.getElementById("deleteAccountForm");
    const deleteAccountPassword = document.getElementById("deleteAccountPassword");
    const deleteAccountPhrase = document.getElementById("deleteAccountPhrase");
    const confirmDeleteAccount = document.getElementById("confirmDeleteAccount");
    const cancelDeleteAccount = document.getElementById("cancelDeleteAccount");
    const avatarInput = document.getElementById("avatarInput");
    const profileAvatarPreview = document.getElementById("profileAvatarPreview");
    const avatarUploadStatus = document.getElementById("avatarUploadStatus");

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

    let user = { ...currentUser };

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
        const avatarData = localStorage.getItem(`tripmate_avatar:${user.id}`);
        [avatarPlaceholder, profileAvatarPreview].filter(Boolean).forEach(element => {
            if (avatarData) {
                const image = document.createElement("img");
                image.src = avatarData;
                image.alt = "Profile photo";
                element.replaceChildren(image);
            } else {
                element.textContent = initials;
            }
        });

        const nameParts = (user.name || "").split(" ");
        firstNameInput.value = nameParts[0] || "";
        lastNameInput.value = nameParts.slice(1).join(" ") || "";
        emailInput.value = user.email || "";
        phoneInput.value = user.phone || "";
        bioInput.value = user.bio || "";

        if (adminSettingsBtn) {
            adminSettingsBtn.style.display = (user.role || user.type || "guest") === "admin" ? "flex" : "none";
        }

    }

    window.addEventListener("tripmate-user-updated", event => {
        if (!event.detail) {
            window.location.href = "login.html?redirect=profile.html";
            return;
        }
        user = event.detail;
        populateUserInfo();
    });

    accountForm.addEventListener("submit", async (event) => {
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

        const submitButton = accountForm.querySelector('[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        try {
            user = await apiUpdateProfile({
                name: `${firstName} ${lastName}`.trim(),
                email,
                phone,
                bio
            });
            showToast("Profile updated successfully.");
            populateUserInfo();
        } catch (error) {
            showToast(error.message || "Unable to save your profile.", true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });

    securityForm.addEventListener("submit", async (event) => {
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

        const submitButton = securityForm.querySelector('[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        try {
            await apiChangePassword(currentPassword, newPassword);
            showToast("Password updated successfully.");
            securityForm.reset();
        } catch (error) {
            showToast(error.message || "Could not update password.", true);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });

    newPasswordInput?.addEventListener("input", () => {
        const value = newPasswordInput.value;
        const score = [
            value.length >= 8,
            /[a-z]/.test(value) && /[A-Z]/.test(value),
            /\d/.test(value),
            /[^A-Za-z0-9]/.test(value)
        ].filter(Boolean).length;
        const labels = ["not entered", "weak", "fair", "good", "strong"];
        const level = value ? Math.max(1, score) : 0;
        profilePasswordStrength.textContent = `Password strength: ${labels[level]}`;
        profilePasswordStrength.dataset.strength = value ? labels[level] : "empty";
    });

    async function saveNotifications() {
        const preferences = Object.fromEntries(
            Object.entries(notificationInputs).map(([key, input]) => [key, input?.checked !== false])
        );
        await apiSaveNotificationPreferences(preferences);
    }

    Object.entries(notificationInputs).forEach(([key, input]) => {
        input?.addEventListener("change", async () => {
            const checked = input.checked;
            input.disabled = true;
            try {
                await saveNotifications();
                showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} notifications updated.`);
            } catch (error) {
                input.checked = !checked;
                showToast(error.message || "Unable to save notification preferences.", true);
            } finally {
                input.disabled = false;
            }
        });
    });

    deleteAccountBtn?.addEventListener("click", () => {
        deleteAccountForm?.reset();
        if (confirmDeleteAccount) confirmDeleteAccount.disabled = true;
        deleteAccountDialog?.showModal();
        deleteAccountPassword?.focus();
    });

    deleteAccountPhrase?.addEventListener("input", () => {
        if (confirmDeleteAccount) confirmDeleteAccount.disabled = deleteAccountPhrase.value.trim() !== "DELETE";
    });

    cancelDeleteAccount?.addEventListener("click", () => deleteAccountDialog?.close());

    deleteAccountForm?.addEventListener("submit", async event => {
        event.preventDefault();
        if (!deleteAccountPassword?.value || deleteAccountPhrase?.value.trim() !== "DELETE") return;
        if (confirmDeleteAccount) confirmDeleteAccount.disabled = true;
        deleteAccountBtn.disabled = true;
        try {
            await apiDeleteAccount(deleteAccountPassword.value);
            showToast("Account deleted successfully.");
            deleteAccountDialog?.close();
            setTimeout(() => {
                window.location.href = "homepage.html";
            }, 1200);
        } catch (error) {
            showToast(error.message || "Unable to delete your account.", true);
            deleteAccountBtn.disabled = false;
            if (confirmDeleteAccount) confirmDeleteAccount.disabled = false;
        }
    });

    avatarInput?.addEventListener("change", async () => {
        const file = avatarInput.files?.[0];
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
            showToast("Choose a JPG, PNG, or WebP image smaller than 5 MB.", true);
            avatarInput.value = "";
            return;
        }

        try {
            const source = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = () => reject(new Error("The selected image could not be opened."));
                    image.src = String(reader.result);
                };
                reader.onerror = () => reject(new Error("The selected image could not be read."));
                reader.readAsDataURL(file);
            });
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Image editing is unavailable in this browser.");
            const cropSize = Math.min(source.width, source.height);
            context.drawImage(
                source,
                (source.width - cropSize) / 2,
                (source.height - cropSize) / 2,
                cropSize,
                cropSize,
                0,
                0,
                canvas.width,
                canvas.height
            );
            const avatar = canvas.toDataURL("image/jpeg", 0.82);
            localStorage.setItem(`tripmate_avatar:${user.id}`, avatar);
            populateUserInfo();
            if (avatarUploadStatus) avatarUploadStatus.textContent = "Profile photo saved on this device.";
        } catch (error) {
            showToast(error.message || "Unable to save this profile photo.", true);
        } finally {
            avatarInput.value = "";
        }
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

    (async () => {
        try {
            user = await apiGetCurrentUser();
            populateUserInfo();
            try {
                const preferences = await apiGetNotificationPreferences();
                Object.entries(notificationInputs).forEach(([key, input]) => {
                    if (input && Object.prototype.hasOwnProperty.call(preferences, key)) {
                        input.checked = preferences[key] !== false;
                    }
                });
            } catch (error) {
                showToast(error.message || "Unable to load notification preferences.", true);
            }
        } catch (error) {
            if (error.status === 401) {
                logoutUser();
                window.location.href = "login.html?redirect=profile.html";
                return;
            }
            showToast(error.message || "Unable to load your latest account details.", true);
            const saveButtons = [accountForm, securityForm].flatMap(form =>
                form ? Array.from(form.querySelectorAll('[type="submit"]')) : []
            );
            saveButtons.forEach(button => { button.disabled = true; });
            Object.values(notificationInputs).forEach(input => { if (input) input.disabled = true; });
            if (deleteAccountBtn) deleteAccountBtn.disabled = true;
        }
    })();
})();