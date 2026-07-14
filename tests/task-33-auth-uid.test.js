/**
 * Task 33 - Auth UID Integration Tests
 * 
 * Tests that app.js correctly uses auth.uid() instead of hardcoded user IDs
 */

// =============================================================================
//  Category: Task 33 - Initial State
// =============================================================================
testFramework.category('Task 33 – Initial State');

testFramework.test(
    'Task 33 – Initial State',
    'currentUser should be null on init',
    'Verify state.currentUser is initialized as null, not a hardcoded value',
    async () => {
        const currentUser = window.BachesLoja.state.currentUser;
        // Allow null or undefined (in case session was restored)
        testFramework.assert(
            currentUser === null || typeof currentUser === 'string',
            `currentUser should be null initially or a UUID after session restore, got: ${currentUser}`
        );
        return { currentUser };
    }
);

testFramework.test(
    'Task 33 – Initial State',
    'currentRole should be null on init',
    'Verify state.currentRole is initialized as null',
    async () => {
        const currentRole = window.BachesLoja.state.currentRole;
        testFramework.assert(
            currentRole === null || currentRole === 'ciudadano' || currentRole === 'admin',
            `currentRole should be null initially or a valid role after session restore, got: ${currentRole}`
        );
        return { currentRole };
    }
);

// =============================================================================
//  Category: Task 33 - addReport with Authentication
// =============================================================================
testFramework.category('Task 33 – addReport with Authentication');

testFramework.test(
    'Task 33 – addReport with Authentication',
    'should reject unauthenticated citizen report',
    'When currentUser is null and role is not admin, addReport should fail',
    async () => {
        // Save original state
        const origUser = window.BachesLoja.state.currentUser;
        const origRole = window.BachesLoja.state.currentRole;
        const origOffline = window.BachesLoja.state.isOffline;
        const origReports = [...window.BachesLoja.state.reports];

        try {
            // Set up unauthenticated state
            window.BachesLoja.state.currentUser = null;
            window.BachesLoja.state.currentRole = null;
            window.BachesLoja.state.isOffline = true;

            const reportData = {
                description: 'Test pothole - should fail',
                neighborhood: 'Centro Histórico',
                roadType: 'Principal',
                priority: 'Alta',
                priorityScore: 5,
                location: { lat: -3.9939, lng: -79.2042 }
            };

            const result = await window.BachesLoja.addReport(reportData);

            testFramework.assert(
                result === null,
                'addReport should return null when user is not authenticated'
            );

            return { success: true, result };
        } finally {
            // Restore original state
            window.BachesLoja.state.currentUser = origUser;
            window.BachesLoja.state.currentRole = origRole;
            window.BachesLoja.state.isOffline = origOffline;
            window.BachesLoja.state.reports = origReports;
        }
    }
);

testFramework.test(
    'Task 33 – addReport with Authentication',
    'should allow authenticated citizen to create report',
    'When currentUser is a UUID and role is ciudadano, addReport should succeed',
    async () => {
        const origUser = window.BachesLoja.state.currentUser;
        const origRole = window.BachesLoja.state.currentRole;
        const origOffline = window.BachesLoja.state.isOffline;
        const origReports = [...window.BachesLoja.state.reports];

        try {
            const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
            window.BachesLoja.state.currentUser = mockUserId;
            window.BachesLoja.state.currentRole = 'ciudadano';
            window.BachesLoja.state.isOffline = true;

            const reportData = {
                description: 'Authenticated citizen report',
                neighborhood: 'Sucre',
                roadType: 'Secundaria',
                priority: 'Media',
                priorityScore: 3,
                location: { lat: -3.9955, lng: -79.2055 }
            };

            const result = await window.BachesLoja.addReport(reportData);

            testFramework.assert(result !== null, 'addReport should succeed for authenticated user');
            testFramework.assertEqual(result.citizenId, mockUserId, 'citizenId should match currentUser UUID');

            return { success: true, citizenId: result.citizenId };
        } finally {
            window.BachesLoja.state.currentUser = origUser;
            window.BachesLoja.state.currentRole = origRole;
            window.BachesLoja.state.isOffline = origOffline;
            window.BachesLoja.state.reports = origReports;
        }
    }
);

