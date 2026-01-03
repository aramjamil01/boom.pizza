
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDqoOjm4m1Fxp760mJPy0sv5_NjaJfkm7g",
    authDomain: "boompizza-5d048.firebaseapp.com",
    databaseURL: "https://boompizza-5d048-default-rtdb.firebaseio.com",
    projectId: "boompizza-5d048",
    storageBucket: "boompizza-5d048.firebasestorage.app",
    messagingSenderId: "636068289590",
    appId: "1:636068289590:web:41fe758906140c700ecc97"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
