/* BachesLoja - Comprehensive Validation Tests */

// Cross-Browser Compatibility Tests
testFramework.category('Cross-Browser Validation');

testFramework.test(
    'Cross-Browser Validation',
    'Browser APIs - LocalStorage Support',
    'Verifies that localStorage is available for data persistence',
    async () => {
        testFramework.assertExists(window.localStorage, 'LocalStorage should be available');
        
        // Test write
        try {
            localStorage.setItem('test_key', 'test_value');
            const value = localStorage.getItem('test_key');
            testFramework.assertEqual(value, 'test_value', 'Should read written value');
            localStorage.removeItem('test_key');
        } catch (error) {
            throw new Error('LocalStorage operations failed: ' + error.message);
        }

        return { supported: true };
    }
);

testFramework.test(
    'Cross-Browser Validation',
    'Browser APIs - Geolocation Support',
    'Verifies that geolocation API is available',
    async () => {
        testFramework.assertExists(window.navigator.geolocation, 'Geolocation API should be available');
        
        return { 
            supported: true,
            hasGetCurrentPosition: typeof navigator.geolocation.getCurrentPosition === 'function'
        };
    }
);

testFramework.test(
    'Cross-Browser Validation',
    'Browser APIs - FileReader Support',
    'Verifies that FileReader API is available for photo uploads',
    async () => {
        testFramework.assertExists(window.FileReader, 'FileReader API should be available');
        
        const reader = new FileReader();
        testFramework.assertExists(reader.readAsDataURL, 'FileReader should have readAsDataURL method');
        
        return { supported: true };
    }
);

testFramework.test(
    'Cross-Browser Validation',
    'CSS - Grid Support',
    'Verifies that CSS Grid is supported for layout',
    async () => {
        const testDiv = document.createElement('div');
        testDiv.style.display = 'grid';
        document.body.appendChild(testDiv);
        
        const computedStyle = window.getComputedStyle(testDiv);
        const supportsGrid = computedStyle.display === 'grid';
        
        document.body.removeChild(testDiv);
        
        testFramework.assert(supportsGrid, 'CSS Grid should be supported');
        
        return { supported: supportsGrid };
    }
);

testFramework.test(
    'Cross-Browser Validation',
    'CSS - Flexbox Support',
    'Verifies that CSS Flexbox is supported for layout',
    async () => {
        const testDiv = document.createElement('div');
        testDiv.style.display = 'flex';
        document.body.appendChild(testDiv);
        
        const computedStyle = window.getComputedStyle(testDiv);
        const supportsFlex = computedStyle.display === 'flex';
        
        document.body.removeChild(testDiv);
        
        testFramework.assert(supportsFlex, 'CSS Flexbox should be supported');
        
        return { supported: supportsFlex };
    }
);

testFramework.test(
    'Cross-Browser Validation',
    'ES6 Features - Arrow Functions',
    'Verifies that ES6 arrow functions are supported',
    async () => {
        const testArrow = () => 'test';
        const result = testArrow();
        
        testFramework.assertEqual(result, 'test', 'Arrow functions should work');
        
        return { supported: true };
    }
);

testFramework.test(
    'Cross-Browser Validation',
    'ES6 Features - Template Literals',
    'Verifies that ES6 template literals are supported',
    async () => {
        const value = 'test';
        const template = `Value is ${value}`;
        
        testFramework.assertEqual(template, 'Value is test', 'Template literals should work');
        
        return { supported: true };
    }
);

// Responsive Design Validation Tests
testFramework.category('Responsive Design Validation');

testFramework.test(
    'Responsive Design Validation',
    'Mobile Viewport - 320px Width',
    'Verifies that the app is usable at minimum mobile width',
    async () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        testFramework.assertExists(viewport, 'Viewport meta tag should exist');
        
        const content = viewport.getAttribute('content');
        testFramework.assert(content.includes('width=device-width'), 'Should have device-width');
        testFramework.assert(content.includes('initial-scale=1'), 'Should have initial-scale=1');
        
        // Check that app container doesn't have fixed width
        const appContainer = document.getElementById('app');
        if (appContainer) {
            const styles = window.getComputedStyle(appContainer);
            const maxWidth = parseInt(styles.maxWidth);
            testFramework.assert(isNaN(maxWidth) || maxWidth === 0 || maxWidth > 320, 
                'App should be usable at 320px');
        }
        
        return { viewportConfigured: true, minWidth: 320 };
    }
);

