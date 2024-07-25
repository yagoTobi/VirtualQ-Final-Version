import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Swipeable from "react-native-swipe-gestures";
import { format } from "date-fns";
import { API_BASE_URL } from "../constants";
import { Dimensions } from "react-native";

const ReservationBanner = ({ reservation, onCancel, onPress }) => {
  const { date, start_time, ride } = reservation;
  const [rideInfo, setRideInfo] = useState({});

  useEffect(() => {
    const fetchRideInfo = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/parkRides/theme_park_rides/${ride}`
        );
        const data = await response.json();
        setRideInfo(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRideInfo();
  }, [ride]);

  const handleCancel = () => {
    Alert.alert(
      "Cancel Reservation",
      "Are you sure that you would like to cancel your reservation?",
      [
        {
          text: "Yes",
          onPress: () => onCancel(reservation),
        },
        {
          text: "No",
          style: "cancel",
        },
      ]
    );
  };

  const config = {
    velocityThreshold: 0.3,
    directionalOffsetThreshold: 80,
  };

  const renderSwipeLeftContent = () => (
    <View style={styles.leftSwipeItem}>
      <Text style={styles.cancelText}>X</Text>
    </View>
  );

  return (
    <Swipeable
      onSwipeLeft={handleCancel}
      renderLeftActions={renderSwipeLeftContent}
      config={config}
    >
      <TouchableOpacity onPress={onPress} style={styles.bannerContainer}>
        <ImageBackground
          style={styles.bannerImage}
          source={{ uri: rideInfo.ride_thumbnail }}
        >
          <View style={styles.textOverlay}>
            <Text style={styles.bannerText}>
              {rideInfo.ride_name} @ {start_time} -{" "}
              {format(new Date(date), "yyyy-MM-dd")}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  cancelText: {
    fontSize: 30,
    color: "red",
  },
  bannerContainer: {
    width: "90%",
    borderRadius: 5,
    overflow: "hidden",
    alignSelf: "center", // To center the container
    marginTop: 10, // To add top margin
    marginBottom: 10, // To add bottom margin
  },
  bannerImage: {
    width: "100%",
    height: 200,
  },
  bannerText: {
    position: "absolute",
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    width: "100%",
    textAlign: "center",
  },
  leftSwipeItem: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "transparent",
  },
  cancelText: {
    fontSize: 30,
    color: "red",
  },
  textOverlay: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerText: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
  },
});

export default ReservationBanner;
