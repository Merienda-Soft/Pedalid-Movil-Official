import React, { createContext, useState, useContext, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authuser, setauthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    try {
      setauthUser(null);
      // Aquí puedes agregar cualquier otra lógica de limpieza necesaria
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ authuser, setauthUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const useAuth = () => useContext(AuthContext);