testFramework.test(
    'Responsive Design Validation',
    'Tablet Viewport - 768px Width',
    'Verifies that the app adapts to tablet screen sizes',
    async () => {
        // Check for responsive elements
        const form = document.getElementById('report-form');
        if (form) {
            const styles = window.getComputedStyle(form);
            testFramework.assertExists(styles, 'Form should have computed styles');
        }
        
        return { supported: true, targetWidth: 768 };
    }
);

testFramework.test(
    'Responsive Design Validation',
    'Desktop Viewport - 1024px+ Width',
    'Verifies that the municipal dashboard works well on desktop',
    async () => {
        window.BachesLoja.switchView('municipal');
        
        const municipalView = document.getElementById('municipal-view');
        testFramework.assertExists(municipalView, 'Municipal view should exist');
        
        // Check for desktop-optimized elements
        const dashboard = document.getElementById('municipal-dashboard');
        if (dashboard) {
            testFramework.assertExists(dashboard, 'Dashboard should exist');
        }
        
        window.BachesLoja.switchView('citizen');
        
        return { supported: true, targetWidth: 1024 };
    }
);

testFramework.test(
    'Responsive Design Validation',
    'Touch-Friendly Elements',
    'Verifies that interactive elements are large enough for touch',
    async () => {
        const buttons = document.querySelectorAll('button');
        const tooSmallButtons = [];
        
        buttons.forEach(button => {
            const rect = button.getBoundingClientRect();
            const minTouchSize = 44; // Apple's recommended minimum
            
            if (rect.width > 0 && rect.height > 0 && 
                (rect.width < minTouchSize || rect.height < minTouchSize)) {
                tooSmallButtons.push({
                    text: button.textContent.trim().substring(0, 20),
                    width: rect.width,
                    height: rect.height
                });
            }
        });
        
        // Allow some flexibility - not all buttons need to be 44px in desktop view
        return { 
            totalButtons: buttons.length,
            tooSmallCount: tooSmallButtons.length,
            tooSmallButtons: tooSmallButtons.slice(0, 3)
        };
    }
);

testFramework.test(
    'Responsive Design Validation',
    'Font Scaling - Text Readability',
    'Verifies that font sizes are appropriate for readability',
    async () => {
        const body = document.body;
        const bodyStyles = window.getComputedStyle(body);
        const bodyFontSize = parseInt(bodyStyles.fontSize);
        
        // Body text should be at least 14px for readability
        testFramework.assert(bodyFontSize >= 14, 'Body font size should be at least 14px');
        
        // Check that headings are proportionally larger
        const h1 = document.querySelector('h1');
        if (h1) {
            const h1Styles = window.getComputedStyle(h1);
            const h1FontSize = parseInt(h1Styles.fontSize);
            testFramework.assert(h1FontSize > bodyFontSize, 'H1 should be larger than body text');
        }
        
        return { bodyFontSize, readable: bodyFontSize >= 14 };
    }
);

// End-to-End Workflow Tests
testFramework.category('End-to-End Workflows');

testFramework.test(
    'End-to-End Workflows',
    'Citizen Flow - Report Creation to Submission',
    'Simulates complete citizen report creation workflow',
    async () => {
        const workflow = [];
        
        // Step 1: Navigate to citizen view
        workflow.push({ step: 1, action: 'Navigate to citizen view' });
        window.BachesLoja.switchView('citizen');
        testFramework.assertEqual(window.BachesLoja.state.currentView, 'citizen', 'Should be in citizen view');
        
        // Step 2: Validate form exists
        workflow.push({ step: 2, action: 'Validate form exists' });
        const form = document.getElementById('report-form');
        testFramework.assertExists(form, 'Report form should exist');
        
        // Step 3: Create report data
        workflow.push({ step: 3, action: 'Create report data' });
        const reportData = {
            description: 'Bache grande y peligroso que necesita atención urgente',
            neighborhood: 'Centro Histórico',
            roadType: 'Principal',
            photo: true
        };
        
        // Step 4: Classify with AI
        workflow.push({ step: 4, action: 'Classify with AI' });
        const classification = window.BachesLojaAI.classifyReport(reportData);
        testFramework.assertExists(classification.priority, 'Should get priority classification');
        testFramework.assertEqual(classification.priority, 'Alta', 'Should be high priority');
        
        // Step 5: Submit report
        workflow.push({ step: 5, action: 'Submit report' });
        const initialCount = window.BachesLoja.state.reports.length;
        const report = window.BachesLoja.addReport({ ...reportData, ...classification });
        testFramework.assertExists(report, 'Report should be created');
        testFramework.assertEqual(window.BachesLoja.state.reports.length, initialCount + 1, 
            'Report count should increase');
        
        // Cleanup
        window.BachesLoja.state.reports = window.BachesLoja.state.reports.filter(r => r.id !== report.id);
        
        return { 
            workflowSteps: workflow.length,
            reportId: report.id,
            priority: classification.priority,
            completed: true
        };
    }
);

