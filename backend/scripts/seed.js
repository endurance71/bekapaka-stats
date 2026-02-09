
import { seedDatabase } from '../dataStore.js';

console.log('Starting manual database seed...');
process.env.ENABLE_AUTO_SEED = 'true'; // Force enable for this script

seedDatabase()
    .then(() => {
        console.log('Manual seed completed successfully.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    });
