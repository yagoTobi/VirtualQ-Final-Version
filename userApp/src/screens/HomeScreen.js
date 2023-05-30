import React, { useContext } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
} from "react-native";

import AuthContext from "../AuthContext";
import Banner from "../components/Banner";
import PillButton from "../components/PillButton";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HomeScreen({ navigation }) {
  const { loggedIn } = useContext(AuthContext);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Virtual Q." />

      {/* Scrollable content area */}
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          style={styles.headerImg}
          source={{
            uri: "https://res.klook.com/image/upload/q_85/c_fill,w_750/v1671617310/blog/ubew7wfrsmlhdvys7r2h.jpg",
          }}
        />
        {/* Banner 1 */}
        {!loggedIn && (
          <Banner style={styles.banner1}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.banner1Header}>Mi cuenta Virtual Q</Text>
              <Text style={styles.banner1Text}>
                Log in or sign up in order to stay up to date for any special
                offers, to improve your day at the theme park and more!
              </Text>
              <View style={styles.buttonContainer}>
                <PillButton
                  onPress={() =>
                    navigation.navigate("LogInScreen", { loggedIn })
                  }
                >
                  Log In
                </PillButton>

                <PillButton onPress={() => navigation.navigate("SignUpScreen")}>
                  Sign Up
                </PillButton>
              </View>
            </View>
          </Banner>
        )}

        {/* Banner 2 */}
        <Banner style={styles.banner2}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.banner2Header}>
              Save time through Virtual Q!
            </Text>
            <Text style={styles.banner2Text}>
              With our new Virtual Q technology you will be able to save time on
              your visit, letting you explore the park throughout your day and
              keep happy smiles!
            </Text>
          </View>
          {/* Add your image component here */}
        </Banner>

        {/*Test Banner 3 */}
        <Banner style={styles.banner1}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.banner1Header}>Mi cuenta Virtual Q</Text>
            <Text style={styles.banner1Text}>
              Inicie su sesión o creese una cuenta para estar actualizado sobre
              ofertas especiales, su estancia del parque y más...
            </Text>
            <View style={styles.buttonContainer}>
              <PillButton onPress={() => console.log("Iniciar Sesión")}>
                Iniciar Sesión
              </PillButton>
              <PillButton onPress={() => console.log("Crear Cuenta")}>
                Crear Cuenta
              </PillButton>
            </View>
          </View>
        </Banner>

        {/*Test Banner 4*/}
        <Banner style={styles.banner1}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.banner1Header}>Mi cuenta Virtual Q</Text>
            <Text style={styles.banner1Text}>
              Inicie su sesión o creese una cuenta para estar actualizado sobre
              ofertas especiales, su estancia del parque y más...
            </Text>
            <View style={styles.buttonContainer}>
              <PillButton onPress={() => console.log("Iniciar Sesión")}>
                Iniciar Sesión
              </PillButton>
              <PillButton onPress={() => console.log("Crear Cuenta")}>
                Crear Cuenta
              </PillButton>
            </View>
          </View>
        </Banner>

        {/* Banner 2 */}
        <Banner style={styles.banner2}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.banner2Header}>
              Save time through Virtual Q!
            </Text>
            <Text style={styles.banner2Text}>
              With our new Virtual Q technology you will be able to save time on
              your visit, letting you explore the park throughout your day and
              keep happy smiles!
            </Text>
          </View>
          {/* Add your image component here */}
        </Banner>

        {/* Banner 2 */}
        <Banner style={styles.banner2}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.banner2Header}>
              Save time through Virtual Q!
            </Text>
            <Text style={styles.banner2Text}>
              With our new Virtual Q technology you will be able to save time on
              your visit, letting you explore the park throughout your day and
              keep happy smiles!
            </Text>
          </View>
          {/* Add your image component here */}
        </Banner>
      </ScrollView>

      {/* Fixed footer */}
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImg: {
    width: "100%",
    height: "30%",
  },
  container: {
    flex: 1,
    backgroundColor: "blue",
  },
  content: {
    flexGrow: 1,
    backgroundColor: "white", // White background for the content area
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  banner1: {
    backgroundColor: "turquoise",
    width: "100%",
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
  },
  banner2: {
    backgroundColor: "grey",
    width: "100%",
    borderColor: "black",
    flexDirection: "row",
    marginBottom: 10,
    padding: 10,
  },
  bannerTextContainer: {
    flex: 1,
  },
  banner1Header: {
    fontSize: 18,
    fontWeight: "bold",
  },
  banner1Text: {
    fontSize: 14,
  },
  banner2Header: {
    fontSize: 18,
    fontWeight: "bold",
  },
  banner2Text: {
    fontSize: 14,
  },
});