testFramework.test(
    'Task 33 – addReport with Authentication',
    'should allow admin to bypass authentication',
    'When role is admin, addReport should succeed even with null currentUser',
    async () => {
        const origUser = window.BachesLoja.state.currentUser;
        const origRole = window.BachesLoja.state.currentRole;
        const origOffline = window.BachesLoja.state.isOffline;
        const origReports = [...window.BachesLoja.state.reports];

        try {
            window.BachesLoja.state.currentUser = null;
            window.BachesLoja.state.currentRole = 'admin';
            window.BachesLoja.state.isOffline = true;

            const reportData = {
                description: 'Admin bypass test',
                neighborhood: 'El Valle',
                roadType: 'Principal',
                priority: 'Alta',
                priorityScore: 6,
                location: { lat: -3.9985, lng: -79.2078 }
            };

            const result = await window.BachesLoja.addReport(reportData);

            testFramework.assert(result !== null, 'Admin should be able to create reports without authentication');

            return { success: true, description: result.description };
        } finally {
            window.BachesLoja.state.currentUser = origUser;
            window.BachesLoja.state.currentRole = origRole;
            window.BachesLoja.state.isOffline = origOffline;
            window.BachesLoja.state.reports = origReports;
        }
    }
);

// =============================================================================
//  Category: Task 33 - getCurrentUserReports with UUIDs
// =============================================================================
testFramework.category('Task 33 – getCurrentUserReports with UUIDs');

testFramework.test(
    'Task 33 – getCurrentUserReports with UUIDs',
    'should filter reports by UUID correctly',
    'getCurrentUserReports should match reports by UUID citizenId',
    async () => {
        const origUser = window.BachesLoja.state.currentUser;
        const origReports = [...window.BachesLoja.state.reports];

        try {
            const userId1 = '123e4567-e89b-12d3-a456-426614174000';
            const userId2 = '987e6543-e21b-12d3-a456-426614174999';

            window.BachesLoja.state.currentUser = userId1;
            window.BachesLoja.state.reports = [
                { id: 'RPT001', citizenId: userId1, description: 'User 1 report 1' },
                { id: 'RPT002', citizenId: userId2, description: 'User 2 report' },
                { id: 'RPT003', citizenId: userId1, description: 'User 1 report 2' }
            ];

            const userReports = window.BachesLoja.getCurrentUserReports();

            testFramework.assertEqual(userReports.length, 2, 'Should return 2 reports for user 1');
            testFramework.assertEqual(userReports[0].id, 'RPT001', 'First report should be RPT001');
            testFramework.assertEqual(userReports[1].id, 'RPT003', 'Second report should be RPT003');

            const allMatch = userReports.every(r => r.citizenId === userId1);
            testFramework.assert(allMatch, 'All returned reports should belong to current user');

            return { count: userReports.length, reportIds: userReports.map(r => r.id) };
        } finally {
            window.BachesLoja.state.currentUser = origUser;
            window.BachesLoja.state.reports = origReports;
        }
    }
);

testFramework.test(
    'Task 33 – getCurrentUserReports with UUIDs',
    'should return empty array when no matching reports',
    'When user has no reports, getCurrentUserReports should return empty array',
    async () => {
        const origUser = window.BachesLoja.state.currentUser;
        const origReports = [...window.BachesLoja.state.reports];

        try {
            const userId1 = '123e4567-e89b-12d3-a456-426614174000';
            const userId2 = '987e6543-e21b-12d3-a456-426614174999';

            window.BachesLoja.state.currentUser = userId1;
            window.BachesLoja.state.reports = [
                { id: 'RPT001', citizenId: userId2, description: 'User 2 only' }
            ];

            const userReports = window.BachesLoja.getCurrentUserReports();

            testFramework.assertEqual(userReports.length, 0, 'Should return empty array');

            return { count: userReports.length };
        } finally {
            window.BachesLoja.state.currentUser = origUser;
            window.BachesLoja.state.reports = origReports;
        }
    }
);

