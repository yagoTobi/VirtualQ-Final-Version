import React, { useState, useEffect, useContext } from "react";
import { Text, View, StyleSheet, Dimensions, Button } from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthContext from "../AuthContext";
import { API_BASE_URL } from "../constants";

const WINDOW_HEIGHT = Dimensions.get("window").height;
const WINDOW_WIDTH = Dimensions.get("window").width;
const SCAN_WINDOW_SIZE = WINDOW_WIDTH * 0.6;

const TicketScanScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [user, setUser] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userDetails = await getUserDetails(token);
        setUser(userDetails);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    if (token) {
      fetchUser();
    }
  }, [token]);

  async function getUserDetails(token) {
    const response = await fetch(`${API_BASE_URL}/api/clients/user/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });
    console.log(response);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    let user = await response.json();
    return user;
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    console.log(data);
    // Make a POST request to your TicketValidationView
    const response = await fetch(`${API_BASE_URL}/api/tickets/validate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        ticket_id: data,
        user: user,
      }),
    });

    const responseData = await response.json();

    if (response.ok) {
      alert(`Ticket is valid!`);
    } else {
      alert(`Invalid ticket: ${responseData.message}`);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Header title="Virtual Q." />
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.buttonView}>
          {scanned && (
            <Button
              title="Tap to Scan Again"
              onPress={() => setScanned(false)}
            />
          )}
        </View>
        <Text style={styles.scanText}>Please scan your ticket</Text>
        <View style={styles.frame} />
      </View>
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  buttonView: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  scannerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  scanText: {
    position: "absolute",
    top: "20%",
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  frame: {
    position: "absolute",
    width: SCAN_WINDOW_SIZE,
    height: SCAN_WINDOW_SIZE,
    borderWidth: 5,
    borderColor: "white",
    borderStyle: "dashed",
    borderRadius: 10,
  },
});

export default TicketScanScreen;
