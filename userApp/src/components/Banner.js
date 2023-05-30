import React from "react";
import { Animated, Easing, StyleSheet } from "react-native";

class Banner extends React.Component {
  constructor(props) {
    super(props);

    this.scaleValue = new Animated.Value(0);
  }

  componentDidMount() {
    this.animateBanner();
  }

  animateBanner() {
    this.scaleValue.setValue(0);
    Animated.timing(this.scaleValue, {
      toValue: 1,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }

  render() {
    const scale = this.scaleValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.02, 1],
    });

    const animatedStyle = {
      transform: [{ scale }],
      elevation: 5, // Android shadow
      shadowColor: "#000", // iOS shadow
      shadowOffset: { width: 0, height: 2 }, // iOS shadow
      shadowOpacity: 0.25, // iOS shadow
      shadowRadius: 3.84, // iOS shadow
    };

    return (
      <Animated.View style={[styles.banner, this.props.style, animatedStyle]}>
        {this.props.children}
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  banner: {
    width: "90%",
    borderRadius: 10,
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
  },
});

export default Banner;
