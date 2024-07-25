import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Modal from "react-native-modal";
import Carousel from "react-native-snap-carousel";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ReservationBanner from "../components/ReservationBanner";
import AuthContext from "../AuthContext";
import { API_BASE_URL } from "../constants";
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

      // Sort reservations by date and start_time
      data.sort((a, b) => {
        const dateA = new Date(a.date + "T" + a.start_time);
        const dateB = new Date(b.date + "T" + b.start_time);
        return dateA - dateB;
      });

      const groupedData = data.reduce((acc, current) => {
        const date = format(new Date(current.date), "yyyy-MM-dd");
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(current);
        return acc;
      }, {});

      setReservations(groupedData); // set state with grouped data
    } else {
      console.error("Failed to fetch reservations");
    }
  };

  const handleReservationPress = (reservations) => {
    setSelectedReservations(reservations);
  };

  //TODO
  const handleCancelReservation = async (reservation) => {
    // API call to delete reservation here...
    // After successful API call, update reservations state
    //setReservations(reservations.filter((r) => r !== reservation));
  };

  const handleModalClose = () => {
    setSelectedReservations(null);
  };

  const renderCarouselItem = ({ item, index }) => (
    <View style={styles.carouselItem}>
      <Text style={styles.carouselItemTitle}>Visitor {index + 1}</Text>
      <QRCode value={item.reservation_ticket_id.toString()} size={200} />
    </View>
  );

  const renderItem = (item) => {
    const [date, reservations] = item;
    return (
      <View>
        <Text style={styles.dateText}>
          {format(new Date(date), "yyyy-MM-dd")}
        </Text>
        {reservations.map((reservation) => (
          <ReservationBanner
            key={reservation.reservation_id}
            reservation={reservation}
            onCancel={handleCancelReservation}
            onPress={() => handleReservationPress(reservation)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Virtual Q." />
      <Text style={styles.title}>Your Reservations</Text>
      <FlatList
        data={Object.entries(reservations)}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => renderItem(item)}
      />

      <Footer navigation={navigation} />
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
  dateText: {
    fontSize: 20,
    textAlign: "center",
    marginVertical: 20,
    color: "white",
  },
});

export default ReservationHubScreen;
