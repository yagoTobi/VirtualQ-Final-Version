import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const PillButton = ({ onPress, children }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{children}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: "45%",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 20, // This will create the pill shape
    borderWidth: 1, // Add a black outline
    borderColor: "black",
  },
  buttonText: {
    fontSize: 12,
    color: "black",
  },
});

export default PillButton;
