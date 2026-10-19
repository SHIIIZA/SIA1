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
    const allowedAmenities = ['Wifi', 'Pool', 'Kitchen', 'Air conditioning', 'Beachfront', 'Pet friendly'];
    const normalizeAmenity = amenity => {
        const value = String(amenity || '').trim().toLowerCase();
        return allowedAmenities.find(item => item.toLowerCase() === value) || null;
    };
    const filterAmenities = amenities => [...new Set(
        (Array.isArray(amenities) ? amenities : []).map(normalizeAmenity).filter(Boolean)
    )];
    const normalizePropertyType = value => {
        const normalized = String(value || '').trim().toLowerCase();
        if (normalized === 'house' || normalized.includes('house')) return 'house';
        if (normalized === 'apartment' || normalized.includes('condo') || normalized.includes('apartment')) return 'apartment';
        if (normalized === 'hotel' || normalized.includes('hotel')) return 'hotel';
        if (normalized === 'guesthouse' || normalized.includes('guest house')) return 'guesthouse';
        return '';
    };
    
    // DOM Elements
    const steps = document.querySelectorAll('.wizard-step');
    const stepIndicators = document.querySelectorAll('.stepper-step');
    const progressBar = document.getElementById('stepperProgress');
    
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const saveExitBtn = document.getElementById('saveExitBtn');

    nextBtn.addEventListener('click', () => {
        if (currentStep < totalSteps) {
            if (!validateStep(currentStep)) return;
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
        if (currentStep === totalSteps) updateReviewSummary();
    }

    function showStepError(message) {
        let error = document.getElementById('wizardError');
        if (!error) {
            error = document.createElement('p');
            error.id = 'wizardError';
            error.className = 'wizard-error';
            document.querySelector('.wizard-footer-inner').prepend(error);
        }
        error.textContent = message;
        error.focus?.();
    }

    function clearStepError() {
        document.getElementById('wizardError')?.remove();
    }

    function validateStep(step) {
        clearStepError();
        if (step === 1) {
            const name = document.getElementById('propertyName').value.trim();
            const type = document.getElementById('propertyType').value;
            const address = document.getElementById('propertyAddress').value.trim();
            if (!name) {
                showStepError('Add a property name before continuing.');
                document.getElementById('propertyName').focus();
                return false;
            }
            if (!type) {
                showStepError('Choose a property type before continuing.');
                document.getElementById('propertyType').focus();
                return false;
            }
            if (address.length < 5) {
                showStepError('Enter a complete location or address before continuing.');
                document.getElementById('propertyAddress').focus();
                return false;
            }
            if (Number(document.getElementById('guests').value) < 1) {
                showStepError('Set the maximum number of guests to at least 1.');
                return false;
            }
        }
        if (step === 2 && Number(document.getElementById('basePrice').value) <= 0) {
            showStepError('Enter a nightly price greater than ₱0 before continuing.');
            document.getElementById('basePrice').focus();
            return false;
        }
        if (step === 7) {
            return validateStep(1) && validateStep(2);
        }
        return true;
    }

    function updateReviewSummary() {
        const summary = document.getElementById('reviewSummary');
        if (!summary) return;
        const name = document.getElementById('propertyName').value.trim() || 'Untitled property';
        const type = document.getElementById('propertyType').selectedOptions[0]?.textContent || 'Property';
        const address = document.getElementById('propertyAddress').value.trim() || 'Address not added';
        const price = Number(document.getElementById('basePrice').value) || 0;
        const guests = Number(document.getElementById('guests').value) || 0;
        const amenities = filterAmenities([...document.querySelectorAll('input[name="amenity"]:checked')].map(input => input.value));
        summary.innerHTML = `
            <div class="review-summary-heading">
                <span>Listing summary</span>
                <strong>${name.replace(/[<>&"']/g, '')}</strong>
            </div>
            <dl class="review-summary-list">
                <div><dt>Type</dt><dd>${type}</dd></div>
                <div><dt>Location</dt><dd>${address.replace(/[<>&"']/g, '')}</dd></div>
                <div><dt>Nightly price</dt><dd>₱${price.toLocaleString()}</dd></div>
                <div><dt>Capacity</dt><dd>${guests} guest${guests === 1 ? '' : 's'}</dd></div>
                <div><dt>Amenities</dt><dd>${amenities.length ? amenities.join(', ') : 'None selected'}</dd></div>
                <div><dt>Photos</dt><dd>${uploadedPhotos.length} photo${uploadedPhotos.length === 1 ? '' : 's'}${uploadedPhotos.length ? ' · first photo is the cover' : ''}</dd></div>
            </dl>
        `;
    }

    function saveDraft() {
        let previousData = {};
        try {
            previousData = JSON.parse(localStorage.getItem(draftKey) || 'null')?.data || {};
        } catch (error) {
            console.error('Unable to preserve the saved listing identity:', error);
        }
        const draft = {
            currentStep,
            hostId: user.id,
            data: {
                listingId: previousData.listingId,
                createdAt: previousData.createdAt,
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
                    custom: document.getElementById('customRules').value
                },
                availability: {
                    minStay: document.getElementById('minStay').value,
                    maxStay: document.getElementById('maxStay').value,
                    blockedDates: [...blockedDates]
                },
                images: uploadedPhotos.map(photo => photo.dataUrl).filter(Boolean),
                publish: true,
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
            const editId = new URLSearchParams(window.location.search).get('edit');
            const savedListings = JSON.parse(localStorage.getItem('tripmate_listings') || '[]');
            const existingListing = Array.isArray(savedListings)
                ? savedListings.find(item => String(item.id) === String(editId) && String(item.hostId) === String(user.id))
                : null;
            if (existingListing) {
                draft = {
                    currentStep: 1,
                    hostId: user.id,
                    data: {
                        listingId: String(existingListing.id),
                        createdAt: existingListing.createdAt,
                        basics: {
                            title: existingListing.title,
                            propertyType: normalizePropertyType(existingListing.propertyType),
                            maxGuests: existingListing.maxGuests,
                            bedrooms: existingListing.bedrooms,
                            bathrooms: existingListing.bathrooms,
                            location: existingListing.location || existingListing.address
                        },
                        pricing: {
                            pricePerNight: existingListing.pricePerNight,
                            cleaningFee: existingListing.cleaningFee,
                            securityDeposit: existingListing.securityDeposit,
                            weeklyDiscount: existingListing.weeklyDiscount
                        },
                        amenities: filterAmenities(existingListing.amenities),
                        rules: existingListing.rules || {},
                        availability: existingListing.availability || {},
                        images: Array.isArray(existingListing.images) ? existingListing.images : []
                    }
                };
            }
            if (!draft) draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
            const legacyDraft = JSON.parse(localStorage.getItem('host_listing_draft') || 'null');
            if (!draft && legacyDraft?.hostId != null && String(legacyDraft.hostId) === String(user.id)) {
                draft = legacyDraft;
            }
            if (draft?.data?.listingId && new URLSearchParams(window.location.search).get('edit')) {
                localStorage.setItem(draftKey, JSON.stringify(draft));
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
        setValue('propertyType', normalizePropertyType(basics.propertyType));
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
        const selectedAmenities = new Set(filterAmenities(draft.data.amenities));
        document.querySelectorAll('input[name="amenity"]').forEach(input => {
            input.checked = selectedAmenities.has(input.value);
        });
        blockedDates = new Set(availability.blockedDates || []);
        uploadedPhotos = (draft.data.images || []).map(dataUrl => ({ dataUrl, url: dataUrl }));
        currentStep = Math.min(totalSteps, Math.max(1, Number(draft.currentStep) || 1));
        updatePricingPreview();
        renderPhotoPreviews();
        renderCalendar();
    }

    async function publishListing() {
        if (!validateStep(1) || !validateStep(2)) return;
        saveDraft();
        const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
        const basics = draft.data?.basics || {};
        const pricing = draft.data?.pricing || {};
        const listingId = draft.data?.listingId || `host-${user.id}-${Date.now()}`;
        const isEditing = Boolean(draft.data?.listingId);
        const images = uploadedPhotos.map(photo => photo.dataUrl).filter(Boolean);
        const localListing = {
            id: String(listingId),
            title: basics.title,
            propertyType: basics.propertyType || 'house',
            location: basics.location,
            address: basics.location,
            pricePerNight: Number(pricing.pricePerNight),
            cleaningFee: Number(pricing.cleaningFee) || 0,
            securityDeposit: Number(pricing.securityDeposit) || 0,
            weeklyDiscount: Number(pricing.weeklyDiscount) || 0,
            maxGuests: Number(basics.maxGuests) || 1,
            bedrooms: Number(basics.bedrooms) || 0,
            bathrooms: Number(basics.bathrooms) || 0,
            amenities: filterAmenities(draft.data.amenities),
            rules: draft.data.rules || {},
            availability: draft.data.availability || {},
            images,
            rating: 5,
            reviews: 0,
            reviewCount: 0,
            hostId: String(user.id),
            hostUsername: String(user.username || user.name || '').trim(),
            hostName: String(user.name || user.username || 'Host').trim(),
            hostAvatar: String(user.avatar || user.profilePicture || '').trim(),
            status: 'published',
            createdAt: draft.data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const requestBody = JSON.stringify({
            title: localListing.title,
            property_type: localListing.propertyType,
            location: localListing.location,
            price_per_night: localListing.pricePerNight,
            cleaning_fee: localListing.cleaningFee,
            max_guests: localListing.maxGuests,
            bedrooms: localListing.bedrooms,
            bathrooms: localListing.bathrooms,
            amenities: localListing.amenities,
            rules: localListing.rules,
            images: localListing.images,
            status: 'published'
        });
        if (requestBody.length > 950000) {
            alert('This listing is too large to upload. Remove some photos and try again.');
            return;
        }
        let listings = [];
        try {
            listings = JSON.parse(localStorage.getItem('tripmate_listings') || '[]');
            if (!Array.isArray(listings)) listings = [];
        } catch (error) {
            console.error('Unable to read local listings:', error);
        }
        const existingIndex = listings.findIndex(item => String(item.id) === localListing.id);
        if (existingIndex >= 0) listings[existingIndex] = localListing;
        else listings.push(localListing);
        try {
            localStorage.setItem('tripmate_listings', JSON.stringify(listings));
        } catch (error) {
            console.error('Unable to save the published listing locally:', error);
            alert('The listing could not be saved in this browser. Remove a few photos or free local storage and try again.');
            return;
        }
        localStorage.removeItem(draftKey);
        if (!isEditing) {
            try {
                await apiRequest('/host/listings', {
                    method: 'POST',
                    body: requestBody
                });
            } catch (error) {
                console.warn('Optional listing sync failed:', error.message);
            }
        }
        alert(isEditing
            ? 'Listing changes saved in this browser.'
            : 'Listing published successfully. It is now visible on the Stays page.');
        window.location.href = 'dashboard.html';
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
    updateReviewSummary();
    document.getElementById('listingForm').addEventListener('input', scheduleDraftSave);
    document.getElementById('listingForm').addEventListener('change', scheduleDraftSave);
});