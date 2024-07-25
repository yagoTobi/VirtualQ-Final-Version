import React, { useContext, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";

import { TouchableWithoutFeedback, Keyboard } from "react-native";
import AuthContext from "../AuthContext";
import { API_BASE_URL } from "../constants";
import DatePicker from "../components/DatePicker";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SuccessBanner from "../components/SuccessBanner";

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const { authenticate } = useContext(AuthContext);

  const handleSignUp = async () => {
    if (password !== repeatPassword) {
      alert("Passwords do not match!");
      return;
    }

    const requestBody = {
      username: username,
      email: email,
      password: password,
      name: name,
      last_name: surname,
      dob: dateOfBirth,
    };

    console.log("Sending request with body:", requestBody);

    try {
      const response = await fetch(`${API_BASE_URL}/api/clients/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }).catch((error) => {
        console.error("Fetch error:", error);
      });

      if (response) {
        if (response.ok) {
          const data = await response.json();
          setShowSuccessBanner(true);
          authenticate(data.token);

          setTimeout(() => {
            navigation.navigate("HomeScreen");
          }, 2000);
        } else {
          alert("Sign up failed. Please try again.");
        }
      } else {
        alert("Sign up failed. Please try again");
      }
    } catch (error) {
      alert("Sign up failed. Please try again.");
    }
  };

  const handleSuccessBannerAnimationEnd = () => {
    setShowSuccessBanner(false);
    // Navigate to another screen or reset the form, depending on your requirements
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <Header title="Virtual Q." />

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.signupContainer}>
            {showSuccessBanner && (
              <SuccessBanner
                onAnimationEnd={handleSuccessBannerAnimationEnd}
                message={"Signed up succesfully!"}
              />
            )}
            {/* ... rest of the content */}
            <Text style={styles.signupHeader}>Sign Up</Text>
            <View style={styles.inputContainer}>
              <Text>Name</Text>
              <View style={styles.nameSurnameContainer}>
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  autoCapitalize="words"
                  placeholder="Name"
                  value={name}
                  onChangeText={setName}
                />
                <TextInput
                  style={[styles.input, styles.surnameInput]}
                  autoCapitalize="words"
                  placeholder="Surname"
                  value={surname}
                  onChangeText={setSurname}
                />
              </View>

              <Text>Date of Birth</Text>
              <DatePicker onDateSelected={setDateOfBirth} />

              <Text>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <Text>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={true}
                autoCapitalize="none"
                onChangeText={(text) => setPassword(text)}
              />
              <Text>Repeat Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Repeat Password"
                value={repeatPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                onChangeText={(text) => setRepeatPassword(text)}
              />
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignUp}
              >
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <Footer navigation={navigation} />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  signupContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  signupHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    width: "80%",
  },
  nameSurnameContainer: {
    flexDirection: "row",
  },
  input: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  nameInput: {
    flex: 1,
    marginRight: 5,
  },
  surnameInput: {
    flex: 1,
    marginLeft: 5,
  },
  signupButton: {
    backgroundColor: "blue",
    borderRadius: 5,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  signupButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
