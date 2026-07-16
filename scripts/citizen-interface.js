/* BachesLoja - Citizen Interface Logic */

window.CitizenInterface = {
    // Current photo data
    currentPhoto: null,
    currentLocation: null,
    _locationPickerMap: null,
    _locationPickerMarker: null,
    _locationPickerInitialized: false,
    
    // Initialize citizen interface
    init() {
        console.log('Initializing Citizen Interface...');
        this.setupEventListeners();
        this.setupGeolocation();
        
        // Setup mobile gestures if on mobile device
        if (window.innerWidth <= 768) {
            this.setupTouchGestures();
        }
    },

    // Setup all event listeners
    setupEventListeners() {
        // Form submission
        const reportForm = document.getElementById('report-form');
        if (reportForm) {
            reportForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Photo upload
        const photoInput = document.getElementById('photo-upload');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }

        // Geolocation button
        const locationBtn = document.getElementById('use-location-btn');
        if (locationBtn) {
            locationBtn.addEventListener('click', () => this.getCurrentLocation());
        }

        // Location picker toggle button
        const toggleMapBtn = document.getElementById('toggle-location-map-btn');
        if (toggleMapBtn) {
            toggleMapBtn.addEventListener('click', () => this.toggleLocationPicker());
        }

        // Form validation on input
        this.setupRealTimeValidation();

        // Classification result close button
        document.addEventListener('click', (e) => {
            if (e.target.matches('.result-close-btn, .result-close-btn *')) {
                this.hideClassificationResult();
            }
        });
    },

    // Setup real-time form validation
    setupRealTimeValidation() {
        const inputs = ['description', 'neighborhood'];
        
        inputs.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldName));
                field.addEventListener('input', () => this.clearFieldError(fieldName));
            }
        });

        // Road type radio validation
        const roadTypeInputs = document.querySelectorAll('input[name="roadType"]');
        roadTypeInputs.forEach(input => {
            input.addEventListener('change', () => this.clearFieldError('roadtype'));
        });
    },

    // Setup geolocation functionality
    setupGeolocation() {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported');
            const locationBtn = document.getElementById('use-location-btn');
            if (locationBtn) {
                locationBtn.style.display = 'none';
            }
        }
    },

    // Handle form submission
    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            // Validate form
            if (!this.validateForm()) {
                return;
            }

            // Show loading state
            this.setFormLoading(true);

            // Collect form data
            const formData = this.collectFormData();
            
            // Classify with AI
            const classification = await this.classifyReport(formData);
            
            // Create complete report
            const report = {
                ...formData,
                ...classification,
                photo: this.currentPhoto ? this.currentPhoto.dataUrl : null,
                location: this.currentLocation
            };

            // Upload photo to Supabase Storage before creating the report
            if (this.currentPhoto && !window.BachesLoja.state.isOffline) {
                try {
                    const photoUrl = await window.SupabaseDB.uploadPhoto(this.currentPhoto.file);
                    report.photo = photoUrl;
                } catch (uploadError) {
                    console.warn('Photo upload failed, continuing without remote photo URL', uploadError);
                    // Keep local dataUrl as fallback so the preview still works
                    report.photo = this.currentPhoto.dataUrl;
                }
            }

            // Add to state (and persist to Supabase)
            const addedReport = await window.BachesLoja.addReport(report);
            
            if (addedReport) {
                // Show classification result
                this.showClassificationResult(classification);
                
                // Reset form
                this.resetForm();
                
                // Update reports display
                this.updateMyReportsDisplay();
                
                // Show success message
                this.showToast('Reporte enviado exitosamente', 'success');
                
                console.log('Report submitted successfully:', addedReport.id);
            } else {
                throw new Error('Failed to add report to system');
            }

        } catch (error) {
            console.error('Form submission error:', error);
            this.showToast('Error al enviar el reporte. Intenta nuevamente.', 'error');
        } finally {
            this.setFormLoading(false);
        }
    },

    // Collect form data
    collectFormData() {
        const form = document.getElementById('report-form');
        const formData = new FormData(form);
        
        return {
            description: formData.get('description').trim(),
            neighborhood: formData.get('neighborhood'),
            roadType: formData.get('roadType')
        };
    },

    // Classify report using AI
    async classifyReport(reportData) {
        return new Promise((resolve) => {
            // Simulate AI processing delay
            setTimeout(() => {
                const classification = window.BachesLojaAI.classifyReport({
                    ...reportData,
                    photo: !!this.currentPhoto
                });
                resolve(classification);
            }, 1500);
        });
    },

    // Validate entire form
    validateForm() {
        let isValid = true;
        
        // Validate description
        if (!this.validateField('description')) isValid = false;
        
        // Validate neighborhood
        if (!this.validateField('neighborhood')) isValid = false;
        
        // Validate road type
        if (!this.validateField('roadtype')) isValid = false;
        
        return isValid;
    },

    // Validate individual field
    validateField(fieldName) {
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'description':
                const description = document.getElementById('description').value.trim();
                if (!description) {
                    errorMessage = 'La descripción es requerida';
                    isValid = false;
                } else if (description.length < 10) {
                    errorMessage = 'La descripción debe tener al menos 10 caracteres';
                    isValid = false;
                } else if (description.length > 500) {
                    errorMessage = 'La descripción no puede exceder 500 caracteres';
                    isValid = false;
                }
                break;

            case 'neighborhood':
                const neighborhood = document.getElementById('neighborhood').value;
                if (!neighborhood) {
                    errorMessage = 'Selecciona tu barrio';
                    isValid = false;
                }
                break;

            case 'roadtype':
                const roadType = document.querySelector('input[name="roadType"]:checked');
                if (!roadType) {
                    errorMessage = 'Selecciona el tipo de vía';
                    isValid = false;
                }
                break;
        }

        // Show/hide error
        if (!isValid) {
            this.showFieldError(fieldName, errorMessage);
        } else {
            this.clearFieldError(fieldName);
        }

        return isValid;
    },

    // Show field error
    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        // Add error class to field
        const field = document.getElementById(fieldName) || 
                     document.querySelector(`input[name="${fieldName}"]`);
        if (field) {
            field.classList.add('error');
        }
    },

    // Clear field error
    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        // Remove error class
        const field = document.getElementById(fieldName) || 
                     document.querySelector(`input[name="${fieldName}"]`);
        if (field) {
            field.classList.remove('error');
        }

        // For radio buttons, clear all error classes
        if (fieldName === 'roadtype') {
            document.querySelectorAll('input[name="roadType"]').forEach(radio => {
                radio.classList.remove('error');
            });
        }
    },

    // Handle photo upload
    handlePhotoUpload(e) {
        const file = e.target.files[0];
        
        if (!file) {
            this.clearPhoto();
            return;
        }

        // Validate file
        const validation = this.validatePhoto(file);
        if (!validation.valid) {
            this.showFieldError('photo', validation.error);
            e.target.value = '';
            return;
        }

        this.clearFieldError('photo');

        // Process photo
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentPhoto = {
                file: file,
                dataUrl: e.target.result,
                name: file.name,
                size: file.size,
                type: file.type
            };
            
            this.showPhotoPreview();
        };
        
        reader.onerror = () => {
            this.showFieldError('photo', 'Error al leer el archivo');
        };
        
        reader.readAsDataURL(file);
    },

    // Validate photo file
    validatePhoto(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'El archivo es muy grande. Máximo 10MB.'
            };
        }

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Formato no válido. Solo JPEG y PNG.'
            };
        }

        return { valid: true };
    },

    // Show photo preview
    showPhotoPreview() {
        const previewContainer = document.getElementById('photo-preview');
        if (!previewContainer || !this.currentPhoto) return;

        previewContainer.innerHTML = `
            <div class="photo-preview-content">
                <img src="${this.currentPhoto.dataUrl}" alt="Vista previa" class="preview-image">
                <div class="photo-info">
                    <span class="photo-name">${this.currentPhoto.name}</span>
                    <span class="photo-size">${this.formatFileSize(this.currentPhoto.size)}</span>
                </div>
                <button type="button" class="remove-photo-btn" onclick="CitizenInterface.clearPhoto()">
                    <span aria-hidden="true">✕</span>
                    <span class="sr-only">Eliminar foto</span>
                </button>
            </div>
        `;
        
        previewContainer.setAttribute('aria-hidden', 'false');
        previewContainer.style.display = 'block';
    },

    // Clear photo
    clearPhoto() {
        this.currentPhoto = null;
        
        const photoInput = document.getElementById('photo-upload');
        if (photoInput) {
            photoInput.value = '';
        }

        const previewContainer = document.getElementById('photo-preview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.setAttribute('aria-hidden', 'true');
            previewContainer.style.display = 'none';
        }
    },

    // Format file size for display
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Toggle mini location picker map visibility
    toggleLocationPicker() {
        const mapDiv = document.getElementById('location-picker-map');
        const hint = document.getElementById('location-picker-hint');
        if (!mapDiv) return;

        const isVisible = mapDiv.style.display !== 'none';
        mapDiv.style.display = isVisible ? 'none' : 'block';
        if (hint) hint.style.display = isVisible ? 'none' : 'block';

        const btn = document.getElementById('toggle-location-map-btn');
        if (btn) {
            btn.innerHTML = isVisible
                ? '<span class="btn-icon" aria-hidden="true">🗺️</span> Seleccionar en mapa'
                : '<span class="btn-icon" aria-hidden="true">✕</span> Cerrar mapa';
        }

        if (!isVisible) {
            // Initialize map on first open, or just invalidate size
            if (!this._locationPickerInitialized) {
                this._initLocationPickerMap();
            } else if (this._locationPickerMap) {
                setTimeout(() => this._locationPickerMap.invalidateSize(), 100);
            }
        }
    },

    // Initialize the mini location picker map
    _initLocationPickerMap() {
        const center = this.currentLocation
            ? [this.currentLocation.lat, this.currentLocation.lng]
            : [-3.9931, -79.2042];

        this._locationPickerMap = L.map('location-picker-map', {
            center: center,
            zoom: 15,
            zoomControl: true,
            attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this._locationPickerMap);

        // If we already have a location (from geolocation), place a draggable marker
        if (this.currentLocation) {
            this._placeLocationMarker(this.currentLocation.lat, this.currentLocation.lng);
        }

        // Click on map → place/move marker
        this._locationPickerMap.on('click', (e) => {
            this._placeLocationMarker(e.latlng.lat, e.latlng.lng);
        });

        this._locationPickerInitialized = true;
        setTimeout(() => this._locationPickerMap.invalidateSize(), 150);
    },

    // Place or move the draggable marker on the location picker map
    _placeLocationMarker(lat, lng) {
        // Remove existing marker if present
        if (this._locationPickerMarker) {
            this._locationPickerMap.removeLayer(this._locationPickerMarker);
        }

        this._locationPickerMarker = L.marker([lat, lng], { draggable: true })
            .addTo(this._locationPickerMap)
            .bindPopup('📍 Ubicación del bache')
            .openPopup();

        // Update currentLocation when marker is dragged
        this._locationPickerMarker.on('dragend', (e) => {
            const pos = e.target.getLatLng();
            this.currentLocation = { lat: pos.lat, lng: pos.lng };
            this.matchNeighborhood(this.currentLocation);
        });

        // Set location immediately
        this.currentLocation = { lat, lng };
        this.matchNeighborhood(this.currentLocation);
    },

    // Get current location
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showToast('Geolocalización no disponible', 'warning');
            return;
        }

        const locationBtn = document.getElementById('use-location-btn');
        if (locationBtn) {
            locationBtn.disabled = true;
            locationBtn.innerHTML = '<span class="btn-icon">📍</span>Obteniendo ubicación...';
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                // Try to match neighborhood based on coordinates
                this.matchNeighborhood(this.currentLocation);

                // Update the location picker mini-map if it's open
                if (this._locationPickerInitialized && this._locationPickerMap) {
                    this._locationPickerMap.setView([position.coords.latitude, position.coords.longitude], 16);
                    this._placeLocationMarker(position.coords.latitude, position.coords.longitude);
                }
                
                this.showToast('Ubicación obtenida', 'success');
                this.resetLocationButton(true);
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showToast('No se pudo obtener la ubicación', 'error');
                this.resetLocationButton(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    },

    // Reset location button state
    resetLocationButton(success) {
        const locationBtn = document.getElementById('use-location-btn');
        if (locationBtn) {
            locationBtn.disabled = false;
            if (success) {
                locationBtn.innerHTML = '<span class="btn-icon">✓</span>Ubicación obtenida';
                locationBtn.classList.add('success');
            } else {
                locationBtn.innerHTML = '<span class="btn-icon">📍</span>Usar mi ubicación';
                locationBtn.classList.remove('success');
            }
        }
    },

    // Match neighborhood based on coordinates (Haversine distance to each centroid)
    // Covers all 10 Loja neighborhoods configured in app.js
    matchNeighborhood(location) {
        const neighborhoods = {
            'Centro Histórico': { lat: -3.9939, lng: -79.2042 },
            'Sucre':            { lat: -3.9955, lng: -79.2055 },
            'El Valle':         { lat: -3.9985, lng: -79.2078 },
            'San Sebastián':    { lat: -3.9912, lng: -79.2015 },
            'Punzara':          { lat: -4.0012, lng: -79.2089 },
            'Zamora Huayco':    { lat: -3.9892, lng: -79.1995 },
            'Carigán':          { lat: -3.9860, lng: -79.2110 },
            'Yahuarcuna':       { lat: -3.9830, lng: -79.2065 },
            'La Argelia':       { lat: -4.0050, lng: -79.1980 },
            'San Cayetano':     { lat: -3.9920, lng: -79.1960 }
        };

        let closestNeighborhood = '';
        let closestDistance = Infinity;

        for (const [name, coords] of Object.entries(neighborhoods)) {
            const distance = this.calculateDistance(
                location.lat, location.lng,
                coords.lat, coords.lng
            );
            if (distance < closestDistance) {
                closestDistance = distance;
                closestNeighborhood = name;
            }
        }

        // Auto-select if within ~2 km of the closest centroid
        if (closestDistance < 2) {
            const neighborhoodSelect = document.getElementById('neighborhood');
            if (neighborhoodSelect && neighborhoodSelect.value !== closestNeighborhood) {
                neighborhoodSelect.value = closestNeighborhood;
                this.showToast(`Barrio detectado: ${closestNeighborhood}`, 'info');
            }
        }
    },

    // Calculate distance between two points (Haversine formula)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    // Set form loading state
    setFormLoading(isLoading) {
        const submitBtn = document.getElementById('submit-report-btn');
        const coneLoader = document.getElementById('ai-cone-loader');
        const form = document.getElementById('report-form');

        if (submitBtn) {
            submitBtn.disabled = isLoading;
            
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoader = submitBtn.querySelector('.btn-loader');
            
            if (isLoading) {
                if (btnText) btnText.textContent = 'Clasificando con IA...';
                if (btnLoader) btnLoader.style.display = 'inline-block';
                submitBtn.classList.add('loading');
            } else {
                if (btnText) btnText.textContent = 'Enviar Reporte';
                if (btnLoader) btnLoader.style.display = 'none';
                submitBtn.classList.remove('loading');
            }
        }

        // Show or hide the traffic-cone AI loader (Req 11.2, 11.6)
        if (coneLoader) {
            if (isLoading) {
                coneLoader.classList.add('active');
            } else {
                coneLoader.classList.remove('active');
            }
        }

        // Disable form inputs during loading
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, select, button');
            inputs.forEach(input => {
                if (input !== submitBtn) {
                    input.disabled = isLoading;
                }
            });
        }
    },

    // Show classification result
    showClassificationResult(classification) {
        const resultContainer = document.getElementById('classification-result');
        if (!resultContainer) return;

        const priorityIndicator = resultContainer.querySelector('.priority-indicator');
        const priorityTriangle = resultContainer.querySelector('.priority-triangle');
        const priorityText = resultContainer.querySelector('.priority-text');
        const resultSummary = resultContainer.querySelector('.result-summary');
        const reasoningList = resultContainer.querySelector('.reasoning-list');

        // Update priority indicator
        if (priorityTriangle) {
            priorityTriangle.className = `priority-triangle ${classification.priority.toLowerCase()}`;
        }
        
        if (priorityText) {
            priorityText.textContent = `Prioridad: ${classification.priority}`;
        }

        if (priorityIndicator) {
            priorityIndicator.className = `priority-indicator ${classification.priority.toLowerCase()}`;
        }

        // Update summary
        if (resultSummary) {
            resultSummary.textContent = `Tu reporte ha sido clasificado como prioridad ${classification.priority} con un puntaje de ${classification.priorityScore}. Nivel de confianza: ${Math.round(classification.confidence * 100)}%.`;
        }

        // Update reasoning list
        if (reasoningList) {
            reasoningList.innerHTML = classification.reasoning
                .map(reason => `<li>${reason}</li>`)
                .join('');
        }

        // Show result
        resultContainer.setAttribute('aria-hidden', 'false');
        resultContainer.style.display = 'block';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideClassificationResult();
        }, 10000);
    },

    // Hide classification result
    hideClassificationResult() {
        const resultContainer = document.getElementById('classification-result');
        if (resultContainer) {
            resultContainer.setAttribute('aria-hidden', 'true');
            resultContainer.style.display = 'none';
        }
    },

    // Reset form after successful submission
    resetForm() {
        const form = document.getElementById('report-form');
        if (form) {
            form.reset();
        }

        // Clear photo
        this.clearPhoto();
        
        // Clear location
        this.currentLocation = null;
        this.resetLocationButton(false);

        // Reset location picker
        if (this._locationPickerMarker && this._locationPickerMap) {
            this._locationPickerMap.removeLayer(this._locationPickerMarker);
            this._locationPickerMarker = null;
        }
        // Hide location picker map
        const mapDiv = document.getElementById('location-picker-map');
        const hint = document.getElementById('location-picker-hint');
        if (mapDiv) mapDiv.style.display = 'none';
        if (hint) hint.style.display = 'none';
        const toggleBtn = document.getElementById('toggle-location-map-btn');
        if (toggleBtn) toggleBtn.innerHTML = '<span class="btn-icon" aria-hidden="true">🗺️</span> Seleccionar en mapa';

        // Clear all error states
        ['description', 'neighborhood', 'roadtype', 'photo'].forEach(field => {
            this.clearFieldError(field);
        });
    },

    // Update "My Reports" display
    updateMyReportsDisplay() {
        const userReports = window.BachesLoja.getCurrentUserReports();
        const reportsList = document.getElementById('my-reports-list');
        const reportsSummary = document.getElementById('reports-summary');

        // Update summary
        if (reportsSummary) {
            const pending = userReports.filter(r => r.status === 'Pendiente').length;
            const inProgress = userReports.filter(r => r.status === 'En proceso').length;
            const resolved = userReports.filter(r => r.status === 'Resuelto').length;
            
            reportsSummary.innerHTML = `
                <span class="summary-item">
                    <span class="summary-number">${userReports.length}</span>
                    <span class="summary-label">Total</span>
                </span>
                <span class="summary-item">
                    <span class="summary-number">${pending}</span>
                    <span class="summary-label">Pendientes</span>
                </span>
                <span class="summary-item">
                    <span class="summary-number">${inProgress}</span>
                    <span class="summary-label">En Proceso</span>
                </span>
                <span class="summary-item">
                    <span class="summary-number">${resolved}</span>
                    <span class="summary-label">Resueltos</span>
                </span>
            `;
        }

        // Update reports list
        if (reportsList) {
            if (userReports.length === 0) {
                reportsList.innerHTML = `
                    <div class="citizen-empty-state" aria-label="Sin reportes">
                        <!-- Pothole illustration SVG (Task 39) -->
                        <div class="citizen-empty-icon" aria-hidden="true">
                            <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" width="110" height="82">
                                <!-- Road surface -->
                                <rect x="0" y="28" width="120" height="52" rx="4" fill="#1C1F26"/>
                                <!-- Road texture lines -->
                                <line x1="0" y1="40" x2="120" y2="40" stroke="#22262F" stroke-width="1" opacity="0.6"/>
                                <line x1="0" y1="70" x2="120" y2="70" stroke="#22262F" stroke-width="1" opacity="0.6"/>
                                <!-- Lane dash left -->
                                <rect x="8"  y="52" width="20" height="4" rx="1" fill="#F2B705" opacity="0.7"/>
                                <!-- Lane dash right -->
                                <rect x="92" y="52" width="20" height="4" rx="1" fill="#F2B705" opacity="0.7"/>
                                <!-- Pothole shadow -->
                                <ellipse cx="60" cy="57" rx="20" ry="9" fill="#0A0C10" opacity="0.7"/>
                                <!-- Pothole shape -->
                                <path d="M42,52 Q46,43 58,45 Q65,41 72,45 Q80,42 84,50 Q87,57 82,64 Q76,70 65,68 Q55,71 46,67 Q38,62 42,52 Z"
                                      fill="#0D0F13" stroke="#F2B705" stroke-width="2"/>
                                <!-- Pothole inner depth -->
                                <ellipse cx="63" cy="56" rx="13" ry="7" fill="#070809"/>
                                <!-- Crack lines -->
                                <line x1="60" y1="44" x2="56" y2="36" stroke="#F2B705" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
                                <line x1="72" y1="47" x2="80" y2="40" stroke="#F2B705" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
                                <line x1="83" y1="57" x2="92" y2="53" stroke="#F2B705" stroke-width="1" opacity="0.4" stroke-linecap="round"/>
                                <!-- Small traffic cone left -->
                                <polygon points="20,28 14,46 26,46" fill="#E8590C"/>
                                <rect x="12" y="46" width="16" height="4" rx="1" fill="#E8590C"/>
                                <line x1="13" y1="39" x2="27" y2="39" stroke="white" stroke-width="1.5" opacity="0.8"/>
                                <!-- Small traffic cone right -->
                                <polygon points="100,28 94,46 106,46" fill="#E8590C"/>
                                <rect x="92" y="46" width="16" height="4" rx="1" fill="#E8590C"/>
                                <line x1="93" y1="39" x2="107" y2="39" stroke="white" stroke-width="1.5" opacity="0.8"/>
                            </svg>
                        </div>
                        <h4>Aún no has reportado ningún bache 👀</h4>
                        <p>¡Sé el primero en tu barrio! Cada reporte ayuda a que Loja tenga mejores vías.</p>
                        <button class="citizen-empty-cta"
                                onclick="document.getElementById('report-form').scrollIntoView({ behavior: 'smooth', block: 'start' }); document.getElementById('description').focus();"
                                aria-label="Ir al formulario para reportar un bache">
                            📋 Reportar un bache
                        </button>
                    </div>
                `;
            } else {
                // Add filter and sort controls
                const controlsHtml = this.createReportsControls();
                const reportsHtml = this.getFilteredUserReports()
                    .map(report => this.createReportCard(report))
                    .join('');
                
                reportsList.innerHTML = `
                    ${controlsHtml}
                    <div class="reports-grid">
                        ${reportsHtml}
                    </div>
                `;
            }
        }
    },

    // Create reports controls (filter and sort)
    createReportsControls() {
        return `
            <div class="reports-controls">
                <div class="control-group">
                    <label for="user-reports-filter" class="control-label">Filtrar por estado:</label>
                    <select id="user-reports-filter" class="control-select" onchange="CitizenInterface.filterUserReports(this.value)">
                        <option value="">Todos los estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="En proceso">En proceso</option>
                        <option value="Resuelto">Resuelto</option>
                    </select>
                </div>
                
                <div class="control-group">
                    <label for="user-reports-sort" class="control-label">Ordenar por:</label>
                    <select id="user-reports-sort" class="control-select" onchange="CitizenInterface.sortUserReports(this.value)">
                        <option value="newest">Más reciente</option>
                        <option value="oldest">Más antiguo</option>
                        <option value="priority">Prioridad</option>
                        <option value="status">Estado</option>
                    </select>
                </div>
            </div>
        `;
    },

    // Get filtered and sorted user reports
    getFilteredUserReports() {
        let reports = window.BachesLoja.getCurrentUserReports();
        
        // Apply filter
        const filterSelect = document.getElementById('user-reports-filter');
        const filterValue = filterSelect ? filterSelect.value : '';
        if (filterValue) {
            reports = reports.filter(report => report.status === filterValue);
        }
        
        // Apply sort
        const sortSelect = document.getElementById('user-reports-sort');
        const sortValue = sortSelect ? sortSelect.value : 'newest';
        
        switch (sortValue) {
            case 'newest':
                reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
            case 'oldest':
                reports.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
            case 'priority':
                const priorityOrder = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
                reports.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                break;
            case 'status':
                const statusOrder = { 'Pendiente': 1, 'En proceso': 2, 'Resuelto': 3 };
                reports.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
                break;
        }
        
        return reports;
    },

    // Filter user reports
    filterUserReports(status) {
        this.updateMyReportsDisplay();
    },

    // Sort user reports
    sortUserReports(criteria) {
        this.updateMyReportsDisplay();
    },

    // Create report card HTML
    createReportCard(report) {
        const priorityColor = window.BachesLoja.getPriorityColor(report.priority);
        const statusColor = window.BachesLoja.getStatusColor(report.status);
        
        return `
            <div class="report-card" data-report-id="${report.id}">
                <div class="report-header">
                    <div class="report-id">${report.id}</div>
                    <div class="report-date">${window.BachesLoja.formatDate(report.timestamp)}</div>
                </div>
                
                <div class="report-content">
                    <div class="report-description">
                        ${report.description.substring(0, 100)}${report.description.length > 100 ? '...' : ''}
                    </div>
                    
                    <div class="report-location">
                        <span class="location-icon">📍</span>
                        ${report.neighborhood} - ${report.roadType}
                    </div>
                </div>
                
                <div class="report-footer">
                    <div class="report-priority" style="background-color: ${priorityColor}20; color: ${priorityColor};">
                        <div class="road-triangle priority-${report.priority.toLowerCase()}"></div>
                        ${report.priority}
                    </div>
                    
                    <div class="report-status" style="background-color: ${statusColor}20; color: ${statusColor};">
                        ${report.status}
                    </div>
                </div>
            </div>
        `;
    },

    // Show toast notification — delegates to BachesLoja.showToast for a single
    // implementation and consistent styling (icons, auto-dismiss, dark-mode).
    showToast(message, type = 'info') {
        if (window.BachesLoja && typeof window.BachesLoja.showToast === 'function') {
            window.BachesLoja.showToast(message, type);
        } else {
            // Fallback: BachesLoja not yet loaded (should not happen in normal flow)
            console.warn('[CitizenInterface] BachesLoja.showToast unavailable:', message);
        }
    },

    // Render citizen view
    render() {
        console.log('Rendering Citizen Interface...');
        this.updateMyReportsDisplay();
    },

    // Mobile touch gestures for report cards
    setupTouchGestures() {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;

        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.report-card')) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isDragging = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            
            const deltaX = currentX - startX;
            const deltaY = currentY - startY;
            
            // Only horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                const reportCard = e.target.closest('.report-card');
                if (reportCard && Math.abs(deltaX) > 50) {
                    reportCard.style.transform = `translateX(${deltaX}px)`;
                    reportCard.style.opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200);
                }
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const reportCard = e.target.closest('.report-card');
            if (reportCard) {
                const deltaX = currentX - startX;
                
                // Reset position and opacity
                reportCard.style.transform = 'translateX(0)';
                reportCard.style.opacity = '1';
                
                // Trigger action on significant swipe
                if (Math.abs(deltaX) > 100) {
                    const reportId = reportCard.getAttribute('data-report-id');
                    if (deltaX > 0) {
                        // Swipe right - show details
                        this.showReportDetails(reportId);
                    } else {
                        // Swipe left - quick action menu could go here
                        this.showToast('Desliza hacia la derecha para ver detalles', 'info');
                    }
                }
            }
        }, { passive: true });
    },

    // Show report details (mobile optimized)
    showReportDetails(reportId) {
        const report = window.BachesLoja.state.reports.find(r => r.id === reportId);
        if (!report) return;
        
        // Create mobile-friendly details modal
        const modal = document.createElement('div');
        modal.className = 'mobile-report-modal';
        modal.innerHTML = `
            <div class="mobile-modal-content">
                <div class="mobile-modal-header">
                    <h3>Reporte ${report.id}</h3>
                    <button class="mobile-modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="mobile-modal-body">
                    <div class="report-detail-item">
                        <label>Descripción:</label>
                        <p>${report.description}</p>
                    </div>
                    <div class="report-detail-item">
                        <label>Ubicación:</label>
                        <p>${report.neighborhood} - Vía ${report.roadType}</p>
                    </div>
                    <div class="report-detail-item">
                        <label>Estado:</label>
                        <span class="status-badge ${report.status.toLowerCase().replace(' ', '-')}">${report.status}</span>
                    </div>
                    <div class="report-detail-item">
                        <label>Prioridad:</label>
                        <span class="priority-badge" style="color: ${window.BachesLoja.getPriorityColor(report.priority)};">
                            ${report.priority}
                        </span>
                    </div>
                    <div class="report-detail-item">
                        <label>Fecha:</label>
                        <p>${window.BachesLoja.formatDate(report.timestamp)}</p>
                    </div>
                    ${report.photo ? `
                        <div class="report-detail-item">
                            <label>Foto:</label>
                            <img src="${typeof report.photo === 'string' ? report.photo : (report.photo.dataUrl || '')}"
                                 alt="Foto del reporte"
                                 style="max-width: 100%; border-radius: 8px; margin-top: 8px;"
                                 onerror="this.style.display='none'" />
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.CitizenInterface.init();
});