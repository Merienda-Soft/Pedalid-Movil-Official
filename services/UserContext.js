import React, { createContext, useState, useContext } from "react";

// Crear el contexto
const UserContext = createContext();
const GlobalStateContext = createContext();

// Proveedor del contexto
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const GlobalStateProvider = ({ children }) => {
  const [globalState, setGlobalState] = useState({});

  const clearGlobalState = () => {
    setGlobalState({
      materiaid: null,
      cursoid: null,
      teacherid: null,
    });
  };

  return (
    <GlobalStateContext.Provider
      value={{ globalState, setGlobalState, clearGlobalState }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
export const useGlobalState = () => useContext(GlobalStateContext);
