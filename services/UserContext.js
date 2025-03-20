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

  const clearGlobalState = (callback) => {
    if (typeof callback === 'function') {
      setGlobalState(prevState => ({
        ...callback(prevState)
      }));
    } else {
      setGlobalState({
        management: globalState.management // Mantenemos el management por defecto
      });
    }
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
