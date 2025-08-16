import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBEELeANe-CMDUwFxzXVD5-jwysVvvV0t0",
  authDomain: "feira-de-trocas-cotemig.firebaseapp.com",
  databaseURL: "https://feira-de-trocas-cotemig-default-rtdb.firebaseio.com",
  projectId: "feira-de-trocas-cotemig",
  storageBucket: "feira-de-trocas-cotemig.firebasestorage.app",
  messagingSenderId: "677163444957",
  appId: "1:677163444957:web:11f9255c7bcf9ed35c0934"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