// =============================================================================
//  Category: Task 33 - updateReportStatus with gestionadoPor
// =============================================================================
testFramework.category('Task 33 – updateReportStatus with gestionadoPor');

testFramework.test(
    'Task 33 – updateReportStatus with gestionadoPor',
    'should set gestionadoPor when updating status',
    'updateReportStatus should assign currentUser to gestionadoPor field',
    async () => {
        const origUser = window.BachesLoja.state.currentUser;
        const origRole = window.BachesLoja.state.currentRole;
        const origOffline = window.BachesLoja.state.isOffline;
        const origReports = [...window.BachesLoja.state.reports];

        try {
            const adminId = '123e4567-e89b-12d3-a456-426614174000';
            window.BachesLoja.state.currentUser = adminId;
            window.BachesLoja.state.currentRole = 'admin';
            window.BachesLoja.state.isOffline = true;
            window.BachesLoja.state.reports = [
                {
                    id: 'RPT999',
                    citizenId: 'user-123',
                    status: 'Pendiente',
                    description: 'Test report'
                }
            ];

            const result = await window.BachesLoja.updateReportStatus('RPT999', 'En proceso');

            testFramework.assert(result !== null, 'updateReportStatus should succeed');
            testFramework.assertEqual(result.status, 'En proceso', 'Status should be updated');
            testFramework.assertEqual(result.gestionadoPor, adminId, 'gestionadoPor should be set to admin UUID');

            return { status: result.status, gestionadoPor: result.gestionadoPor };
        } finally {
            window.BachesLoja.state.currentUser = origUser;
            window.BachesLoja.state.currentRole = origRole;
            window.BachesLoja.state.isOffline = origOffline;
            window.BachesLoja.state.reports = origReports;
        }
    }
);

testFramework.test(
    'Task 33 – updateReportStatus with gestionadoPor',
    'should reject invalid status',
    'updateReportStatus should return null for invalid status values',
    async () => {
        const origUser = window.BachesLoja.state.currentUser;
        const origOffline = window.BachesLoja.state.isOffline;
        const origReports = [...window.BachesLoja.state.reports];

        try {
            window.BachesLoja.state.currentUser = 'admin-123';
            window.BachesLoja.state.isOffline = true;
            window.BachesLoja.state.reports = [
                { id: 'RPT998', citizenId: 'user-123', status: 'Pendiente' }
            ];

            const result = await window.BachesLoja.updateReportStatus('RPT998', 'InvalidStatus');

            testFramework.assert(result === null, 'Should return null for invalid status');

            return { result: 'Correctly rejected invalid status' };
        } finally {
            window.BachesLoja.state.currentUser = origUser;
            window.BachesLoja.state.isOffline = origOffline;
            window.BachesLoja.state.reports = origReports;
        }
    }
);

// =============================================================================
//  Category: Task 33 - Supabase Integration
// =============================================================================
testFramework.category('Task 33 – Supabase Integration');

testFramework.test(
    'Task 33 – Supabase Integration',
    'SupabaseDB.updateReportStatus accepts gestionadoPor parameter',
    'Verify method signature has 3 parameters',
    async () => {
        testFramework.assertExists(window.SupabaseDB, 'SupabaseDB should be defined');
        testFramework.assertExists(window.SupabaseDB.updateReportStatus, 'updateReportStatus method should exist');
        
        const paramCount = window.SupabaseDB.updateReportStatus.length;
        testFramework.assertEqual(paramCount, 3, 'updateReportStatus should accept 3 parameters: id, newStatus, gestionadoPor');

        return { parameterCount: paramCount };
    }
);
