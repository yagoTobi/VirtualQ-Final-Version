// App.js
import React from "react";
import AppNavigator from "./src/screens/AppNavigator.js";
import { AuthProvider } from "./src/AuthContext.js";

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
