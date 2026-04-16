/**
 * TriggerRegistry.js
 * Manages Global Actuarial Incidents (Weather, Traffic, Social)
 * Used to verify parametric triggers against server-side ground truth.
 */

const { db } = require('../../firebase');

class TriggerRegistry {
    constructor() {
        this.cache = new Map();
        this.lastFetch = 0;
        this.CACHE_TTL = 30000; // 30 seconds
    }

    /**
     * Get active incidents for a specific location.
     * In a real system, this would pull from Firestore or an external Weather/Traffic API.
     */
    async getActiveIncidents(location = 'Chennai') {
        const now = Date.now();
        
        // Return cached if fresh
        if (this.cache.has(location) && (now - this.lastFetch < this.CACHE_TTL)) {
            return this.cache.get(location);
        }

        try {
            // [DATA-DRIVEN] Attempt to pull from 'global_incidents' collection
            const incidents = [];
            if (db) {
                const snapshot = await db.collection('global_incidents')
                    .where('location', '==', location)
                    .where('active', '==', true)
                    .get();
                
                snapshot.forEach(doc => incidents.push({ id: doc.id, ...doc.data() }));
            }

            // Fallback Seed Data if Registry is empty (Ensures Simulation continuity)
            if (incidents.length === 0) {
                incidents.push(...this.getSeedIncidents(location));
            }

            this.cache.set(location, incidents);
            this.lastFetch = now;
            return incidents;
        } catch (error) {
            console.error('[TRIGGER_REGISTRY_ERROR]', error);
            return this.getSeedIncidents(location);
        }
    }

    getSeedIncidents(location) {
        return [
            {
                type: 'WEATHER',
                subtype: 'Precipitation',
                severity_threshold: 15,
                source: 'IMD-WEATHER-STATION-TN',
                description: 'Monsoon Heavy Rainfall Cycle'
            },
            {
                type: 'TRAFFIC',
                subtype: 'Congestion',
                severity_threshold: 0.7,
                source: 'GOOGLE-TRAFFIC-API',
                description: 'Peak Hour Gridlock'
            }
        ];
    }
}

module.exports = new TriggerRegistry();