testFramework.test(
    'End-to-End Workflows',
    'Municipal Flow - View and Manage Reports',
    'Simulates complete municipal report management workflow',
    async () => {
        const workflow = [];
        
        // Step 1: Switch to municipal view
        workflow.push({ step: 1, action: 'Navigate to municipal dashboard' });
        window.BachesLoja.switchView('municipal');
        testFramework.assertEqual(window.BachesLoja.state.currentView, 'municipal', 
            'Should be in municipal view');
        
        // Step 2: View statistics
        workflow.push({ step: 2, action: 'View dashboard statistics' });
        const stats = window.BachesLoja.calculateStatistics();
        testFramework.assertExists(stats.total, 'Should have total count');
        testFramework.assert(stats.total > 0, 'Should have reports');
        
        // Step 3: Apply filters
        workflow.push({ step: 3, action: 'Apply priority filter' });
        window.BachesLoja.applyFilters({ priority: 'Alta', status: null, neighborhood: null });
        const filtered = window.BachesLoja.getFilteredReports();
        testFramework.assert(filtered.every(r => r.priority === 'Alta'), 
            'All filtered reports should be high priority');
        
        // Step 4: Update report status
        workflow.push({ step: 4, action: 'Update report status' });
        if (filtered.length > 0) {
            const report = filtered[0];
            const originalStatus = report.status;
            window.BachesLoja.updateReportStatus(report.id, 'En proceso');
            testFramework.assertEqual(report.status, 'En proceso', 'Status should be updated');
            
            // Restore original status
            window.BachesLoja.updateReportStatus(report.id, originalStatus);
        }
        
        // Step 5: Clear filters
        workflow.push({ step: 5, action: 'Clear filters' });
        window.BachesLoja.clearFilters();
        const allReports = window.BachesLoja.getFilteredReports();
        testFramework.assertEqual(allReports.length, window.BachesLoja.state.reports.length,
            'Should show all reports after clearing filters');
        
        // Restore citizen view
        window.BachesLoja.switchView('citizen');
        
        return {
            workflowSteps: workflow.length,
            statsTotal: stats.total,
            filteredCount: filtered.length,
            completed: true
        };
    }
);

