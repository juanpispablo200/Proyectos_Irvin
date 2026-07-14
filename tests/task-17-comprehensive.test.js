/* BachesLoja - Task 17 Comprehensive Testing & Validation */

// ============================================================================
// SUB-TASK 1: Test all form submissions and validations
// ============================================================================

testFramework.category('Task 17 - Form Validation');

testFramework.test(
    'Task 17 - Form Validation',
    'Form Submission - Valid Data Acceptance',
    'Verifies that valid form data is accepted and processed correctly',
    async () => {
        const validSubmissions = [
            {
                description: 'Bache grande en la avenida principal',
                neighborhood: 'Centro Histórico',
                roadType: 'Principal',
                photo: true
            },
            {
                description: 'Pequeño hueco en calle vecinal que necesita reparación',
                neighborhood: 'El Valle',
                roadType: 'Vecinal',
                photo: false
            },
            {
                description: 'Deterioro severo con múltiples huecos profundos y peligrosos',
                neighborhood: 'Sucre',
                roadType: 'Secundaria',
                photo: true
            }
        ];

        const results = [];
        for (const submission of validSubmissions) {
            const validation = window.BachesLojaAI.validateInput(submission);
            const classification = window.BachesLojaAI.classifyReport(submission);
            
            results.push({
                valid: validation.valid,
                hasPriority: !!classification.priority,
                description: submission.description.substring(0, 30) + '...'
            });
        }

        testFramework.assert(
            results.every(r => r.valid && r.hasPriority),
            'All valid submissions should be accepted and classified'
        );

        return { totalTests: results.length, allPassed: results.every(r => r.valid) };
    }
);
