// Host Listings Wizard Logic

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('tripmate_user') || 'null');
    const session = JSON.parse(localStorage.getItem('tripmate_session') || 'null');
    if (!user || !session || (user.role || user.type) !== 'host') {
        window.location.href = '../login.html?type=host&redirect=host/listings.html';
        return;
    }

    let currentStep = 1;
    const totalSteps = 7;
    
    // DOM Elements
    const steps = document.querySelectorAll('.wizard-step');
    const stepIndicators = document.querySelectorAll('.stepper-step');
    const progressBar = document.getElementById('stepperProgress');
    
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const saveExitBtn = document.getElementById('saveExitBtn');

    // 1. Load Draft from LocalStorage
    loadDraft();

    // 2. Initialize View
    updateWizardView();

    // 3. Event Listeners
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
        let draft = JSON.parse(localStorage.getItem('host_listing_draft')) || { data: {} };
        draft.currentStep = currentStep;
        draft.hostId = user.id;
        draft.data.basics = {
            title: document.getElementById('propertyName')?.value || '',
            propertyType: document.getElementById('propertyType')?.value || '',
            maxGuests: document.getElementById('guests')?.value || '1',
            bedrooms: document.getElementById('bedrooms')?.value || '1',
            bathrooms: document.getElementById('bathrooms')?.value || '1',
            location: document.getElementById('propertyAddress')?.value || ''
        };
        draft.data.pricing = {
            pricePerNight: document.getElementById('basePrice')?.value || '0',
            cleaningFee: document.getElementById('cleaningFee')?.value || '0',
            securityDeposit: document.getElementById('securityDeposit')?.value || '0',
            weeklyDiscount: document.getElementById('weeklyDiscount')?.value || '0'
        };
        draft.data.amenities = [...document.querySelectorAll('input[name="amenity"]:checked')].map(input => input.value);
        draft.data.rules = {
            checkInTime: document.getElementById('checkInTime')?.value || '14:00',
            checkOutTime: document.getElementById('checkOutTime')?.value || '11:00',
            smoking: document.getElementById('ruleSmoking')?.checked || false,
            pets: document.getElementById('rulePets')?.checked || false,
            parties: document.getElementById('ruleParties')?.checked || false,
            custom: document.getElementById('customRules')?.value || ''
        };
        draft.data.lastSaved = new Date().toISOString();
        localStorage.setItem('host_listing_draft', JSON.stringify(draft));
    }

    function loadDraft() {
        const draft = JSON.parse(localStorage.getItem('host_listing_draft'));
        if (draft && draft.currentStep) {
            // Uncomment to resume from last saved step:
            // currentStep = draft.currentStep; 
            console.log('Draft loaded:', draft);
        }
    }

    async function publishListing() {
        saveDraft();
        const draft = JSON.parse(localStorage.getItem('host_listing_draft') || '{}');
        const basics = draft.data?.basics || {};
        const pricing = draft.data?.pricing || {};
        if (!basics.title || !basics.location || !pricing.pricePerNight || Number(pricing.pricePerNight) <= 0) {
            alert('Complete the property name, address, and nightly price before publishing.');
            return;
        }
        try {
            await apiRequest('/host/listings', {
                method: 'POST',
                body: JSON.stringify({
                    title: basics.title,
                    property_type: basics.propertyType || 'house',
                    location: basics.location,
                    price_per_night: Number(pricing.pricePerNight),
                    cleaning_fee: Number(pricing.cleaningFee) || 0,
                    max_guests: Number(basics.maxGuests) || 1,
                    bedrooms: Number(basics.bedrooms) || 1,
                    bathrooms: Number(basics.bathrooms) || 1,
                    amenities: draft.data.amenities || [],
                    rules: draft.data.rules || {},
                    images: uploadedPhotos.map(photo => photo.url),
                    status: document.getElementById('publishToggle')?.checked ? 'published' : 'draft'
                })
            });
        } catch (error) {
            alert(error.message || 'Unable to save listing to Neon.');
            return;
        }
        localStorage.removeItem('host_listing_draft');
        alert('Listing saved successfully.');
        window.location.href = 'dashboard.html';
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
    const previewGrid = document.getElementById('photoPreviewGrid');
    let uploadedPhotos = [];

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

        function handleFiles(files) {
            const fileArray = [...files].filter(file => file.type.startsWith('image/'));
            
            // Limit to 20 total
            const spaceLeft = 20 - uploadedPhotos.length;
            const filesToProcess = fileArray.slice(0, spaceLeft);

            filesToProcess.forEach(file => {
                const objectUrl = URL.createObjectURL(file);
                uploadedPhotos.push({ file, url: objectUrl });
            });

            renderPhotoPreviews();
            saveDraft();
        }

        function renderPhotoPreviews() {
            previewGrid.innerHTML = '';
            
            uploadedPhotos.forEach((photo, index) => {
                const item = document.createElement('div');
                item.className = 'photo-preview-item';
                
                let coverBadge = '';
                if (index === 0) {
                    coverBadge = `<div class="cover-badge">Cover</div>`;
                }

                item.innerHTML = `
                    <img src="${photo.url}" alt="Property Preview">
                    <button type="button" class="photo-delete-btn" data-index="${index}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    ${coverBadge}
                `;
                previewGrid.appendChild(item);
            });

            // Bind delete buttons
            document.querySelectorAll('.photo-delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.dataset.index);
                    const photo = uploadedPhotos[index];
                    URL.revokeObjectURL(photo.url); // Clean up memory
                    uploadedPhotos.splice(index, 1);
                    renderPhotoPreviews();
                    saveDraft();
                });
            });
        }
    }

    // --- Step 6: Calendar Logic ---
    const calendarGrid = document.getElementById('hostCalendarGrid');
    const calendarMonthLabel = document.getElementById('calendarMonthLabel');
    
    if (calendarGrid && calendarMonthLabel) {
        renderCalendar();

        function renderCalendar() {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            calendarMonthLabel.textContent = `${monthNames[month]} ${year}`;

            // Get first day of month (0 = Sun, 1 = Mon...)
            const firstDay = new Date(year, month, 1).getDay();
            // Get number of days in month
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            calendarGrid.innerHTML = '';

            // Empty slots before 1st of month
            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                empty.className = 'calendar-day empty';
                calendarGrid.appendChild(empty);
            }

            // Days of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayEl = document.createElement('div');
                // Randomly block some days for preview purposes, or default to available
                const isBlocked = (day === 14 || day === 15 || day === 20); 
                dayEl.className = `calendar-day ${isBlocked ? 'blocked' : 'available'}`;
                dayEl.textContent = day;
                dayEl.dataset.date = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                
                dayEl.addEventListener('click', function() {
                    if (this.classList.contains('available')) {
                        this.classList.remove('available');
                        this.classList.add('blocked');
                    } else {
                        this.classList.remove('blocked');
                        this.classList.add('available');
                    }
                    saveDraft();
                });

                calendarGrid.appendChild(dayEl);
            }
        }
    }
});