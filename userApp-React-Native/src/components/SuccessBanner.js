import React from "react";
import { Text, StyleSheet } from "react-native";
import * as Animatable from "react-native-animatable";

const SuccessBanner = ({ onAnimationEnd, message }) => {
  return (
    <Animatable.View
      animation="fadeInDown"
      duration={1000}
      style={styles.banner}
      onAnimationEnd={onAnimationEnd}
    >
      <Animatable.Text animation="bounceIn" duration={1500} style={styles.text}>
        ✔
      </Animatable.Text>
      <Text style={styles.text}>{message}</Text>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "green",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  text: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 5,
  },
});

export default SuccessBanner;