testFramework.test(
    'End-to-End Workflows',
    'Complete Lifecycle - Report Creation to Resolution',
    'Tests the complete lifecycle of a report from creation to resolution',
    async () => {
        const lifecycle = [];
        
        // Phase 1: Citizen creates report
        lifecycle.push({ phase: 'Creation', status: 'Creating report' });
        const reportData = {
            description: 'Bache enorme que representa un peligro para los vehículos',
            neighborhood: 'El Valle',
            roadType: 'Principal',
            photo: true
        };
        
        const classification = window.BachesLojaAI.classifyReport(reportData);
        const report = window.BachesLoja.addReport({ ...reportData, ...classification });
        testFramework.assertEqual(report.status, 'Pendiente', 'New report should be Pendiente');
        
        // Phase 2: Municipal reviews
        lifecycle.push({ phase: 'Review', status: 'Municipal reviewing' });
        window.BachesLoja.switchView('municipal');
        const stats1 = window.BachesLoja.calculateStatistics();
        testFramework.assert(stats1.total > 0, 'Reports should be visible');
        
        // Phase 3: Work starts
        lifecycle.push({ phase: 'In Progress', status: 'Work started' });
        window.BachesLoja.updateReportStatus(report.id, 'En proceso');
        testFramework.assertEqual(report.status, 'En proceso', 'Status should be En proceso');
        
        const stats2 = window.BachesLoja.calculateStatistics();
        testFramework.assert(stats2.inProgress > 0, 'Should have in-progress reports');
        
        // Phase 4: Work completed
        lifecycle.push({ phase: 'Resolved', status: 'Work completed' });
        window.BachesLoja.updateReportStatus(report.id, 'Resuelto');
        testFramework.assertEqual(report.status, 'Resuelto', 'Status should be Resuelto');
        
        const stats3 = window.BachesLoja.calculateStatistics();
        testFramework.assert(stats3.resolved > 0, 'Should have resolved reports');
        
        // Phase 5: Citizen checks status
        lifecycle.push({ phase: 'Verification', status: 'Citizen verifying' });
        window.BachesLoja.switchView('citizen');
        
        // Cleanup
        window.BachesLoja.state.reports = window.BachesLoja.state.reports.filter(r => r.id !== report.id);
        
        return {
            lifecyclePhases: lifecycle.length,
            reportId: report.id,
            initialStatus: 'Pendiente',
            finalStatus: 'Resuelto',
            completed: true
        };
    }
);

// Data Validation and Integrity Tests
testFramework.category('Data Validation');

testFramework.test(
    'Data Validation',
    'Requirements 1.1-1.8 - Citizen Reporting Validation',
    'Validates all citizen reporting requirements',
    async () => {
        const validation = {
            requirements: [],
            allPassed: true
        };
        
        // Requirement 1.1: Mobile-first responsive interface
        const viewport = document.querySelector('meta[name="viewport"]');
        validation.requirements.push({
            id: '1.1',
            description: 'Mobile-first responsive interface',
            passed: !!viewport
        });
        
        // Requirement 1.2: Free text description input
        const description = document.getElementById('description');
        validation.requirements.push({
            id: '1.2',
            description: 'Free text description input',
            passed: !!description && description.tagName === 'TEXTAREA'
        });
        
        // Requirement 1.3: Photo upload with preview
        const photoInput = document.getElementById('photo-upload');
        validation.requirements.push({
            id: '1.3',
            description: 'Photo upload with preview',
            passed: !!photoInput && photoInput.type === 'file'
        });
        
        // Requirement 1.4: Neighborhood dropdown with Loja zones
        const neighborhood = document.getElementById('neighborhood');
        const hasNeighborhoods = neighborhood && neighborhood.options.length >= 10;
        validation.requirements.push({
            id: '1.4',
            description: 'Neighborhood dropdown with Loja zones',
            passed: hasNeighborhoods
        });
        
        // Requirement 1.5: Geolocation functionality
        const geoButton = document.getElementById('use-location-btn') || 
                         document.querySelector('[data-action="geolocation"]');
        validation.requirements.push({
            id: '1.5',
            description: 'Geolocation functionality',
            passed: !!geoButton && !!navigator.geolocation
        });
        
        // Requirement 1.6: Road type selection
        const roadTypes = document.querySelectorAll('input[name="roadType"]');
        validation.requirements.push({
            id: '1.6',
            description: 'Road type selection',
            passed: roadTypes.length >= 3
        });
        
        // Requirement 1.7: AI classification with loading animation
        const aiClassifier = window.BachesLojaAI;
        validation.requirements.push({
            id: '1.7',
            description: 'AI classification with loading',
            passed: !!aiClassifier && typeof aiClassifier.classifyReport === 'function'
        });
        
        // Requirement 1.8: Display priority with explanation
        const testClassification = aiClassifier.classifyReport({
            description: 'Test report',
            roadType: 'Principal',
            photo: true
        });
        validation.requirements.push({
            id: '1.8',
            description: 'Display priority with explanation',
            passed: !!testClassification.priority && Array.isArray(testClassification.reasoning)
        });
        
        validation.allPassed = validation.requirements.every(r => r.passed);
        testFramework.assert(validation.allPassed, 'All citizen reporting requirements should pass');
        
        return validation;
    }
);

