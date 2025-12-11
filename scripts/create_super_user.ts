
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA6r0i0PYvVjRkR3aA3Ir2YLCgBCxeirdo",
    authDomain: "predict-8d637.firebaseapp.com",
    projectId: "predict-8d637",
    storageBucket: "predict-8d637.firebasestorage.app",
    messagingSenderId: "255895005600",
    appId: "1:255895005600:web:fa70d3f138c12926605cc5"
};

async function createSuperUser() {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const email = 'admin@predictionmatrix.com';
    const password = 'AdminPassword123!';

    try {
        console.log(`Creating user: ${email}...`);
        // Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('Auth user created successfully:', user.uid);

        // Create Firestore Profile
        console.log('Setting up admin profile in Firestore...');
        const userProfile = {
            uid: user.uid,
            email: user.email,
            displayName: 'Super Admin',
            role: 'admin',
            subscriptionTier: 'premium',
            subscriptionStatus: 'active',
            createdAt: new Date().toISOString(),
            credits: 999999,
            preferences: {
                notifications: true,
                theme: 'dark'
            }
        };

        await setDoc(doc(db, 'users', user.uid), userProfile);
        console.log('✅ Success! User created with ADMIN role and PREMIUM subscription.');
        console.log('---------------------------------------------------');
        console.log('Email:    ', email);
        console.log('Password: ', password);
        console.log('---------------------------------------------------');

        process.exit(0);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('⚠️  User already exists. Proceeding to login...');
        } else {
            console.error('❌ Error creating user:', error);
        }
        process.exit(1);
    }
}

createSuperUser();
