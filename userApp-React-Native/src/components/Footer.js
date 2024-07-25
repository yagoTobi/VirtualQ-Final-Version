// Footer.js
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const FooterButton = ({ iconName, onPress }) => (
  <TouchableOpacity style={styles.footerButton} onPress={onPress}>
    <FontAwesome name={iconName} size={24} color="white" />
  </TouchableOpacity>
);

const Footer = ({ navigation }) => (
  <View style={styles.footer}>
    <FooterButton
      iconName="home"
      onPress={() => navigation.navigate("HomeScreen")}
    />
    <FooterButton
      iconName="map-marker"
      onPress={() => console.log("Location")}
    />
    <FooterButton
      iconName="list"
      onPress={() => navigation.navigate("RidesListScreen")}
    />
    <FooterButton
      iconName="search"
      onPress={() => navigation.navigate("SearchScreen")}
    />
    <FooterButton
      iconName="user"
      onPress={() => navigation.navigate("UserScreen")}
    />
  </View>
);

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    height: 50,
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#1175c2",
  },
  footerButton: {
    alignItems: "center",
  },
  footerButtonText: {
    color: "white",
    fontSize: 14,
  },
});

export default Footer;
