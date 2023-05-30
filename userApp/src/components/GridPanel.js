import React from "react";
import { Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Feather from "react-native-vector-icons/Feather";

const { width } = Dimensions.get("window");

const GridPanel = ({ iconName, iconSet, title, onPress }) => {
  let IconComponent;
  switch (iconSet) {
    case "FontAwesome":
      IconComponent = FontAwesome;
      break;
    case "FontAwesome5":
      IconComponent = FontAwesome5;
      break;
    case "MaterialIcons":
      IconComponent = MaterialIcons;
      break;
    case "Feather":
      IconComponent = Feather;
      break;
    default:
      IconComponent = FontAwesome;
  }

  return (
    <TouchableOpacity style={styles.panel} onPress={onPress}>
      <IconComponent name={iconName} size={30} />
      <Text style={styles.panelText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "46%",
    height: width * 0.35,
    justifyContent: "center",
    alignItems: "center",
    margin: "2%",
  },
  panelText: {
    marginTop: 10,
  },
});

export default GridPanel;
