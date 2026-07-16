/* BachesLoja - Main Application Logic */

// Global Application State
window.BachesLoja = {
    // Application state
    state: {
        currentView: 'landing', // 'landing' | 'citizen' | 'municipal'
        reports: [],
        currentUser: null,    // UUID from auth.uid() — set on successful login
        currentRole: null,    // 'ciudadano' | 'admin' — set on successful login
        pendingRole: null,    // set when user clicks a role card, before auth modal
        authMode: 'login',    // 'login' | 'register' — current auth form mode
        filters: {
            priority: null,
            status: null,
            neighborhood: null
        },
        isLoading: false,
        error: null,
        isOffline: false
    },

    // Loja neighborhoods configuration
    config: {
        neighborhoods: [
            'Centro Histórico', 'Sucre', 'El Valle', 'San Sebastián',
            'Punzara', 'Zamora Huayco', 'Carigán', 'Yahuarcuna',
            'La Argelia', 'San Cayetano'
        ],
        roadTypes: ['Principal', 'Secundaria', 'Vecinal']
    },

    // Initialize application
    async init() {
        console.log('Initializing BachesLoja application...');

        // Req 11.4 — restore dark mode preference ASAP, before loading screen hides
        this.restoreDarkMode();

        try {
            // Attempt to load reports from Supabase
            try {
                this.state.reports = await window.SupabaseDB.fetchReports();
                console.log(`Loaded ${this.state.reports.length} reports from Supabase`);
            } catch (fetchError) {
                console.warn('[BachesLoja] Supabase fetch failed, falling back to sample data:', fetchError);
                this.state.isOffline = true;
                this.loadSampleData();
                this.showOfflineBanner();
            }

            this.setupEventListeners();

            // Req 10.5 — restore session on page reload
            let sessionRestored = false;
            try {
                const userSession = await window.SupabaseDB.getCurrentUser();
                if (userSession && userSession.profile) {
                    console.log('[BachesLoja] Session found, restoring view for:', userSession.profile.rol);
                    this.onLoginSuccess(userSession.profile);
                    sessionRestored = true;
                }
            } catch (sessionError) {
                // Not a fatal error — no session means we show landing
                console.warn('[BachesLoja] Could not retrieve session:', sessionError);
            }

            // Req 10.3 — show landing if no active session
            if (!sessionRestored) {
                this.switchView('landing');
            }

            // Req 10.5 — listen for future auth state changes (login in other tabs, token expiry, etc.)
            try {
                window.SupabaseDB.onAuthStateChange((userOrNull) => {
                    if (userOrNull && userOrNull.profile) {
                        // Session restored or signed in — only route if no view is active yet
                        if (!this.state.currentRole) {
                            this.onLoginSuccess(userOrNull.profile);
                        }
                    } else {
                        // Session cleared (sign-out, token expired)
                        this.handleLogout(false);
                    }
                });
            } catch (authListenError) {
                console.warn('[BachesLoja] onAuthStateChange setup failed:', authListenError);
            }

            console.log('Application initialized successfully');
        } catch (error) {
            this.handleError('Failed to initialize application', error);
        } finally {
            // Hide loading screen regardless of success or fallback
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
        }
    },

    // View switching functionality
    switchView(viewName) {
        try {
            if (!['citizen', 'municipal', 'landing'].includes(viewName)) {
                throw new Error(`Invalid view name: ${viewName}`);
            }

            console.log(`Switching to ${viewName} view`);
            this.state.currentView = viewName;

            // Hide all view containers
            const landingView  = document.getElementById('landing-view');
            const citizenView  = document.getElementById('citizen-view');
            const municipalView = document.getElementById('municipal-view');

            if (landingView)   { landingView.style.display  = 'none'; landingView.classList.remove('active');  }
            if (citizenView)   { citizenView.style.display  = 'none'; citizenView.classList.remove('active');  }
            if (municipalView) { municipalView.style.display = 'none'; municipalView.classList.remove('active'); }

            // Show selected view
            if (viewName === 'landing') {
                if (landingView) {
                    landingView.style.display = 'flex';
                    landingView.classList.add('active');
                    // Trigger entrance animation
                    landingView.classList.remove('view-entering');
                    void landingView.offsetWidth; // force reflow
                    landingView.classList.add('view-entering');
                }
                // Update nav: neither role button is active on landing
                this.updateNavigation(null);
                return;
            }

            const targetView = document.getElementById(`${viewName}-view`);
            if (targetView) {
                targetView.style.display = 'block';
                targetView.classList.add('active');
                // Trigger entrance animation
                targetView.classList.remove('view-entering');
                void targetView.offsetWidth; // force reflow
                targetView.classList.add('view-entering');
            } else {
                throw new Error(`View container not found: ${viewName}-view`);
            }

            // Update navigation if exists
            this.updateNavigation(viewName);

            // Render view content
            if (viewName === 'citizen') {
                this.renderCitizenView();
            } else if (viewName === 'municipal') {
                this.renderMunicipalView();
            }

            console.log(`Successfully switched to ${viewName} view`);
        } catch (error) {
            this.handleError(`Failed to switch to ${viewName} view`, error);
        }
    },

    // ── Auth / Role helpers (Req 10.3, 10.5) ────────────────────────────────

    /**
     * Called when a role card is tapped on the landing screen.
     * Stores the intended role and shows #auth-modal.
     * @param {'ciudadano'|'admin'} role
     */
    showAuthModal(role) {
        console.log(`[BachesLoja] showAuthModal called with role: ${role}`);
        this.state.pendingRole = role;

        const authModal = document.getElementById('auth-modal');
        if (!authModal) {
            console.warn('[BachesLoja] #auth-modal not found in DOM');
            return;
        }

        // Update modal title to reflect chosen role
        const titleEl = document.getElementById('auth-modal-title');
        if (titleEl) {
            titleEl.textContent = role === 'admin'
                ? 'Acceso Municipal'
                : 'Ingresar como ciudadano';
        }

        // Reset form to login mode whenever modal is opened
        this.switchAuthMode('login');
        this._clearAuthError();

        // Reset field values
        const form = document.getElementById('auth-form');
        if (form) form.reset();

        authModal.classList.add('active');
        authModal.setAttribute('aria-hidden', 'false');

        // Trap focus: move to first focusable field
        setTimeout(() => {
            const firstField = authModal.querySelector('#auth-email');
            if (firstField) firstField.focus();
        }, 50);

        // Escape key closes modal
        this._authEscHandler = (e) => {
            if (e.key === 'Escape') this.hideAuthModal();
        };
        document.addEventListener('keydown', this._authEscHandler);
    },

    /** Hide #auth-modal and clear pending role intent */
    hideAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.remove('active');
            authModal.setAttribute('aria-hidden', 'true');
        }
        this.state.pendingRole = null;

        if (this._authEscHandler) {
            document.removeEventListener('keydown', this._authEscHandler);
            this._authEscHandler = null;
        }
    },

    /**
     * Toggle between login and register mode in the auth modal.
     * @param {'login'|'register'} mode
     */
    switchAuthMode(mode) {
        this.state.authMode = mode;

        const nameGroup   = document.getElementById('auth-name-group');
        const submitLabel = document.getElementById('auth-submit-label');
        const footerHint  = document.getElementById('auth-footer-hint');
        const tabLogin    = document.getElementById('auth-tab-login');
        const tabRegister = document.getElementById('auth-tab-register');
        const pwdInput    = document.getElementById('auth-password');

        if (mode === 'register') {
            if (nameGroup)   { nameGroup.hidden = false; }
            if (submitLabel) { submitLabel.textContent = 'Crear cuenta'; }
            if (footerHint)  {
                footerHint.innerHTML = '¿Ya tienes cuenta? <button type="button" class="auth-form__link" onclick="window.BachesLoja.switchAuthMode(\'login\')">Inicia sesión aquí</button>';
            }
            if (tabLogin)    { tabLogin.classList.remove('auth-modal__tab--active');    tabLogin.setAttribute('aria-selected', 'false'); }
            if (tabRegister) { tabRegister.classList.add('auth-modal__tab--active');    tabRegister.setAttribute('aria-selected', 'true'); }
            if (pwdInput)    { pwdInput.setAttribute('autocomplete', 'new-password'); }
        } else {
            if (nameGroup)   { nameGroup.hidden = true; }
            if (submitLabel) { submitLabel.textContent = 'Iniciar sesión'; }
            if (footerHint)  {
                footerHint.innerHTML = '¿No tienes cuenta? <button type="button" class="auth-form__link" onclick="window.BachesLoja.switchAuthMode(\'register\')">Regístrate aquí</button>';
            }
            if (tabLogin)    { tabLogin.classList.add('auth-modal__tab--active');       tabLogin.setAttribute('aria-selected', 'true'); }
            if (tabRegister) { tabRegister.classList.remove('auth-modal__tab--active'); tabRegister.setAttribute('aria-selected', 'false'); }
            if (pwdInput)    { pwdInput.setAttribute('autocomplete', 'current-password'); }
        }

        this._clearAuthError();
    },

    /** Toggle password field visibility */
    togglePasswordVisibility() {
        const pwdInput = document.getElementById('auth-password');
        const eyeIcon  = document.getElementById('auth-pwd-eye');
        if (!pwdInput) return;

        if (pwdInput.type === 'password') {
            pwdInput.type = 'text';
            if (eyeIcon) eyeIcon.textContent = '🙈';
        } else {
            pwdInput.type = 'password';
            if (eyeIcon) eyeIcon.textContent = '👁';
        }
    },

    /** Show inline error inside auth modal */
    _showAuthError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.hidden = false;
        }
    },

    /** Clear inline auth error */
    _clearAuthError() {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.hidden = true;
        }
    },

    /** Set auth form loading state */
    _setAuthLoading(loading) {
        const submitBtn  = document.getElementById('auth-submit-btn');
        const submitLabel = document.getElementById('auth-submit-label');
        const loader     = document.getElementById('auth-loader');
        const tabLogin   = document.getElementById('auth-tab-login');
        const tabRegister = document.getElementById('auth-tab-register');

        if (submitBtn)  { submitBtn.disabled = loading; }
        if (loader)     { loader.hidden = !loading; }
        if (submitLabel) { submitLabel.style.opacity = loading ? '0.5' : '1'; }
        if (tabLogin)    { tabLogin.disabled = loading; }
        if (tabRegister) { tabRegister.disabled = loading; }
    },

    /**
     * Handle auth form submission (login or register).
     * Req 10.1, 10.2, 10.8
     * @param {Event} event - form submit event
     */
    async handleAuthSubmit(event) {
        event.preventDefault();
        this._clearAuthError();

        const mode = this.state.authMode || 'login';
        const role = this.state.pendingRole || 'ciudadano';

        const email    = (document.getElementById('auth-email')?.value || '').trim();
        const password = (document.getElementById('auth-password')?.value || '');
        const nombre   = (document.getElementById('auth-name')?.value || '').trim();

        // Basic client-side validation
        if (!email) {
            this._showAuthError('Por favor ingresa tu correo electrónico.');
            document.getElementById('auth-email')?.focus();
            return;
        }
        if (!password || password.length < 6) {
            this._showAuthError('La contraseña debe tener al menos 6 caracteres.');
            document.getElementById('auth-password')?.focus();
            return;
        }
        if (mode === 'register' && !nombre) {
            this._showAuthError('Por favor ingresa tu nombre.');
            document.getElementById('auth-name')?.focus();
            return;
        }

        this._setAuthLoading(true);

        try {
            let profile;

            if (mode === 'register') {
                // Req 10.1 — sign up with role from pending intent
                const result = await window.SupabaseDB.signUp(email, password, nombre, role);
                profile = result.profile;
            } else {
                // Req 10.2 — sign in
                const result = await window.SupabaseDB.signIn(email, password);
                profile = result.profile;
            }

            // Req 10.2 — admin role guard: if user attempted admin login but profile.rol !== 'admin'
            if (role === 'admin' && profile.rol !== 'admin') {
                // Sign out immediately to clean up the auth session
                try { await window.SupabaseDB.signOut(); } catch (_) { /* best-effort */ }
                this._setAuthLoading(false);
                this.hideAuthModal();
                this.showToast('Acceso denegado: tu cuenta no tiene permisos de administrador', 'error');
                return;
            }

            this._setAuthLoading(false);
            this.onLoginSuccess(profile);

        } catch (err) {
            this._setAuthLoading(false);
            const msg = err && err.message ? err.message : 'Error de autenticación. Inténtalo de nuevo.';

            // Req 10.8 — show toast AND inline error for auth errors
            // Special case: email already registered → suggest login
            if (msg.toLowerCase().includes('ya está registrado') ||
                msg.toLowerCase().includes('already registered')) {
                this._showAuthError(msg);
                this.showToast(msg + ' — prueba Iniciar sesión.', 'warning');
            } else {
                this._showAuthError(msg);
                this.showToast(msg, 'error');
            }

            console.error('[BachesLoja] handleAuthSubmit error:', err);
        }
    },

    /**
     * Called after a successful login to set state and navigate to the
     * correct view. Also used on page reload to restore an existing session.
     * Req 10.3 — hide landing and switch to correct view
     * @param {{ rol: string, nombre?: string, id?: string }} profile
     */
    onLoginSuccess(profile) {
        if (!profile) return;

        const role = profile.rol; // 'ciudadano' | 'admin'

        // Req 10.3 — assign state
        this.state.currentRole = role;
        this.state.currentUser = profile.id || this.state.currentUser;

        console.log(`[BachesLoja] onLoginSuccess — role: ${role}, user: ${this.state.currentUser}`);

        this.hideAuthModal();

        // Hide the role-switcher nav so citizens can't click into the municipal view
        this._updateNavVisibility(role);

        // Req 10.3 — route to correct interface
        if (role === 'admin') {
            this.switchView('municipal');
        } else {
            this.switchView('citizen');
        }
    },

    /**
     * Log the current user out.
     * Req 10.5, 10.6 — session management and logout buttons.
     *
     * @param {boolean} [callSignOut=true] - When false, skips the SupabaseDB.signOut() call
     *   (used when the session was cleared externally, e.g. via onAuthStateChange, so we
     *   avoid a double-signout race condition).
     */
    async handleLogout(callSignOut = true) {
        if (callSignOut) {
            try {
                await window.SupabaseDB.signOut();
            } catch (err) {
                console.warn('[BachesLoja] handleLogout: signOut error (continuing anyway):', err);
            }
        }

        // Clear user session from state
        this.state.currentUser = null;
        this.state.currentRole = null;
        this.state.reports = [];

        // Restore the nav switcher visibility for the landing screen
        this._updateNavVisibility(null);

        // Return to landing screen
        this.switchView('landing');

        console.log('[BachesLoja] User logged out.');
    },

    /**
     * Show a toast notification.
     * Req 10.8 — no alert() calls; use toast for all auth feedback.
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} type
     * @param {number} duration  ms before auto-dismiss (default 4000)
     */
    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toast.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:10px;">
                <span aria-hidden="true" style="font-size:1.1rem;flex-shrink:0;">${icons[type] || icons.info}</span>
                <span style="flex:1;font-size:0.9rem;line-height:1.4;">${message}</span>
                <button onclick="this.closest('.toast').remove()"
                        aria-label="Cerrar notificación"
                        style="background:none;border:none;cursor:pointer;font-size:1rem;color:#6B7280;flex-shrink:0;padding:0;">×</button>
            </div>`;

        container.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'opacity 0.3s, transform 0.3s';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    },

    // Setup event listeners
    setupEventListeners() {
        // Navigation event listeners
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-view]')) {
                e.preventDefault();
                const viewName = e.target.getAttribute('data-view');
                this.switchView(viewName);
            }
        });

        // Global error handler
        window.addEventListener('error', (e) => {
            this.handleError('Unhandled error', e.error);
        });
    },

    // Update navigation active state
    updateNavigation(currentView) {
        const navItems = document.querySelectorAll('[data-view]');
        navItems.forEach(item => {
            const viewName = item.getAttribute('data-view');
            if (currentView === null) {
                // Landing view → no nav item is active
                item.classList.remove('active');
                item.setAttribute('aria-pressed', 'false');
            } else if (viewName === currentView) {
                item.classList.add('active');
                item.setAttribute('aria-pressed', 'true');
            } else {
                item.classList.remove('active');
                item.setAttribute('aria-pressed', 'false');
            }
        });
    },

    // Load sample data for demonstration
    loadSampleData() {
        console.log('Loading sample data...');
        
        const sampleReports = [
            {
                id: 'RPT001',
                timestamp: new Date(2024, 6, 15, 9, 30), // July 15, 2024, 9:30 AM
                description: 'Bache profundo que causa daño a los vehículos. Es muy peligroso especialmente para motos.',
                photo: null,
                neighborhood: 'Centro Histórico',
                roadType: 'Principal',
                location: { lat: -3.9939, lng: -79.2042 },
                priority: 'Alta',
                priorityScore: 8,
                reasoning: ['Palabra de severidad detectada: profundo (+3)', 'Palabra de riesgo detectada: peligroso (+3)', 'Mención de daño vehicular: vehículos, motos (+2)', 'Vía Principal (+2)'],
                status: 'En proceso',
                citizenId: 'citizen_001'
            },
            {
                id: 'RPT002',
                timestamp: new Date(2024, 6, 14, 14, 45), // July 14, 2024, 2:45 PM
                description: 'Pequeño bache en la vía secundaria cerca del mercado.',
                photo: null,
                neighborhood: 'Sucre',
                roadType: 'Secundaria',
                location: { lat: -3.9955, lng: -79.2055 },
                priority: 'Baja',
                priorityScore: 1,
                reasoning: ['Vía Secundaria (+1)'],
                status: 'Pendiente',
                citizenId: 'citizen_002'
            },
            {
                id: 'RPT003',
                timestamp: new Date(2024, 6, 13, 8, 15), // July 13, 2024, 8:15 AM
                description: 'Bache grande en avenida principal que genera riesgo de accidentes.',
                photo: null,
                neighborhood: 'El Valle',
                roadType: 'Principal',
                location: { lat: -3.9985, lng: -79.2078 },
                priority: 'Alta',
                priorityScore: 8,
                reasoning: ['Palabra de severidad detectada: grande (+3)', 'Palabra de riesgo detectada: riesgo, accidentes (+3)', 'Vía Principal (+2)'],
                status: 'Resuelto',
                citizenId: 'citizen_003'
            },
            {
                id: 'RPT004',
                timestamp: new Date(2024, 6, 12, 16, 20), // July 12, 2024, 4:20 PM
                description: 'Deterioro en vía vecinal que necesita atención.',
                photo: null,
                neighborhood: 'San Sebastián',
                roadType: 'Vecinal',
                location: { lat: -3.9912, lng: -79.2015 },
                priority: 'Media',
                priorityScore: 2,
                reasoning: ['Con fotografía (+1)', 'Vía Vecinal (+0)', 'Score ajustado para demostración'],
                status: 'Pendiente',
                citizenId: 'citizen_001'
            },
            {
                id: 'RPT005',
                timestamp: new Date(2024, 6, 11, 11, 10), // July 11, 2024, 11:10 AM
                description: 'Bache enorme que ya causó daño a una llanta de mi vehículo.',
                photo: null,
                neighborhood: 'Punzara',
                roadType: 'Secundaria',
                location: { lat: -4.0012, lng: -79.2089 },
                priority: 'Alta',
                priorityScore: 6,
                reasoning: ['Palabra de severidad detectada: enorme (+3)', 'Mención de daño vehicular: llanta, vehículo (+2)', 'Vía Secundaria (+1)'],
                status: 'En proceso',
                citizenId: 'citizen_004'
            },
            {
                id: 'RPT006',
                timestamp: new Date(2024, 6, 10, 13, 30), // July 10, 2024, 1:30 PM
                description: 'Hueco mediano en calle residencial.',
                photo: null,
                neighborhood: 'Zamora Huayco',
                roadType: 'Vecinal',
                location: { lat: -3.9892, lng: -79.1995 },
                priority: 'Media',
                priorityScore: 2,
                reasoning: ['Con fotografía (+1)', 'Vía Vecinal (+0)', 'Score ajustado para demostración'],
                status: 'Pendiente',
                citizenId: 'citizen_005'
            }
        ];

        this.state.reports = sampleReports;
        console.log(`Loaded ${sampleReports.length} sample reports`);
    },

    // Get reports for current user (citizen view)
    getCurrentUserReports() {
        return this.state.reports.filter(report => report.citizenId === this.state.currentUser);
    },

    // Get filtered reports (municipal view)
    getFilteredReports() {
        let filteredReports = [...this.state.reports];

        if (this.state.filters.priority) {
            filteredReports = filteredReports.filter(report => 
                report.priority === this.state.filters.priority
            );
        }

        if (this.state.filters.status) {
            filteredReports = filteredReports.filter(report => 
                report.status === this.state.filters.status
            );
        }

        // Accept both 'neighborhood' (legacy) and 'zone' (MunicipalDashboard) as the same filter
        const neighborhoodFilter = this.state.filters.neighborhood || this.state.filters.zone;
        if (neighborhoodFilter) {
            filteredReports = filteredReports.filter(report => 
                report.neighborhood === neighborhoodFilter
            );
        }

        return filteredReports;
    },

    // Calculate statistics for municipal dashboard
    calculateStatistics() {
        const reports = this.state.reports;
        const highPriorityReports = reports.filter(r => r.priority === 'Alta');
        const inProgressReports = reports.filter(r => r.status === 'En proceso');
        const resolvedReports = reports.filter(r => r.status === 'Resuelto');

        // Calculate average response time (simplified for demo)
        const avgResponseTime = resolvedReports.length > 0 ? '2.5 días' : 'N/A';

        return {
            total: reports.length,
            highPriority: highPriorityReports.length,
            inProgress: inProgressReports.length,
            resolved: resolvedReports.length,
            avgResponseTime
        };
    },

    // Add new report to state and persist to Supabase
    async addReport(reportData) {
        try {
            // Req 10.4 — require authentication; admin can bypass
            if (!this.state.currentUser) {
                if (this.state.currentRole !== 'admin') {
                    throw new Error('Debes iniciar sesión para reportar');
                }
            }

            const newReport = {
                // Use crypto.randomUUID() for collision-free IDs across concurrent users.
                // Falls back to a timestamp+random string in environments without crypto.
                id: (typeof crypto !== 'undefined' && crypto.randomUUID)
                    ? `RPT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
                    : `RPT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
                timestamp: new Date(),
                status: 'Pendiente',
                citizenId: this.state.currentUser, // Now a UUID from auth
                ...reportData
            };

            this.state.reports.unshift(newReport);
            console.log('New report added:', newReport.id);

            // Persist to Supabase unless in offline mode
            if (!this.state.isOffline) {
                try {
                    await window.SupabaseDB.insertReport(newReport);
                    console.log('Report persisted to Supabase');
                } catch (dbError) {
                    console.warn('Could not persist report to Supabase, kept in memory only', dbError);
                    // Do NOT remove the report from state — offline resilience
                }
            }

            return newReport;
        } catch (error) {
            this.handleError('Failed to add report', error);
            return null;
        }
    },

    // Update report status
    async updateReportStatus(reportId, newStatus) {
        const report = this.state.reports.find(r => r.id === reportId);
        if (!report) {
            this.handleError('Failed to update report status', new Error(`Report not found: ${reportId}`));
            return null;
        }

        const validStatuses = ['Pendiente', 'En proceso', 'Resuelto'];
        if (!validStatuses.includes(newStatus)) {
            this.handleError('Failed to update report status', new Error(`Invalid status: ${newStatus}`));
            return null;
        }

        report.status = newStatus;
        // Req 10.7 — track who managed the status change
        report.gestionadoPor = this.state.currentUser;
        console.log(`Report ${reportId} status updated to: ${newStatus} by ${this.state.currentUser}`);

        // Persist to Supabase unless in offline mode
        // Re-throws on Supabase failure so the caller (changeReportStatus) can revert in memory
        if (!this.state.isOffline) {
            await window.SupabaseDB.updateReportStatus(reportId, newStatus, this.state.currentUser);
            console.log(`Status updated in Supabase for report ${reportId}`);
        }

        return report;
    },

    // Apply filters (municipal view)
    applyFilters(filters) {
        try {
            // Normalize: MunicipalDashboard uses 'zone', state uses 'neighborhood' — keep both in sync
            const normalized = { ...filters };
            if (normalized.zone !== undefined) {
                normalized.neighborhood = normalized.zone;
            }
            this.state.filters = { ...this.state.filters, ...normalized };
            console.log('Filters applied:', this.state.filters);
            
            // Re-render municipal view if active
            if (this.state.currentView === 'municipal') {
                this.renderMunicipalView();
            }
        } catch (error) {
            this.handleError('Failed to apply filters', error);
        }
    },

    // Clear all filters
    clearFilters() {
        this.state.filters = {
            priority: null,
            status: null,
            neighborhood: null,
            zone: null
        };
        console.log('All filters cleared');
        
        // Re-render municipal view if active
        if (this.state.currentView === 'municipal') {
            this.renderMunicipalView();
        }
    },

    // Render citizen view
    renderCitizenView() {
        console.log('Rendering citizen view...');
        if (window.CitizenInterface && typeof window.CitizenInterface.render === 'function') {
            window.CitizenInterface.render();
        }
    },

    // Render municipal view
    renderMunicipalView() {
        console.log('Rendering municipal view...');
        if (window.MunicipalDashboard && typeof window.MunicipalDashboard.render === 'function') {
            window.MunicipalDashboard.render();
        }
    },

    // Error handling utilities
    handleError(message, error = null) {
        console.error(`BachesLoja Error: ${message}`, error);
        
        this.state.error = {
            message,
            timestamp: new Date(),
            details: error ? error.message : null
        };

        // Show user-friendly error message
        this.showErrorMessage(message);
    },

    // Show error message to user
    showErrorMessage(message) {
        // Create or update error display
        let errorDiv = document.getElementById('error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-message';
            errorDiv.className = 'error-banner';
            document.body.insertBefore(errorDiv, document.body.firstChild);
        }

        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-close" onclick="BachesLoja.clearError()">✕</button>
            </div>
        `;
        errorDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.clearError();
        }, 5000);
    },

    // Clear error display
    clearError() {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        this.state.error = null;
    },

    // Show offline mode warning banner
    showOfflineBanner() {
        // Avoid duplicates
        if (document.getElementById('offline-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.setAttribute('role', 'alert');
        banner.style.cssText = [
            'position: fixed',
            'top: 0',
            'left: 0',
            'right: 0',
            'z-index: 9999',
            'background: #F2B705',
            'color: #1C1F26',
            'padding: 10px 16px',
            'display: flex',
            'align-items: center',
            'justify-content: space-between',
            'font-family: Inter, sans-serif',
            'font-size: 14px',
            'font-weight: 500',
            'box-shadow: 0 2px 6px rgba(0,0,0,0.2)'
        ].join('; ');

        banner.innerHTML = `
            <span>⚠️ Trabajando en modo sin conexión — los cambios no se guardarán</span>
            <button
                onclick="document.getElementById('offline-banner').style.display='none'"
                aria-label="Cerrar aviso de modo sin conexión"
                style="background:none;border:none;cursor:pointer;font-size:18px;color:#1C1F26;line-height:1;padding:0 0 0 12px;"
            >✕</button>
        `;

        document.body.insertBefore(banner, document.body.firstChild);
    },

    // Set loading state
    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        
        // Update UI loading indicators
        const loadingElements = document.querySelectorAll('.loading-indicator');
        loadingElements.forEach(el => {
            el.style.display = isLoading ? 'block' : 'none';
        });
    },

    // Utility: Generate unique ID
    generateId(prefix = 'ID') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Utility: Format date for display
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Utility: Get priority color
    getPriorityColor(priority) {
        const colors = {
            'Alta': '#E8590C',    // Alert orange
            'Media': '#F2B705',   // Road sign yellow
            'Baja': '#2F9E44'     // Safety green
        };
        return colors[priority] || '#1C1F26';
    },

    // Utility: Get status color
    getStatusColor(status) {
        const colors = {
            'Pendiente': '#F2B705',   // Road sign yellow
            'En proceso': '#E8590C',  // Alert orange
            'Resuelto': '#2F9E44'     // Safety green
        };
        return colors[status] || '#1C1F26';
    },

    /**
     * Show or hide the header nav switcher depending on whether the user is
     * logged in and which role they have.
     *
     * - Not logged in (landing): hide the switcher entirely — no role buttons visible.
     * - Logged in as 'ciudadano': hide the switcher (citizen can't jump to municipal).
     * - Logged in as 'admin': hide the switcher (admin can't jump to citizen either).
     *
     * The switcher is only useful before auth; after login the logout button
     * is the only navigation control the user needs.
     *
     * @param {'ciudadano'|'admin'|null} role
     */
    _updateNavVisibility(role) {
        const switcher = document.querySelector('.view-switcher');
        if (!switcher) return;

        if (role === null) {
            // Back to landing — hide switcher (landing has its own role cards)
            switcher.style.display = 'none';
        } else {
            // Logged in — keep hidden; the logout button handles exit
            switcher.style.display = 'none';
        }
    },

    // ── Dark Mode — Task 38 (Req 11.4, 11.5, 11.7) ─────────────────────────

    /**
     * Toggle dark mode on/off.
     * - Toggles `html.dark-mode` class
     * - Persists preference in localStorage under key 'bachesloja-dark-mode'
     * - Updates toggle button icon and aria-label
     */
    toggleDarkMode() {
        const html = document.documentElement;
        const isDark = html.classList.toggle('dark-mode');
        localStorage.setItem('bachesloja-dark-mode', isDark ? '1' : '0');
        this._applyDarkModeIcon(isDark);
    },

    /**
     * Restore dark mode preference from localStorage or system preference.
     * Called once during init() before the loading screen is hidden.
     */
    restoreDarkMode() {
        const stored = localStorage.getItem('bachesloja-dark-mode');
        let isDark;

        if (stored !== null) {
            // Explicit user preference overrides system setting
            isDark = stored === '1';
        } else {
            // Fall back to OS/browser system preference
            isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        if (isDark) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }

        this._applyDarkModeIcon(isDark);

        // Keep in sync if user changes OS preference without an explicit override
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only follow OS change if the user has no stored preference
                if (localStorage.getItem('bachesloja-dark-mode') === null) {
                    if (e.matches) {
                        document.documentElement.classList.add('dark-mode');
                    } else {
                        document.documentElement.classList.remove('dark-mode');
                    }
                    this._applyDarkModeIcon(e.matches);
                }
            });
        }
    },

    /** Update the toggle button icon and aria-label to reflect current mode */
    _applyDarkModeIcon(isDark) {
        const icon   = document.getElementById('dark-mode-icon');
        const btn    = document.getElementById('dark-mode-toggle');
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
        if (btn)  btn.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
    }
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.BachesLoja.init();
});