import React, { useState, useContext } from "react";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";

import AuthContext from "../AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AccessibilityInfo from "../components/AccesibilityInfo";

import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Feather from "react-native-vector-icons/Feather";

const RideDetailScreen = ({ route, navigation }) => {
  const { ride } = route.params;
  const { token } = useContext(AuthContext);
  const [starColor, setStarColor] = useState("white");

  const toggleStarColor = () => {
    setStarColor((prevColor) => {
      if (prevColor === "white") {
        return "#f5d742";
      } else {
        return "white";
      }
    });
  };

  const getHeightRestrictionMessage = () => {
    if (ride.height_restriction === 0) {
      return "Guests can be any height";
    } else {
      // Assuming min_height is in cm
      const minHeightInInches = Math.round(ride.height_restriction * 0.393701); // convert cm to inches
      return `Guests must be ${ride.height_restriction}cm (${minHeightInInches} in) or taller`;
    }
  };

  const openingHour = ride.opening_hour.slice(0, -3);
  const closingHour = ride.closing_hour.slice(0, -3);

  const handleBooking = () => {
    if (token) {
      navigation.navigate("RideReservationScreen", { ride: ride });
    } else {
      Alert.alert("You must be logged in first!");
      navigation.navigate("LogInScreen");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Virtual Q." />

      {/* Ride Image */}
      <View style={styles.imageContainer}>
        <Image style={styles.rideImage} source={{ uri: ride.ride_thumbnail }} />
        {ride.under_maintenance ? (
          <View style={styles.rideImageOverlay} />
        ) : null}
        <View style={styles.imageOverlay}>
          <View>
            {ride.under_maintenance && (
              <View style={styles.maintenanceBanner}>
                <Text style={styles.maintenanceText}>Under Maintenance</Text>
              </View>
            )}
            <Text style={styles.title}>{ride.ride_name}</Text>
            <Text style={styles.tagline}>{ride.ride_type}</Text>
          </View>
          <View style={styles.iconContainer}>
            <TouchableOpacity onPress={toggleStarColor}>
              <FontAwesome name="star" size={30} color={starColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapIcon}
              onPress={() => navigation.navigate("MapScreen")}
            >
              <FontAwesome name="map-marker" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Ride description */}
        <View style={styles.banner}>
          <Text style={styles.descriptionTitle}>About the ride: </Text>
          <Text style={styles.bannerText}>{ride.ride_description}</Text>
        </View>

        {/* Height Restriction */}
        <View style={styles.bannerFlow}>
          <MaterialIcons name="person" size={24} color="black" />
          <Text style={styles.bannerText}>{getHeightRestrictionMessage()}</Text>
        </View>
        {/* Age Limit */}
        <View style={styles.banner}>
          <Text style={styles.bannerTextBold}>Age Group Recommendation: </Text>
          <Text style={styles.bannerText}>{ride.age_restriction} and up</Text>
        </View>

        {/*Accesibility Info*/}
        <AccessibilityInfo ride={ride} />

        {/* Opening Hours */}
        <View style={styles.bannerFlow}>
          <Feather name="clock" size={24} color="black" />
          <Text style={styles.bannerText}>
            <Text style={styles.bannerTextBold}>Opening Hours: </Text>
            {openingHour} - {closingHour}
          </Text>
        </View>

        <TouchableOpacity style={styles.bookingBanner} onPress={handleBooking}>
          <FontAwesome5 name="mobile-alt" size={30} color="white" />
          <Text style={styles.virtualQBannerText}>
            Book your spot now with Virtual Q!
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Fixed footer */}
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  imageContainer: {
    width: "100%",
    height: Dimensions.get("window").height * 0.3, // 30% of screen height
    position: "relative",
  },
  rideImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.7,
  },
  rideImageOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "black",
    opacity: 0.6, // adjust this as needed
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapIcon: {
    marginLeft: 10,
  },
  banner: {
    flexDirection: "column",
    alignItems: "flex-start",
    backgroundColor: "#F9F9F9",
    padding: 10,
    marginVertical: 5,
  },
  bannerFlow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9F9F9",
    padding: 10,
    marginVertical: 5,
  },
  bannerText: {
    fontSize: 18,
    marginLeft: 10,
  },
  bannerTextBold: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  bookingBanner: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E90FF",
    padding: 20,
    marginVertical: 5,
    borderRadius: 10,
  },
  virtualQBannerText: {
    fontSize: 26,
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },
  maintenanceBanner: {
    backgroundColor: "yellow",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 5,
  },
  maintenanceText: {
    backgroundColor: "yellow",
    color: "black",
    fontWeight: "bold",
  },
});

export default RideDetailScreen;
