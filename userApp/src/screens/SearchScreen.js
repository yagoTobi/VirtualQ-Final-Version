import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";

import Header from "../components/Header";
import Footer from "../components/Footer";

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Rides"); // default tab

  const renderBanners = () => {
    // Here you will connect with your data to generate banners
    // based on 'activeTab' and 'searchQuery'
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Search" />
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.tabsContainer}>
        {["Rides", "Restaurants", "Shops"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={activeTab === tab ? styles.activeTabText : styles.tabText}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView>{renderBanners()}</ScrollView>
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchBarContainer: {
    padding: 10,
  },
  searchBar: {
    backgroundColor: "#f2f2f2",
    borderRadius: 50,
    padding: 10,
    fontSize: 18,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  tab: {
    flex: 1,
    borderRadius: 50,
    padding: 10,
    marginHorizontal: 5,
    alignItems: "center",
    backgroundColor: "#f2f2f2",
  },
  activeTab: {
    backgroundColor: "#1E90FF",
  },
  tabText: {
    color: "#000",
  },
  activeTabText: {
    color: "#fff",
  },
});

export default SearchScreen;