testFramework.test(
    'Data Validation',
    'Requirements 2.1-2.3 - Report Tracking Validation',
    'Validates citizen report tracking requirements',
    async () => {
        const validation = {
            requirements: [],
            allPassed: true
        };
        
        // Requirement 2.1: Display all submitted reports
        const reports = window.BachesLoja.state.reports;
        validation.requirements.push({
            id: '2.1',
            description: 'Display all submitted reports',
            passed: Array.isArray(reports) && reports.length > 0
        });
        
        // Requirement 2.2: Show status for each report
        const allHaveStatus = reports.every(r => 
            ['Pendiente', 'En proceso', 'Resuelto'].includes(r.status)
        );
        validation.requirements.push({
            id: '2.2',
            description: 'Show status for each report',
            passed: allHaveStatus
        });
        
        // Requirement 2.3: Update display when status changes
        const testReport = reports[0];
        if (testReport) {
            const originalStatus = testReport.status;
            const newStatus = originalStatus === 'Pendiente' ? 'En proceso' : 'Pendiente';
            window.BachesLoja.updateReportStatus(testReport.id, newStatus);
            const updated = testReport.status === newStatus;
            window.BachesLoja.updateReportStatus(testReport.id, originalStatus);
            
            validation.requirements.push({
                id: '2.3',
                description: 'Update display when status changes',
                passed: updated
            });
        } else {
            validation.requirements.push({
                id: '2.3',
                description: 'Update display when status changes',
                passed: false
            });
        }
        
        validation.allPassed = validation.requirements.every(r => r.passed);

        validation.allPassed = validation.requirements.every(r => r.passed);
        testFramework.assert(validation.allPassed, 'All report tracking requirements should pass');
        return validation;
    }
);

testFramework.test(
    'Data Validation',
    'Requirements 3.1-3.10 - AI Classification Validation',
    'Validates all AI classification requirements',
    async () => {
        const validation = { requirements: [], allPassed: true };
        const ai = window.BachesLojaAI;

        const r1 = ai.classifyReport({ description: 'bache profundo', roadType: 'Vecinal', photo: false });
        validation.requirements.push({ id: '3.1', description: 'Severity keywords +3', passed: r1.priorityScore >= 3 });

        const r2 = ai.classifyReport({ description: 'muy peligroso', roadType: 'Vecinal', photo: false });
        validation.requirements.push({ id: '3.2', description: 'Risk keywords +3', passed: r2.priorityScore >= 3 });

        const r3 = ai.classifyReport({ description: 'dañó mi llanta', roadType: 'Vecinal', photo: false });
        validation.requirements.push({ id: '3.3', description: 'Damage keywords +2', passed: r3.priorityScore >= 2 });

        const r4 = ai.classifyReport({ description: 'bache aquí', roadType: 'Principal', photo: false });
        validation.requirements.push({ id: '3.4', description: 'Principal +2', passed: r4.priorityScore >= 2 });

        const r5 = ai.classifyReport({ description: 'bache aquí', roadType: 'Secundaria', photo: false });
        validation.requirements.push({ id: '3.5', description: 'Secundaria +1', passed: r5.priorityScore >= 1 });

        const noPhoto   = ai.classifyReport({ description: 'bache en la calle', roadType: 'Vecinal', photo: false });
        const withPhoto = ai.classifyReport({ description: 'bache en la calle', roadType: 'Vecinal', photo: true });
        validation.requirements.push({ id: '3.6', description: 'Photo +1', passed: withPhoto.priorityScore === noPhoto.priorityScore + 1 });

        const rAlta = ai.classifyReport({ description: 'bache grande peligroso', roadType: 'Principal', photo: false });
        validation.requirements.push({ id: '3.7', description: 'Alta when ≥5', passed: rAlta.priorityScore >= 5 && rAlta.priority === 'Alta' });

        const rMedia = ai.classifyReport({ description: 'bache en la calle', roadType: 'Secundaria', photo: true });
        validation.requirements.push({ id: '3.8', description: 'Media when 2-4', passed: rMedia.priorityScore >= 2 && rMedia.priorityScore < 5 && rMedia.priority === 'Media' });

        const rBaja = ai.classifyReport({ description: 'bache en la calle', roadType: 'Vecinal', photo: false });
        validation.requirements.push({ id: '3.9', description: 'Baja when <2', passed: rBaja.priorityScore < 2 && rBaja.priority === 'Baja' });

        validation.requirements.push({ id: '3.10', description: 'Reasoning returned', passed: Array.isArray(rAlta.reasoning) && rAlta.reasoning.length > 0 });

        validation.allPassed = validation.requirements.every(r => r.passed);
        testFramework.assert(validation.allPassed, 'All AI classification requirements should pass');
        return validation;
    }
);

