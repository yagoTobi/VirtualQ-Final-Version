// AppNavigator.js
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { LogBox } from "react-native";
import * as Notifications from "expo-notifications";

LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
]);

import HomeScreen from "./HomeScreen.js";
import LogInScreen from "./LogInScreen.js";
import SignUpScreen from "./SignUpScreen.js";
import RidesListScreen from "./RidesListScreen.js";
import ResetPasswordRequestScreen from "./ResetPasswordRequestScreen.js";
import RideDetailScreen from "./RideDetailScreen.js";
import UserScreen from "./UserScreen.js";
import UserInfoScreen from "./UserInfoScreen.js";
import TicketScanScreen from "./TicketScanScreen.js";
import TicketHubScreen from "./TicketHubScreen.js";
import GuestInformationScreen from "./GuestInformationScreen.js";
import SearchScreen from "./SearchScreen.js";
import RideReservationScreen from "./RideReservationScreen.js";
import ReservationHubScreen from "./ReservationHubScreen.js";

const Stack = createStackNavigator();

const AppNavigator = () => {
  useEffect(() => {
    // This function asks for permission to send notifications.
    const askForPermission = async () => {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        return;
      }
      const token = (await Notifications.getExpoPushTokenAsync()).data;
    };
    askForPermission();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false, animationEnabled: false }}
      >
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="LogInScreen" component={LogInScreen} />
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        <Stack.Screen name="RidesListScreen" component={RidesListScreen} />
        <Stack.Screen
          name="ResetPasswordRequestScreen"
          component={ResetPasswordRequestScreen}
        />
        <Stack.Screen name="RideDetailScreen" component={RideDetailScreen} />
        <Stack.Screen name="UserScreen" component={UserScreen} />
        <Stack.Screen name="UserInfoScreen" component={UserInfoScreen} />
        <Stack.Screen name="TicketScanScreen" component={TicketScanScreen} />
        <Stack.Screen name="TicketHubScreen" component={TicketHubScreen} />
        <Stack.Screen
          name="GuestInformationScreen"
          component={GuestInformationScreen}
        />
        <Stack.Screen name="SearchScreen" component={SearchScreen} />
        <Stack.Screen
          name="RideReservationScreen"
          component={RideReservationScreen}
        />
        <Stack.Screen
          name="ReservationHubScreen"
          component={ReservationHubScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
