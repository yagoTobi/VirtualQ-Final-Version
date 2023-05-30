import React, { useContext } from "react";
import {
  View,
  SafeAreaView,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";

import AuthContext from "../AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GridPanel from "../components/GridPanel";
import { Icon } from "react-native-elements";

const UserScreen = ({ navigation }) => {
  const [scrollY, setScrollY] = React.useState(new Animated.Value(0));
  const { token } = useContext(AuthContext);
  const panelData = [
    {
      title: "My profile",
      iconName: "user",
      iconSet: "FontAwesome",
      link: "UserInfoScreen",
    },
    {
      title: "My group",
      iconName: "users",
      iconSet: "FontAwesome",
      link: "GuestInformationScreen",
    },
    {
      title: "My visit",
      iconName: "calendar",
      iconSet: "FontAwesome",
      link: "Visit",
    },
    {
      title: "My Virtual Q Ride Reservations",
      iconName: "timer",
      iconSet: "MaterialIcons",
      link: "ReservationHubScreen",
    },
    {
      title: "Suggested itinerary",
      iconName: "map",
      iconSet: "FontAwesome",
      link: "Itinerary",
    },
    {
      title: "Shops",
      iconName: "shopping-bag",
      iconSet: "FontAwesome",
      link: "Shops",
    },
    {
      title: "Restaurants",
      iconName: "cutlery",
      iconSet: "FontAwesome",
      link: "Restaurants",
    },
    {
      title: "Q&A",
      iconName: "question",
      iconSet: "FontAwesome",
      link: "QandA",
    },
  ];

  const handleNavigation = (link) => {
    if (
      (link === "UserInfoScreen" ||
        link === "GuestInformationScreen" ||
        link === "TicketHubScreen") &&
      !token
    ) {
      // alert("You need to log in to access this page!");
      navigation.navigate("LogInScreen");
    } else {
      navigation.navigate(link);
    }
  };

  const backgroundColor = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ["transparent", "#1175c2"],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Virtual Q." />
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <ImageBackground
          source={{
            uri: "https://res.klook.com/image/upload/q_85/c_fill,w_750/v1671617310/blog/ubew7wfrsmlhdvys7r2h.jpg",
          }}
          style={styles.image}
        >
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor }]}
          />
          <Text style={styles.imageText}>Welcome to the park!</Text>

          <TouchableOpacity
            style={styles.ticketIconContainer}
            onPress={() => {
              if (token) {
                navigation.navigate("TicketHubScreen");
              } else {
                navigation.navigate("LogInScreen");
              }
            }}
          >
            <Icon name="ticket" type="font-awesome" color="#1175c2" />
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.grid}>
          {panelData.map((panel, index) => (
            <GridPanel
              key={index}
              iconName={panel.iconName}
              iconSet={panel.iconSet}
              title={panel.title}
              onPress={() => handleNavigation(panel.link)}
            />
          ))}
        </View>
      </Animated.ScrollView>
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1175c2",
  },
  image: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.2,
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    color: "white",
    fontSize: 24,
    textShadowColor: "rgba(0, 0, 0, 0.70)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "stretch",
    padding: 10,
  },
  ticketIconContainer: {
    position: "absolute",
    bottom: 15,
    right: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});

export default UserScreen;
