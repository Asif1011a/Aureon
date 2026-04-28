import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("EN");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const d = await getDoc(doc(db, "users", u.uid));
        if (d.exists()) {
          setUserData(d.data());
          setUserRole(d.data().role);
        }
      } else {
        setUserData(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password, role, extraData) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", res.user.uid), {
      email,
      role,
      ...extraData,
      createdAt: new Date()
    });
    return res;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setUserRole(null);
  };

  const toggleLang = () => setLang(prev => prev === "EN" ? "TA" : "EN");

  return (
    <AppContext.Provider value={{ user, userData, userRole, loading, login, register, logout, lang, toggleLang }}>
      {!loading && children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
