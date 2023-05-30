import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

const FilterButton = ({
  title,
  active,
  activeColor,
  onPress,
  filtersCount,
}) => {
  const buttonStyle = {
    ...styles.button,
    backgroundColor: active ? activeColor : "#ffffff",
  };
  const textStyle = active ? styles.activeText : styles.text;

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress}>
      <View style={styles.row}>
        <Text style={textStyle}>{title}</Text>
        {filtersCount > 0 && (
          <View style={styles.filtersCountContainer}>
            <Text style={styles.filtersCountText}>{filtersCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  filtersCountContainer: {
    marginLeft: 5,
    backgroundColor: "white",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filtersCountText: {
    color: "black",
    fontSize: 12,
  },
  button: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "black",
    margin: 5,
  },
  activeButton: {
    backgroundColor: "#1175c2",
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "black",
    margin: 5,
  },
  text: {
    color: "black",
    textAlign: "center",
  },
  activeText: {
    color: "white",
    textAlign: "center",
  },
});

export default FilterButton;
