import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  FlatList,
  Dimensions,
  Image,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Modal from "react-native-modal";
import Carousel from "react-native-snap-carousel";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthContext from "../AuthContext";
import { API_BASE_URL } from "../constants";
import { Ionicons } from "@expo/vector-icons";
import { Pagination } from "react-native-snap-carousel";
import { format } from "date-fns";

const ReservationHubScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [selectedReservations, setSelectedReservations] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    const response = await fetch(`${API_BASE_URL}/api/queue/reservations/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setReservations(data);
    } else {
      console.error("Failed to fetch reservations");
    }
  };

  const handleReservationPress = (reservations) => {
    setSelectedReservations(reservations);
  };

  const handleModalClose = () => {
    setSelectedReservations(null);
  };

  const groupedReservations = reservations.reduce((groups, reservation) => {
    const date = format(new Date(reservation.date), "yyyy-MM-dd");
    const time = reservation.start_time;
    const ride = reservation.ride_name;
    const key = `${date}-${time}-${ride}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(reservation);
    return groups;
  }, {});

  const keys = Object.keys(groupedReservations);

  const renderCarouselItem = ({ item, index }) => (
    <View style={styles.carouselItem}>
      <Text style={styles.carouselItemTitle}>Visitor {index + 1}</Text>
      <QRCode value={item.reservation_ticket_id.toString()} size={200} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Virtual Q." />
      <Text style={styles.title}>Your Reservations</Text>
      <FlatList
        data={keys}
        keyExtractor={(item) => item}
        renderItem={({ item: key }) => {
          const [date, time, ride] = key.split("-");
          const reservationsForItem = groupedReservations[key];
          const firstReservation = reservationsForItem[0];
          return (
            <TouchableOpacity
              style={styles.reservationItem}
              onPress={() => handleReservationPress(reservationsForItem)}
            >
              <Image
                style={styles.reservationImage}
                source={{ uri: ride.ride_thumbnail }}
              />
              <Text style={styles.reservationTitle}>{ride}</Text>
              <Text style={styles.reservationTime}>
                {format(new Date(date), "EEEE, MMMM do yyyy")} at {time}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      <Modal
        isVisible={!!selectedReservations}
        onBackdropPress={handleModalClose}
        style={styles.modal}
      >
        <Carousel
          data={selectedReservations}
          renderItem={renderCarouselItem}
          sliderWidth={Dimensions.get("window").width}
          itemWidth={Dimensions.get("window").width}
          onSnapToItem={(index) => setActiveSlide(index)}
        />
        <Pagination
          dotsLength={selectedReservations?.length}
          activeDotIndex={activeSlide}
        />
      </Modal>
      <Footer navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1175c2",
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginVertical: 20,
    color: "white",
  },
  reservationItem: {
    backgroundColor: "white",
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  reservationImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  reservationTitle: {
    fontSize: 20,
    color: "#1175c2",
    padding: 10,
  },
  reservationTime: {
    fontSize: 16,
    color: "#1175c2",
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  carouselItem: {
    alignItems: "center",
    padding: 20,
  },
  carouselItemTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  carouselItemSubtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
    backgroundColor: "white",
    marginTop: "60%", // Push modal further down the screen
    borderRadius: 15, // Adds rounded corners
    overflow: "hidden", // Ensures the rounded corners are visible
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  paginationContainer: {
    paddingTop: 10,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 2,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
});

export default ReservationHubScreen;
