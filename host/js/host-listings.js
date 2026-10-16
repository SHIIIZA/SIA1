// Host Listings Wizard Logic

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('tripmate_user') || 'null');
    const session = JSON.parse(localStorage.getItem('tripmate_session') || 'null');
    if (!user || !session || !['host', 'admin'].includes(user.role || user.type)) {
        window.location.href = '../login.html?type=host&redirect=host/listings.html';
        return;
    }

    let currentStep = 1;
    const totalSteps = 7;
    const draftKey = `host_listing_draft:${user.id}`;
    let uploadedPhotos = [];
    let blockedDates = new Set();
    let draftSaveTimer;
    const previewGrid = document.getElementById('photoPreviewGrid');
    const calendarGrid = document.getElementById('hostCalendarGrid');
    const calendarMonthLabel = document.getElementById('calendarMonthLabel');
    const filterAmenities = amenities => (Array.isArray(amenities) ? amenities : [])
        .filter(amenity => !/(smoke.?alarm|first.?aid)/i.test(String(amenity)));
    
    // DOM Elements
    const steps = document.querySelectorAll('.wizard-step');
    const stepIndicators = document.querySelectorAll('.stepper-step');
    const progressBar = document.getElementById('stepperProgress');
    
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const saveExitBtn = document.getElementById('saveExitBtn');

    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            // Save current step data before moving
            saveDraft();
            currentStep++;
            updateWizardView();
        } else {
            // Final Step Action (Publish)
            publishListing();
        }
    });

    backBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            saveDraft();
            currentStep--;
            updateWizardView();
        }
    });

    saveExitBtn.addEventListener('click', () => {
        saveDraft();
        window.location.href = 'dashboard.html';
    });

    // --- Core Functions ---

    function updateWizardView() {
        // Update form sections
        steps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            }
        });

        // Update Stepper UI
        stepIndicators.forEach(indicator => {
            const stepNum = parseInt(indicator.dataset.stepIndicator);
            indicator.classList.remove('active', 'completed');
            
            if (stepNum === currentStep) {
                indicator.classList.add('active');
            } else if (stepNum < currentStep) {
                indicator.classList.add('completed');
            }
        });

        // Update Progress Bar (assuming 6 intervals between 7 steps)
        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;

        // Update Buttons
        backBtn.disabled = currentStep === 1;
        
        if (currentStep === totalSteps) {
            nextBtn.textContent = 'Publish Listing';
            // Optionally change color for final action
        } else {
            nextBtn.textContent = 'Next';
        }
    }

    function saveDraft() {
        const draft = {
            currentStep,
            hostId: user.id,
            data: {
                basics: {
                    title: document.getElementById('propertyName').value,
                    propertyType: document.getElementById('propertyType').value,
                    maxGuests: document.getElementById('guests').value,
                    bedrooms: document.getElementById('bedrooms').value,
                    bathrooms: document.getElementById('bathrooms').value,
                    location: document.getElementById('propertyAddress').value
                },
                pricing: {
                    pricePerNight: document.getElementById('basePrice').value,
                    cleaningFee: document.getElementById('cleaningFee').value,
                    securityDeposit: document.getElementById('securityDeposit').value,
                    weeklyDiscount: document.getElementById('weeklyDiscount').value
                },
                amenities: filterAmenities([...document.querySelectorAll('input[name="amenity"]:checked')].map(input => input.value)),
                rules: {
                    checkInTime: document.getElementById('checkInTime').value,
                    checkOutTime: document.getElementById('checkOutTime').value,
                    smoking: document.getElementById('ruleSmoking').checked,
                    pets: document.getElementById('rulePets').checked,
                    parties: document.getElementById('ruleParties').checked,
                    custom: document.getElementById('customRules').value
                },
                availability: {
                    minStay: document.getElementById('minStay').value,
                    maxStay: document.getElementById('maxStay').value,
                    blockedDates: [...blockedDates]
                },
                images: uploadedPhotos.map(photo => photo.dataUrl).filter(Boolean),
                publish: document.getElementById('publishToggle').checked,
                lastSaved: new Date().toISOString()
            }
        };
        try {
            localStorage.setItem(draftKey, JSON.stringify(draft));
        } catch (error) {
            console.error('Unable to save the host listing draft:', error);
            alert('The draft could not be saved in this browser. Remove a few photos or free local storage and try again.');
        }
    }

    function scheduleDraftSave() {
        clearTimeout(draftSaveTimer);
        draftSaveTimer = setTimeout(saveDraft, 300);
    }

    function renderPhotoPreviews() {
        if (!previewGrid) return;
        previewGrid.innerHTML = '';
        uploadedPhotos.forEach((photo, index) => {
            const item = document.createElement('div');
            item.className = 'photo-preview-item';
            item.innerHTML = `
                <img src="${photo.url}" alt="Property preview ${index + 1}">
                <button type="button" class="photo-delete-btn" data-index="${index}" aria-label="Remove photo ${index + 1}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="18" x2="18" y2="6"></line></svg>
                </button>
                ${index === 0 ? '<div class="cover-badge">Cover</div>' : ''}
            `;
            previewGrid.appendChild(item);
        });
        previewGrid.querySelectorAll('.photo-delete-btn').forEach(button => {
            button.addEventListener('click', event => {
                event.stopPropagation();
                uploadedPhotos.splice(Number(button.dataset.index), 1);
                renderPhotoPreviews();
                saveDraft();
            });
        });
    }

    function renderCalendar() {
        if (!calendarGrid || !calendarMonthLabel) return;
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        calendarMonthLabel.textContent = `${monthNames[month]} ${year}`;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        calendarGrid.innerHTML = '';
        for (let index = 0; index < firstDay; index++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            calendarGrid.appendChild(empty);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayElement = document.createElement('button');
            dayElement.type = 'button';
            dayElement.className = `calendar-day ${blockedDates.has(date) ? 'blocked' : 'available'}`;
            dayElement.textContent = day;
            dayElement.dataset.date = date;
            dayElement.setAttribute('aria-pressed', String(blockedDates.has(date)));
            dayElement.addEventListener('click', () => {
                if (blockedDates.has(date)) blockedDates.delete(date);
                else blockedDates.add(date);
                renderCalendar();
                saveDraft();
            });
            calendarGrid.appendChild(dayElement);
        }
    }

    function loadDraft() {
        let draft;
        try {
            draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
            const legacyDraft = JSON.parse(localStorage.getItem('host_listing_draft') || 'null');
            if (!draft && legacyDraft?.hostId != null && String(legacyDraft.hostId) === String(user.id)) {
                draft = legacyDraft;
            }
        } catch (error) {
            console.error('Unable to read the saved host listing draft:', error);
            alert('The saved listing draft could not be read.');
            return;
        }
        if (!draft?.data) return;

        const basics = draft.data.basics || {};
        const pricing = draft.data.pricing || {};
        const rules = draft.data.rules || {};
        const availability = draft.data.availability || {};
        const setValue = (id, value) => {
            if (value !== undefined && value !== null) document.getElementById(id).value = value;
        };
        setValue('propertyName', basics.title);
        setValue('propertyType', basics.propertyType);
        setValue('guests', basics.maxGuests);
        setValue('bedrooms', basics.bedrooms);
        setValue('bathrooms', basics.bathrooms);
        setValue('propertyAddress', basics.location);
        setValue('basePrice', pricing.pricePerNight);
        setValue('cleaningFee', pricing.cleaningFee);
        setValue('securityDeposit', pricing.securityDeposit);
        setValue('weeklyDiscount', pricing.weeklyDiscount);
        setValue('checkInTime', rules.checkInTime);
        setValue('checkOutTime', rules.checkOutTime);
        setValue('customRules', rules.custom);
        setValue('minStay', availability.minStay);
        setValue('maxStay', availability.maxStay);
        document.getElementById('ruleSmoking').checked = Boolean(rules.smoking);
        document.getElementById('rulePets').checked = rules.pets !== false;
        document.getElementById('ruleParties').checked = Boolean(rules.parties);
        document.getElementById('publishToggle').checked = Boolean(draft.data.publish);
        const selectedAmenities = new Set(filterAmenities(draft.data.amenities));
        document.querySelectorAll('input[name="amenity"]').forEach(input => {
            input.checked = selectedAmenities.has(input.value);
        });
        blockedDates = new Set(availability.blockedDates || []);
        uploadedPhotos = (draft.data.images || []).map(dataUrl => ({ dataUrl, url: dataUrl }));
        currentStep = Math.min(totalSteps, Math.max(1, Number(draft.currentStep) || 1));
        updatePricingPreview();
        updatePublishStatus();
        renderPhotoPreviews();
        renderCalendar();
    }

    async function publishListing() {
        saveDraft();
        const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
        const basics = draft.data?.basics || {};
        const pricing = draft.data?.pricing || {};
        if (!basics.title || !basics.location || !pricing.pricePerNight || Number(pricing.pricePerNight) <= 0) {
            alert('Complete the property name, address, and nightly price before publishing.');
            return;
        }
        const requestBody = JSON.stringify({
            title: basics.title,
            property_type: basics.propertyType || 'house',
            location: basics.location,
            price_per_night: Number(pricing.pricePerNight),
            cleaning_fee: Number(pricing.cleaningFee) || 0,
            max_guests: Number(basics.maxGuests) || 1,
            bedrooms: Number(basics.bedrooms) || 1,
            bathrooms: Number(basics.bathrooms) || 1,
            amenities: filterAmenities(draft.data.amenities),
            rules: draft.data.rules || {},
            images: uploadedPhotos.map(photo => photo.dataUrl).filter(Boolean),
            status: document.getElementById('publishToggle')?.checked ? 'published' : 'draft'
        });
        if (requestBody.length > 950000) {
            alert('This listing is too large to upload. Remove some photos and try again.');
            return;
        }
        try {
            await apiRequest('/host/listings', {
                method: 'POST',
                body: requestBody
            });
        } catch (error) {
            alert(error.message || 'Unable to save listing to Neon.');
            return;
        }
        localStorage.removeItem(draftKey);
        alert(document.getElementById('publishToggle').checked ? 'Listing published successfully.' : 'Listing saved as a draft.');
        window.location.href = 'dashboard.html';
    }

    function updatePublishStatus() {
        const isPublished = document.getElementById('publishToggle').checked;
        document.getElementById('statusLabel').textContent = isPublished ? 'Published' : 'Draft';
        document.getElementById('statusHint').textContent = isPublished
            ? 'Your listing will be visible to guests.'
            : 'Your listing will be saved privately as a draft.';
        nextBtn.textContent = currentStep === totalSteps
            ? (isPublished ? 'Publish Listing' : 'Save Draft')
            : 'Next';
    }

    async function encodePhoto(file) {
        if (typeof createImageBitmap !== 'function') {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error || new Error('Unable to read the selected photo.'));
                reader.readAsDataURL(file);
            });
        }
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
            bitmap.close();
            throw new Error('Your browser could not process the selected photo.');
        }
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(result => result ? resolve(result) : reject(new Error('Unable to process the selected photo.')), 'image/jpeg', 0.65);
        });
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Unable to read the processed photo.'));
            reader.readAsDataURL(blob);
        });
    }

    // --- Step 1: Basics UI Logic ---
    const stepperBtns = document.querySelectorAll('.stepper-btn');
    stepperBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.target;
            const input = document.getElementById(targetId);
            const isPlus = e.target.classList.contains('plus');
            
            let val = parseInt(input.value) || 0;
            const min = parseInt(input.min) || 0;
            const max = parseInt(input.max) || 100;
            
            if (isPlus && val < max) {
                val++;
            } else if (!isPlus && val > min) {
                val--;
            }
            
            input.value = val;
            
            // Sync with draft state if needed
            saveDraft();
        });
    });

    // --- Step 2: Pricing Logic ---
    const basePriceInput = document.getElementById('basePrice');
    const cleaningFeeInput = document.getElementById('cleaningFee');
    const securityDepositInput = document.getElementById('securityDeposit'); // not in total, just fee
    const weeklyDiscountInput = document.getElementById('weeklyDiscount');
    
    const previewBase = document.getElementById('previewBase');
    const previewCleaning = document.getElementById('previewCleaning');
    const previewService = document.getElementById('previewService');
    const previewTotal = document.getElementById('previewTotal');
    const previewEarn = document.getElementById('previewEarn');

    function updatePricingPreview() {
        const base = parseFloat(basePriceInput.value) || 0;
        const cleaning = parseFloat(cleaningFeeInput.value) || 0;
        
        // Mock service fee calculation (e.g., 10%)
        const service = (base + cleaning) * 0.10;
        
        const total = base + cleaning + service;
        const earn = base + cleaning; // Host earns base + cleaning (platform takes service fee from guest)

        previewBase.textContent = `₱${base.toLocaleString()}`;
        previewCleaning.textContent = `₱${cleaning.toLocaleString()}`;
        previewService.textContent = `₱${service.toLocaleString()}`;
        previewTotal.textContent = `₱${total.toLocaleString()}`;
        previewEarn.textContent = `₱${earn.toLocaleString()}`;
    }

    const priceInputs = [basePriceInput, cleaningFeeInput, securityDepositInput, weeklyDiscountInput];
    priceInputs.forEach(input => {
        if(input) {
            input.addEventListener('input', updatePricingPreview);
        }
    });

    // Initialize preview
    updatePricingPreview();

    // --- Step 3: Photos Logic ---
    const dropzone = document.getElementById('photoDropzone');
    const photoInput = document.getElementById('photoInput');
    if (dropzone && photoInput) {
        // Click to open file dialog
        dropzone.addEventListener('click', () => photoInput.click());

        // Drag and Drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });

        photoInput.addEventListener('change', function() {
            handleFiles(this.files);
        });

        async function handleFiles(files) {
            const fileArray = [...files].filter(file => file.type.startsWith('image/'));
            const spaceLeft = 20 - uploadedPhotos.length;
            const filesToProcess = fileArray.slice(0, spaceLeft);
            try {
                for (const file of filesToProcess) {
                    const dataUrl = await encodePhoto(file);
                    const currentSize = uploadedPhotos.reduce((total, photo) => total + photo.dataUrl.length, 0);
                    if (currentSize + dataUrl.length > 700000) {
                        alert('These photos exceed the safe upload size. Remove a photo or choose smaller images before adding more.');
                        break;
                    }
                    uploadedPhotos.push({ dataUrl, url: dataUrl });
                }
                renderPhotoPreviews();
                saveDraft();
            } catch (error) {
                alert(error.message || 'Unable to process the selected photos.');
            }
        }

    }

    renderCalendar();
    loadDraft();
    updateWizardView();
    updatePublishStatus();
    document.getElementById('listingForm').addEventListener('input', scheduleDraftSave);
    document.getElementById('listingForm').addEventListener('change', scheduleDraftSave);
    document.getElementById('publishToggle').addEventListener('change', () => {
        updatePublishStatus();
        saveDraft();
    });
});