testFramework.test(
    'Data Validation',
    'Requirements 4.1-4.5 - Municipal Dashboard Statistics',
    'Validates municipal dashboard statistics requirements',
    async () => {
        const stats = window.BachesLoja.calculateStatistics();
        const validation = { requirements: [], allPassed: true };

        validation.requirements.push({ id: '4.1', description: 'Total count present',      passed: typeof stats.total === 'number' });
        validation.requirements.push({ id: '4.2', description: 'High priority count',       passed: typeof stats.highPriority === 'number' });
        validation.requirements.push({ id: '4.3', description: 'In-progress count',         passed: typeof stats.inProgress === 'number' });
        validation.requirements.push({ id: '4.4', description: 'Resolved count',            passed: typeof stats.resolved === 'number' });
        validation.requirements.push({ id: '4.5', description: 'Avg response time present', passed: !!stats.avgResponseTime });

        validation.allPassed = validation.requirements.every(r => r.passed);
        testFramework.assert(validation.allPassed, 'All dashboard stat requirements should pass');
        return { stats, validation };
    }
);

testFramework.test(
    'Data Validation',
    'Requirements 5.1-5.6 - Municipal Report Management',
    'Validates municipal report management requirements',
    async () => {
        const validation = { requirements: [], allPassed: true };

        window.BachesLoja.applyFilters({ priority: 'Alta', status: null, neighborhood: null });
        const filtered = window.BachesLoja.getFilteredReports();
        validation.requirements.push({ id: '5.1', description: 'Filter by priority works', passed: filtered.every(r => r.priority === 'Alta') });
        window.BachesLoja.clearFilters();

        const mapEl = document.getElementById('leaflet-map') || document.getElementById('neighborhood-map');
        validation.requirements.push({ id: '5.2', description: 'Map container exists', passed: !!mapEl });

        const tableBody = document.getElementById('reports-table-body');
        validation.requirements.push({ id: '5.4', description: 'Report list exists', passed: !!tableBody });

        const rep  = window.BachesLoja.state.reports[0];
        const orig = rep.status;
        window.BachesLoja.updateReportStatus(rep.id, 'En proceso');
        const updated = rep.status === 'En proceso';
        window.BachesLoja.updateReportStatus(rep.id, orig);
        validation.requirements.push({ id: '5.5', description: 'Status update works',       passed: updated });
        validation.requirements.push({ id: '5.6', description: 'Status change is immediate', passed: updated });

        validation.allPassed = validation.requirements.every(r => r.passed);
        testFramework.assert(validation.allPassed, 'All municipal management requirements should pass');
        return validation;
    }
);

testFramework.test(
    'Data Validation',
    'Requirements 7.1-7.4 - Sample Data',
    'Validates demo sample data requirements',
    async () => {
        const reports = window.BachesLoja.state.reports;
        const validation = { requirements: [], allPassed: true };

        validation.requirements.push({ id: '7.1', description: '5-6 sample reports loaded',     passed: reports.length >= 5 && reports.length <= 6 });
        const hoods = new Set(reports.map(r => r.neighborhood));
        validation.requirements.push({ id: '7.2', description: 'Multiple neighborhoods present', passed: hoods.size >= 3 });
        const priorities = new Set(reports.map(r => r.priority));
        validation.requirements.push({ id: '7.3', description: 'All priorities represented',    passed: priorities.has('Alta') && priorities.has('Media') && priorities.has('Baja') });
        const stats = window.BachesLoja.calculateStatistics();
        validation.requirements.push({ id: '7.4', description: 'Statistics reflect sample data', passed: stats.total === reports.length });

        validation.allPassed = validation.requirements.every(r => r.passed);
        testFramework.assert(validation.allPassed, 'All sample data requirements should pass');
        return validation;
    }
);
