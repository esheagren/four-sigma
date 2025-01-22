import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const credentialsPath = join(__dirname, '../../../credentials/firebase-credentials.json');

let db;
let auth;

try {
    // Read and parse the credentials file
    const serviceAccount = JSON.parse(
        readFileSync(credentialsPath, 'utf8')
    );

    // Clear any existing apps
    admin.apps.forEach(app => app.delete());

    // Initialize Firebase with explicit project configuration
    const app = admin.initializeApp({
        projectId: serviceAccount.project_id,  // Add this line
        credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();  // Note: removed app parameter
    auth = admin.auth();     // Note: removed app parameter

    // Verify initialization
    console.log('Firebase initialization verification:', {
        projectId: serviceAccount.project_id,
        appProjectId: app.options.projectId,
        appName: app.name,
        credentialType: app.options.credential.constructor.name
    });

} catch (error) {
    console.error('Firebase Initialization Error:', error);
    throw error;
}

export { db, auth };
