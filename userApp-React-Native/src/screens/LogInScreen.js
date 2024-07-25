import React, { useState, useContext, useCallback, useEffect } from "react";
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

import { API_BASE_URL } from "../constants";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthContext from "../AuthContext";
import SuccessBanner from "../components/SuccessBanner";
import { Input } from "react-native-elements";
import Icon from "react-native-vector-icons/FontAwesome";

async function loginUser(username, password) {
  const response = await fetch(`${API_BASE_URL}/api/clients/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error response from server: ${errorText}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  } else {
    const data = await response.json();
    return data.token;
  }
}

export default function LogInScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { token, authenticate } = useContext(AuthContext);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState(true);

  const handleLogin = useCallback(async () => {
    if (username === "" || password === "") {
      alert("Username and password cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const newToken = await loginUser(username, password);
      authenticate(newToken);
      setShowSuccessBanner(true);

      setTimeout(() => {
        setShowSuccessBanner(false); // Optionally, you can hide the banner right before navigation
        navigation.navigate("HomeScreen");
      }, 2000);
    } catch (error) {
      console.error("Error during login:", error);
      alert("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [username, password, authenticate, navigation]);

  useEffect(() => {
    if (token) {
      navigation.navigate("HomeScreen");
    }
  }, [token, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Virtual Q." />

      {/* Scrollable content area */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginHeader}>Log In</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={(text) => setUsername(text)}
            />
            {/* Password placeholder */}
            <Input
              placeholder="Password"
              secureTextEntry={passwordVisibility}
              value={password}
              onChangeText={(text) => setPassword(text)}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setPasswordVisibility(!passwordVisibility)}
                >
                  <Icon
                    name={passwordVisibility ? "eye-slash" : "eye"}
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
            {loading && <ActivityIndicator />}
            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => navigation.navigate("SignUpScreen")}
            >
              <Text style={styles.signupLinkText}>
                Haven't created an account yet? Sign Up
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => navigation.navigate("ResetPasswordRequestScreen")}
            >
              <Text style={styles.signupLinkText}>
                Forgotten your password? Click here.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showSuccessBanner && (
          <SuccessBanner
            message="You have successfully logged in."
            onAnimationEnd={() => setShowSuccessBanner(false)}
          />
        )}
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
  headerImg: {
    width: "100%",
    height: "30%",
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  banner1: {
    backgroundColor: "turquoise",
    width: "100%",
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
  },
  banner2: {
    backgroundColor: "grey",
    width: "100%",
    borderColor: "black",
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
  },
  bannerTextContainer: {
    flex: 1,
  },
  banner1Header: {
    fontSize: 18,
    fontWeight: "bold",
  },
  banner1Text: {
    fontSize: 14,
  },
  banner2Header: {
    fontSize: 18,
    fontWeight: "bold",
  },
  banner2Text: {
    fontSize: 14,
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
