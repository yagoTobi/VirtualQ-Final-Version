import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Feather from "react-native-vector-icons/Feather";

const AccessibilityInfo = ({ ride }) => {
  const [isVisible, setIsVisible] = useState(false);

  const AccessibilityOption = ({ title, isAvailable }) => (
    <View style={styles.option}>
      <MaterialIcons
        name={isAvailable ? "check-box" : "check-box-outline-blank"}
        size={24}
        color="black"
      />
      <Text style={styles.optionText}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setIsVisible(!isVisible)}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Accessibility:</Text>
          <FontAwesome
            name={isVisible ? "angle-up" : "angle-down"}
            size={24}
            color="black"
          />
        </View>
      </TouchableOpacity>
      {isVisible && (
        <>
          <AccessibilityOption
            title="Wheelchair Access"
            isAvailable={ride.accessibility_wheelchair_access}
          />
          <AccessibilityOption
            title="Audio Description"
            isAvailable={ride.accessibility_audio_description}
          />
          <AccessibilityOption
            title="Braille"
            isAvailable={ride.accessibility_braille}
          />
          <AccessibilityOption
            title="Sign Language"
            isAvailable={ride.accessibility_sign_language}
          />
          <AccessibilityOption
            title="Closed Captioning"
            isAvailable={ride.accessibility_closed_captioning}
          />
          <AccessibilityOption
            title="Tactile Path"
            isAvailable={ride.accessibility_tactile_path}
          />
          <AccessibilityOption
            title="Other Accessibility"
            isAvailable={ride.accessibility_other}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    backgroundColor: "#F9F9F9",
    alignItems: "flex-start",
    flexDirection: "column",
    alignItems: "flex-start",
    backgroundColor: "#F9F9F9",
    padding: 10,
    marginVertical: 5,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default AccessibilityInfo;
