// frontend/src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { User, UserRole } from "../types";

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const useAuthProvider = (): AuthContextType => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setUserProfile(snap.data() as User);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) await fetchProfile(user.uid);
      else setUserProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await fetchProfile(cred.user.uid);
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile: User = {
      id: cred.user.uid,
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", cred.user.uid), profile);
    setUserProfile(profile);
  };

  const loginWithGoogle = async (role: UserRole = "student") => {
    const cred = await signInWithPopup(auth, googleProvider);
    const ref = doc(db, "users", cred.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profile: User = {
        id: cred.user.uid,
        name: cred.user.displayName || "User",
        email: cred.user.email || "",
        role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(ref, profile);
      setUserProfile(profile);
    } else {
      setUserProfile(snap.data() as User);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  return { currentUser, userProfile, loading, login, register, loginWithGoogle, logout };
};
