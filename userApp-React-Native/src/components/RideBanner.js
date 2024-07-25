import React, { useContext } from "react";
import {
  Alert,
  Button,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faWheelchair,
  faVolumeUp,
  faCheck,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import AuthContext from "../AuthContext";

const RideBanner = ({
  ride,
  handleAddToVisit,
  handleRemoveFromVisit,
  navigation,
}) => {
  const { loggedIn } = useContext(AuthContext);
  const {
    ride_name,
    ride_thumbnail,
    ride_type,
    area_name,
    accessibility_wheelchair_access,
    accessibility_audio_description,
    accessibility_other,
    addedToVisit,
  } = ride;

  const handlePress = () => {
    if (!loggedIn) {
      Alert.alert("You need to be logged in to use this feature.");
      return;
    }

    if (addedToVisit) {
      handleRemoveFromVisit(ride);
    } else {
      handleAddToVisit(ride);
    }
  };

  const handleNavigateToMap = () => {
    // Navigate to MapNavigationScreen with ride id
    navigation.navigate("MapNavigationScreen", { rideId: ride.ride_id });
  };

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("RideDetailScreen", { ride })}
      activeOpacity={1}
    >
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: ride_thumbnail }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.mapIconContainer}
            onPress={handleNavigateToMap}
          >
            <FontAwesomeIcon icon={faMapMarkerAlt} size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{ride_name}</Text>
          </View>

          <Text>Park Area: {area_name}</Text>
          <Text>Ride Type: {ride_type}</Text>

          <View style={styles.accessibilityContainer}>
            {accessibility_wheelchair_access && (
              <FontAwesomeIcon
                icon={faWheelchair}
                size={20}
                color="green"
                style={styles.icon}
              />
            )}
            {accessibility_audio_description && (
              <FontAwesomeIcon
                icon={faVolumeUp}
                size={20}
                color="green"
                style={styles.icon}
              />
            )}
            {accessibility_other && (
              <FontAwesomeIcon
                icon={faCheck}
                size={20}
                color="green"
                style={styles.icon}
              />
            )}

            <View style={styles.buttonContainer}>
              <Button
                title={
                  addedToVisit ? "Remove from My Visit" : "Add to My Visit"
                }
                onPress={handlePress}
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#ffff",
  },
  image: {
    width: "100%",
    aspectRatio: 1, // You can adjust this according to your needs
  },
  details: {
    marginLeft: 10,
    width: "60%",
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  imageContainer: {
    position: "relative",
    width: "40%",
  },
  mapIconContainer: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 50,
    padding: 5,
  },
  accessibilityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  icon: {
    marginRight: 5,
  },
});

export default RideBanner;
