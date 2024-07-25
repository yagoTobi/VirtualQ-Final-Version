# Virtual Q - An Innovative Full-Stack Solution for Theme Parks

## Overview

Virtual Q is a comprehensive full-stack ecosystem designed to enhance the experience of both theme park managers and visitors. This project was developed as part of a final thesis in Computer Engineering at Universidad Pontificia Comillas ICAI. 

- [Project Thesis](https://repositorio.comillas.edu/jspui/bitstream/11531/74763/1/TFG%20Tobio%20Souto%2C%20Yago.pdf)
- [Project Presentation](https://www.canva.com/design/DAFfNZRYMQI/oRpC6xTuJ5Kh8G46f2VbBg/view?utm_content=DAFfNZRYMQI&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink)

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
   - [Manager Portal](#manager-portal)
   - [User Mobile App](#user-mobile-app)
   - [Virtual Queue System](#virtual-queue-system)
3. [How It Works](#how-it-works)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Installation and Setup](#installation-and-setup)
   - [Prerequisites](#prerequisites)
   - [Manager Portal (Django)](#manager-portal-django)
   - [User App (React Native)](#user-app-react-native)
7. [Important Notes](#important-notes)
8. [Future Development](#future-development)
9. [Contributing](#contributing)

## Key Features

### Manager Portal
- Dynamic management of park databases
- Control over ride information, status, and capacity
- Restaurant and store product management
- Ticket administration
- Map information updates

#### Manager Portal Preview
![Manager Dashboard Home View](img_repo/manager_dashboard/DashboardHomeView.png)
![Manager Editable Fields](img_repo/manager_dashboard/EditableFields.png)
![Manager User Tokens](img_repo/manager_dashboard/UserTokens.png)

### User Mobile App
- Ticket purchasing
- Itinerary planning
- Advance ride booking
- Virtual queue system

#### User Mobile App Preview
![User App Reservations Time](img_repo/user_app/reservationsTime.jpg)
*Reservation times for a ride display*

![User App Ride Under Maintenance](img_repo/user_app/rideUnderMaintenance.jpg)
*Ride under maintenance set by the park manager in real time*

![User App Dashboard](img_repo/user_app/userDashboard.jpg)
*Home Dashboard*

![User App Tickets View](img_repo/user_app/ticketsAppView.jpg)
*Client tickets view for each specific day and group*

### Virtual Queue System
- Real-time status updates
- Multiple ride queue management
- Efficient booking system

## How It Works

1. **Manager Portal:**
   - Park managers access the portal to manage park information, including rides, restaurants, and stores.
   - Managers can update ride status, capacity, and maintenance information in real-time.
   - The portal allows for ticket sales management and user token viewing.

2. **User Mobile App:**
   - Visitors use the app to purchase tickets, plan itineraries, and book rides.
   - Real-time information on ride status, queue lengths, and booking availability is provided.
   - Users can view their ticket information and track their park progress.

3. **Virtual Queue System:**
   - Users can book ride slots in advance and receive real-time queue status updates.
   - Park managers can simultaneously view and manage queue status for multiple rides.
   - The system ensures a seamless experience with reduced waiting times and efficient ride booking.

## Technology Stack

- **User Mobile App:** React Native
- **Backend & Manager Portal:** Django
- **Database:** SQLite

## Project Structure

Virtual Q follows a microservice-based architecture. The interaction between different components is illustrated in the diagram below:

![Microservice Interaction](Diagramas/png/DiagramaInteraccionMicroservicios.png)

For a detailed view of the class structure and interactions, refer to the following diagram:

![Class Diagram and structure of the project](Diagramas/png/Clases.png)

## Installation and Setup

### Prerequisites
- Python 3.10
- Node.js and npm
- React Native development environment
- Django

### Manager Portal (Django)

1. Navigate to the Django project directory:
   ```
   cd path/to/django/project
   ```

2. Install required Python packages:
   ```
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```
   python manage.py migrate
   ```

4. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

5. Start the Django server:
   ```
   python manage.py runserver
   ```

6. Access the admin portal at `http://localhost:8000/admin` using the superuser credentials.

### User App (React Native)

1. Navigate to the React Native project directory:
   ```
   cd path/to/react-native/project
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the Expo development server:
   ```
   expo start
   ```

4. Use Expo Go on your mobile device to scan the QR code and run the app.

## Important Notes

- Ensure both the Django backend and React Native app are running simultaneously for full functionality.
- Check and update IP configurations in the app settings for local connections.

## Future Development

This project is a work in progress. Future updates may include:
- Deployment of the user app to app stores
- Addition of an interactive park map
- Project reorganization and code cleanup
- Implementation of AI for optimized itinerary planning
- Enhanced features for both manager and user interfaces
- Integration with real-time data sources for park information

## Contributing

Contributions to Virtual Q are welcome! Please feel free to submit issues, fork the repository and send pull requests.

Project Link: [https://github.com/yagotobi/virtual-q](https://github.com/yagotobi/virtual-q)