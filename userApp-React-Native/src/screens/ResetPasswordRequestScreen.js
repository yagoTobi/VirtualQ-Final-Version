import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../constants";

async function resetPassword(email) {
  const response = await fetch(`${API_BASE_URL}/api/clients/reset-password/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
    }),
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Password reset failed. Please try again.");
  }
}

export default function ResetPasswordRequestScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage("A password reset link has been sent to your email!");
    } catch (error) {
      console.error("Error during password reset:", error);
      alert("Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Virtual Q." />

      {/* Scrollable content area */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginHeader}>Reset Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="email"
              value={email}
              onChangeText={(text) => setEmail(text)}
            />
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>Reset Password</Text>
            </TouchableOpacity>
            {loading && <ActivityIndicator />}
            {successMessage !== "" && (
              <Text style={styles.successMessage}>{successMessage}</Text>
            )}
            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => navigation.navigate("LogInScreen")}
            >
              <Text style={styles.signupLinkText}>Back to Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Fixed footer */}
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  loginHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    width: "80%",
  },
  input: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  loginButton: {
    backgroundColor: "blue",
    borderRadius: 5,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  signupLink: {
    alignItems: "center",
  },
  signupLinkText: {
    fontSize: 14,
  },
  successMessage: {
    color: "green",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "blue",
  },
  content: {
    flexGrow: 1,
    backgroundColor: "white", // White background for the content area
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  footer: {
    flexDirection: "row",
    height: 50,
    borderRadius: 25,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  footerButton: {
    alignItems: "center",
  },
  footerButtonText: {
    color: "white",
    fontSize: 14,
  },
});
