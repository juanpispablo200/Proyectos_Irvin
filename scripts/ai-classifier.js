/* BachesLoja - AI Classification Engine */

window.BachesLojaAI = {
    keywords: {
        severity: ['profundo', 'grande', 'enorme', 'severo', 'grave', 'inmenso'],
        risk:     ['accidente', 'peligroso', 'riesgo', 'peligro', 'urgente', 'emergencia'],
        damage:   ['moto', 'llanta', 'vehículo', 'vehiculo', 'carro', 'auto', 'daño']
    },

    classifyReport(reportData) {
        const description = (reportData.description || '').toLowerCase();
        const roadType    = reportData.roadType  || '';
        const hasPhoto    = !!reportData.photo;

        let score     = 0;
        let reasoning = [];

        const foundSeverity = this.keywords.severity.filter(w => description.includes(w));
        if (foundSeverity.length > 0) {
            score += 3;
            reasoning.push(`Palabra de severidad detectada: ${foundSeverity.join(', ')} (+3)`);
        }

        const foundRisk = this.keywords.risk.filter(w => description.includes(w));
        if (foundRisk.length > 0) {
            score += 3;
            reasoning.push(`Palabra de riesgo detectada: ${foundRisk.join(', ')} (+3)`);
        }

        const foundDamage = this.keywords.damage.filter(w => description.includes(w));
        if (foundDamage.length > 0) {
            score += 2;
            reasoning.push(`Mención de daño vehicular: ${foundDamage.join(', ')} (+2)`);
        }

        if (roadType === 'Principal') {
            score += 2;
            reasoning.push('Vía Principal (+2)');
        } else if (roadType === 'Secundaria') {
            score += 1;
            reasoning.push('Vía Secundaria (+1)');
        }

        if (hasPhoto) {
            score += 1;
            reasoning.push('Con fotografía (+1)');
        }

        let priority;
        if (score >= 5) {
            priority = 'Alta';
        } else if (score >= 2) {
            priority = 'Media';
        } else {
            priority = 'Baja';
        }

        const confidence = Math.min(score / 9, 1);
        return { priority, priorityScore: score, reasoning, confidence };
    },

    validateInput(data) {
        const errors = [];
        if (!data.description || data.description.trim().length < 10) {
            errors.push('La descripción debe tener al menos 10 caracteres.');
        }
        if (data.description && data.description.trim().length > 500) {
            errors.push('La descripción no puede exceder 500 caracteres.');
        }
        if (!data.neighborhood) {
            errors.push('Selecciona un barrio.');
        }
        if (!data.roadType || !['Principal', 'Secundaria', 'Vecinal'].includes(data.roadType)) {
            errors.push('Tipo de vía no válido.');
        }
        return { valid: errors.length === 0, errors };
    },

    analyzeDescription(text) {
        const lower = (text || '').toLowerCase();
        return {
            severity: this.keywords.severity.filter(w => lower.includes(w)),
            risk:     this.keywords.risk.filter(w => lower.includes(w)),
            damage:   this.keywords.damage.filter(w => lower.includes(w))
        };
    }
};
