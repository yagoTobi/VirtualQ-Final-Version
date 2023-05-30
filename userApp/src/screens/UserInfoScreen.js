import React, { useState, useEffect, useContext } from "react";
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthContext from "../AuthContext";
import SuccessBanner from "../components/SuccessBanner";
import { API_BASE_URL } from "../constants";
import { ScrollView } from "react-native-gesture-handler";
import DateTimePicker from "@react-native-community/datetimepicker";

const UserInfoScreen = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [datePickerShow, setDatePickerShow] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useContext(AuthContext);

  const [user, setUser] = useState({
    additional_guests: false,
    dob: null,
    email: "",
    first_name: "",
    last_name: "",
    username: "",
  });

  const fieldNames = {
    email: "Email:",
    name: "First Name:",
    last_name: "Last Name:",
    username: "Username:",
    dob: "Date of Birth:",
  };

  const [editedUser, setEditedUser] = useState({ ...user });

  async function getUserDetails(token) {
    setLoading(true); // Start loading
    const response = await fetch(`${API_BASE_URL}/api/clients/user/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    let user = await response.json();
    user.dob = new Date(user.dob); // convert dob string to Date object
    setLoading(false);
    return user;
  }

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDetails = await getUserDetails(token);
        setUser(userDetails);
        if (!editedUser.email) {
          setEditedUser(userDetails);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setErrorMessage(error.message); // Add this line
      }
    };

    if (token) {
      fetchUser();
    }
  }, [token]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedUser(user);
    }
    setIsEditing(!isEditing);
  };

  const validateFields = () => {
    // Check if all fields are filled
    if (
      !editedUser.email ||
      !editedUser.name ||
      !editedUser.last_name ||
      !editedUser.username ||
      !editedUser.dob
    ) {
      setValidationError("All fields must be filled");
      return false;
    }

    // Check if email is correctly formatted
    const re = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!re.test(String(editedUser.email).toLowerCase())) {
      setValidationError("Invalid email format");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateFields()) {
      return;
    }

    // Before sending, convert dob to simplified date string
    let formattedUser = { ...editedUser };
    if (formattedUser.dob instanceof Date) {
      formattedUser.dob = formattedUser.dob.toISOString().split("T")[0];
    }

    const url = `${API_BASE_URL}/api/clients/update/`;

    fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedUser),
    })
      .then(async (response) => {
        if (response.ok) {
          return response.json();
        } else {
          const data = await response.json();
          const errorMessages = Object.values(data);
          let errorMessage = "";
          errorMessages.forEach((err) => {
            errorMessage += `${err}\n`;
          });
          throw new Error(errorMessage);
        }
      })
      .then((data) => {
        data.dob = new Date(data.dob);
        setUser(data);
        setIsEditing(false);
        Alert.alert("Success", "User information updated successfully!");
      })
      .catch((error) => {
        console.error("Error:", error);
        setErrorMessage(error.message);
        Alert.alert("Error", "Failed to update user information");
      });
  };

  const handleDateChange = (event, selectedDate) => {
    setDatePickerShow(false);
    if (selectedDate) {
      const currentDate = selectedDate || editedUser.dob || new Date();
      setEditedUser({ ...editedUser, dob: currentDate });
    }
  };

  const resetPassword = async () => {
    // Reset password functionality goes here
    const response = await fetch(
      `${API_BASE_URL}/api/clients/reset-password/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: editedUser.email,
        }),
      }
    );

    if (response.ok) {
      setShowBanner(true);
      return await response.json();
    } else {
      throw new Error("Password reset failed. Please try again.");
    }
  };

  const handleBannerAnimationEnd = () => {
    setShowBanner(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && ( // New loading indicator here
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      <Header title="Virtual Q." />
      <Text style={styles.subHeader}>User Information</Text>
      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      <ScrollView>
        <View style={styles.infoContainer}>
          {showBanner && (
            <SuccessBanner
              onAnimationEnd={handleBannerAnimationEnd}
              message="Email has been sent to your address"
            />
          )}
          {validationError && (
            <Text style={styles.errorText}>{validationError}</Text>
          )}

          {Object.keys(user).map((key) => {
            if (key in fieldNames) {
              if (key === "dob") {
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.inputContainer}
                    onPress={() => isEditing && setDatePickerShow(true)}
                  >
                    <Text style={styles.infoLabel}>Date of Birth:</Text>
                    <Text
                      style={[
                        styles.infoInput,
                        isEditing && styles.editableInput,
                      ]}
                    >
                      {editedUser.dob
                        ? editedUser.dob.toISOString().slice(0, 10)
                        : ""}
                    </Text>
                    {datePickerShow && (
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={editedUser.dob}
                        mode={"date"}
                        is24Hour={true}
                        display="default"
                        onChange={handleDateChange}
                      />
                    )}
                  </TouchableOpacity>
                );
              } else {
                return (
                  <View key={key} style={styles.inputContainer}>
                    <Text style={styles.infoLabel}>{fieldNames[key]}</Text>
                    <TextInput
                      style={[
                        styles.infoInput,
                        isEditing && styles.editableInput,
                      ]}
                      value={editedUser[key]}
                      onChangeText={(newValue) =>
                        setEditedUser({ ...editedUser, [key]: newValue })
                      }
                      editable={isEditing}
                      maxLength={
                        key === "first_name" || key === "last_name"
                          ? 45
                          : key === "username"
                          ? 30
                          : 254
                      }
                    />
                  </View>
                );
              }
            }
          })}
          {isEditing && (
            <TouchableOpacity
              style={styles.resetPasswordButton}
              onPress={resetPassword}
            >
              <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
          )}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={isEditing ? styles.revertButton : styles.editButton}
              onPress={handleEditToggle}
            >
              <Text style={styles.buttonText}>
                {isEditing ? "✖ Revert" : "Edit Profile"}
              </Text>
            </TouchableOpacity>
            {isEditing && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveChanges}
              >
                <Text style={styles.buttonText}>✔ Apply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    flex: 1,
  },
  subHeader: {
    fontSize: 24,
    textAlign: "left",
    margin: 10,
    color: "black",
  },
  infoContainer: {
    padding: 20,
    backgroundColor: "white",
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  infoLabel: {
    fontSize: 18,
  },
  infoInput: {
    fontSize: 18,
    borderColor: "#999",
    borderWidth: 0,
    padding: 5,
  },
  editableInput: {
    borderBottomWidth: 1,
  },
  resetPasswordButton: {
    backgroundColor: "#999",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  editButton: {
    backgroundColor: "#1175c2",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  revertButton: {
    backgroundColor: "#FF0000",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: "#008000",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
  },
  divider: {
    height: 2,
    backgroundColor: "#999",
  },
  loadingContainer: {
    // New style here
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgb(255, 255, 255)",
    zIndex: 9999, // add this line
  },
});

export default UserInfoScreen;
