import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from "react-native";
import AuthContext from "../AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "react-native-modal";
import { API_BASE_URL } from "../constants";
import { ScrollView } from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";

const GuestInformationScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);
  const [guests, setGuests] = useState([]);
  const [editGuests, setEditGuests] = useState({}); // TODO No entiendo porque esto
  const [editMode, setEditMode] = useState(false); //TODO No entiendo porque
  const [selectedGuest, setSelectedGuest] = useState(null); //TODO ???

  const [avatarUrls, setAvatarUrls] = useState({});
  const [avatarNames, setAvatarNames] = useState(null);
  const [chosenAvatars, setChosenAvatars] = useState({});

  const [isModalVisible, setModalVisible] = useState(false);

  // useEffect hook runs the fetchGuests function every time the component mounts
  useEffect(() => {
    fetchGuests();
    fetchAvatarUrls();
  }, []);

  useEffect(() => {
    if (chosenAvatars[selectedGuest]) {
      handleInputChange(selectedGuest, "picture", chosenAvatars[selectedGuest]);
    }
  }, [chosenAvatars, selectedGuest]);

  const fetchAvatarUrls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tickets/avatar_urls/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch avatar urls");
      }

      const data = await response.json();
      setAvatarUrls(data);

      const avatarNamesMapping = {}; //TODO check functionality
      for (const avatarName in data) {
        avatarNamesMapping[data[avatarName]] = avatarName;
      }
      setAvatarNames(avatarNamesMapping);
    } catch (error) {
      console.error(error);
    }
  };

  //DONE fetchGuests function retrieves guests data from the API
  const fetchGuests = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/tickets/guests/guests/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch guests");
      }

      const data = await response.json();
      const groupedData = data.reduce((grouped, guest) => {
        const date = new Date(guest.date_of_visit).toDateString();
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(guest);

        // Load each guest's avatar if it's available
        if (guest.picture) {
          setChosenAvatars((prev) => ({
            ...prev,
            [guest.guest_id]: guest.picture,
          }));
        }

        return grouped;
      }, {});
      setGuests(groupedData);
    } catch (error) {
      console.error(error);
    }
  };

  // updateGuestInfo function updates guest information in the API
  //TODO Why don't I just patch the image info here? Seems a lot more simple
  const updateGuestInfo = async () => {
    for (const [guestId, guestInfo] of Object.entries(editGuests)) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/tickets/guests/guests/${guestId}/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
            body: JSON.stringify({
              ...guestInfo,
              picture: chosenAvatars[guestId] || null, // Patch the avatar to the server
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update guest info");
        }
      } catch (error) {
        console.error(error);
      }
    }

    fetchGuests();
  };

  // handleInputChange function updates the local guest object being edited
  const handleInputChange = (guestId, field, value) => {
    if (field === "picture") {
      value = chosenAvatars[guestId] || value; // Use avatar name instead of URL
    }

    setEditGuests({
      ...editGuests,
      [guestId]: { ...editGuests[guestId], [field]: value },
    });
  };

  // toggleEditMode function switches the app between edit mode and view mode
  const toggleEditMode = () => {
    if (editMode) {
      updateGuestInfo();
    }

    setEditMode(!editMode);
  };

  // revertChanges function reverts any changes made during edit mode
  const revertChanges = () => {
    setEditGuests({});
    setEditMode(false);
  };

  const toggleIconModal = () => {
    setModalVisible(!isModalVisible);

    if (chosenAvatars[selectedGuest]) {
      handleInputChange(selectedGuest, "picture", chosenAvatars[selectedGuest]);
    }
  };

  const handleAvatarChange = (iconUrl) => {
    setChosenAvatars((prev) => ({
      ...prev,
      [selectedGuest]: avatarNames[iconUrl],
    }));
  };

  return (
    <View style={styles.container}>
      <Header title="Virtual Q." />
      <View style={styles.buttonContainer}>
        {editMode ? (
          <>
            <TouchableOpacity
              style={styles.revertButton}
              onPress={revertChanges}
            >
              <Text style={styles.revertButtonText}>✖ Revert Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={toggleEditMode}
            >
              <Text style={styles.saveButtonText}>✔ Apply Changes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={toggleEditMode}>
            <Text style={styles.editButtonText}>Edit Guests</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView>
        {Object.entries(guests)
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))
          .map(([date, guests]) => (
            <View key={date}>
              <Text style={styles.dateText}>{date}</Text>
              {guests.map((guest, index) => {
                const editableItem = editGuests[guest.guest_id]
                  ? { ...guest, ...editGuests[guest.guest_id] }
                  : guest;
                return (
                  <View key={index} style={styles.guestContainer}>
                    <Text style={styles.guestNumber}>
                      Additional Visitor {index + 1}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center", // Align children vertically center
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Left-side container */}
                      <View style={{ flex: 3 }}>
                        {editMode ? (
                          <>
                            <Text>Please insert name</Text>
                            <TextInput
                              value={editableItem.name || ""}
                              placeholder="Name"
                              onChangeText={(text) =>
                                handleInputChange(
                                  editableItem.guest_id,
                                  "name",
                                  text
                                )
                              }
                              style={styles.nameInput}
                            />
                            <Text>Please insert age</Text>
                            <Picker
                              selectedValue={editableItem.age || 0}
                              onValueChange={(value) =>
                                handleInputChange(
                                  editableItem.guest_id,
                                  "age",
                                  value
                                )
                              }
                              style={styles.agePicker}
                            >
                              {[...Array(100).keys()].map((_, i) => (
                                <Picker.Item
                                  key={i}
                                  label={i.toString()}
                                  value={i}
                                />
                              ))}
                            </Picker>
                            <Text>Please insert height</Text>
                            <TextInput
                              value={
                                typeof editableItem.height === "number"
                                  ? editableItem.height.toString()
                                  : ""
                              }
                              placeholder="Height"
                              onChangeText={(text) =>
                                handleInputChange(
                                  editableItem.guest_id,
                                  "height",
                                  text ? parseInt(text) : null
                                )
                              }
                              keyboardType="numeric"
                              style={styles.heightInput}
                            />
                          </>
                        ) : (
                          <>
                            <Text>Name: {editableItem.name || "N/A"}</Text>
                            <Text>Age: {editableItem.age || "N/A"}</Text>
                            <Text>Height: {editableItem.height || "N/A"}</Text>
                          </>
                        )}
                      </View>
                      {/* Right-side container */}
                      <View style={{ flex: 1, alignItems: "center" }}>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedGuest(guest.guest_id);
                            toggleIconModal();
                          }}
                          disabled={!editMode} // Button will be disabled in non-edit mode
                        >
                          {chosenAvatars[guest.guest_id] ? (
                            <Image
                              source={{
                                uri: avatarUrls[chosenAvatars[guest.guest_id]],
                              }}
                              style={styles.chooseImageButton}
                            />
                          ) : (
                            <Text
                              style={[
                                styles.chooseImageButton,
                                { textAlign: "center" },
                              ]}
                            >
                              {editMode ? "Choose Image" : "No Image"}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
      </ScrollView>
      <Modal
        isVisible={isModalVisible}
        backdropColor={"black"}
        backdropOpacity={0.5}
        onBackdropPress={toggleIconModal}
      >
        <View style={styles.modalContent}>
          <Text>Please select your profile icon</Text>
          <View style={styles.iconGrid}>
            {avatarUrls &&
              Object.entries(avatarUrls).map(([name, url]) => (
                <TouchableOpacity
                  key={name}
                  onPress={() => {
                    handleAvatarChange(url);
                    toggleIconModal();
                  }}
                >
                  <Image source={{ uri: url }} style={styles.userIcon} />
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </Modal>
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1175c2",
  },
  guestContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    marginHorizontal: 3,
    marginVertical: 5,
    borderRadius: 10,
  },

  agePicker: {
    flex: 1,
  },
  heightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    paddingHorizontal: 5,
  },
  editButton: {
    padding: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    marginVertical: 10,
  },
  editButtonText: {
    color: "#1175c2",
    fontSize: 18,
  },
  dateText: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 10,
  },
  guestNumber: {
    fontSize: 16,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "green",
    borderRadius: 5,
  },
  saveButtonText: {
    marginLeft: 10,
    color: "white",
    fontSize: 18,
  },
  revertButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "red",
    borderRadius: 5,
  },
  revertButtonText: {
    marginLeft: 10,
    color: "white",
    fontSize: 18,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  userIcon: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  chooseImageButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: "#000",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around", // This line helps in even spacing
  },
  modalContent: {
    backgroundColor: "white",
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

export default GuestInformationScreen;
