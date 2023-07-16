# Virtual Q
We facilitate real-time management for administrators. In the user application, we enable receiving notifications, scheduling personalized visits, and joining virtual queues.


<a name="br1"></a> 

Project Abstract

1 Introduction

This project proposes the development of a software solution for the management of

theme parks, incorporating the principles of microservices and Internet of Things (IoT)

features. The primary focus will be the establishment of a virtual queuing system,

minimizing idle time for park visitors. The project encompasses two key components:

a mobile application for visitors and a web application for the park’s administrators

and employees.

02 Project Structure

Motivated by the evolution of technologies such as IoT, cloud, cross-platform develop-

ment, and virtual queuing systems, this project employs the concept of virtualization. This technology enables the creation and operation of virtual resources and in-

stances of physical resources, such as computers, servers, and storage, within a single

device, thereby promoting resource eﬃciency.

The application follows a microservice-like architecture. Microservices involve building

an application as a suite of small services that run in their own processes and communi-

cate using lightweight mechanisms, such as an HTTP-based API. Each microservice is

dedicated to performing an individual, complete, and independent function [[?]], con-

trasting with monolithic architectures where functionalities are interconnected, hence

less fault-tolerant.

Figure 1: Monolithic vs. Microservice Architectures

The services are instantiated and contained within virtual containers, managed by

Docker and Kubernetes. Docker is responsible for creating these containers, while

Kubernetes ensures their eﬃcient deployment, scaling, and load-balancing [[?]].

1



<a name="br2"></a> 

Project Abstract

The project aims to:

• Implement a microservice architecture using Docker and Kubernetes.

• Develop a user-friendly mobile application for visitors to enhance their theme

park experience, particularly via virtual queueing for theme park rides.

• Establish a real-time, analytic dashboard for park managers to modify park at-

tributes and extract valuable usage data.

0\.3 Project Description

The microservices architecture, as illustrated below, forms the backbone of the system.

Each microservice is tasked with a speciﬁc, independent function, and their interactions

with diﬀerent applications are highlighted.

Figure 2: Project Microservices Architecture

Key microservices and elements of the architecture include:

• Client Application: This is the visitors’ mobile application that interfaces with

all microservices.

• Main Administrator Application: The park management’s web portal grants

access to all project microservices.

• Analytics Dashboard: This microservice interacts with the queue service and

gathers data about the park’s services.

• Staﬀ App: Park administrators manage the theme park’s employees via this

app, providing diﬀerent roles and permissions.

• Ticket Services: This platform facilitates user registration and ticket purchases

for theme park visits.

• Virtual Queuing Service: This microservice administers the virtual queues for

each theme park ride.

2



<a name="br3"></a> 

Project Abstract

• Theme Park API Information Service: This microservice allows modiﬁcation

and communication of all park properties.

0\.4 Results

The project has yielded satisfactory results, successfully delivering a web application

for theme park administrators and a mobile app for visitors.

The web application enables real-time park management, with changes instantly re-

ﬂected on the user app. This results in a highly eﬃcient tool for organizers and admin-

istrators.

By incorporating a REST API and token-based authentication, I have developed a

secure and eﬃcient communication channel between the two apps.

On the client side, a React Native cross-platform application provides an intuitive and

interactive experience for park visitors. It oﬀers a variety of features that may prove

essential during their visit.

Apart from achieving the goals of this project, I have strived to adhere to best pro-

gramming practices and methodologies such as DRY (Don’t Repeat Yourself), KISS

(Keep It Simple, Stupid), and the SOLID framework [[?]].

0\.5 Conclusions

The project, Virtual Q, stemmed from my initial dissatisfaction due to the inability

to fully experience a theme park on peak days. I found it unacceptable that large-

scale corporations could subject their customers to such mundane and stagnant periods

of waiting, especially in contrast to the excitement of their rides and other attrac-

tions.

The project, Virtual Q, stemmed from my initial dissatisfaction due to the inability

to fully experience a theme park on peak days. I found it unacceptable that large-

scale corporations could subject their customers to such mundane and stagnant periods

of waiting, especially in contrast to the excitement of their rides and other attrac-

tions.

I must concede that the potential scope of this project could reach astronomical pro-

portions. However, its current state serves as a solid foundation and starting point for

the application. Furthermore, it illustrates the array of skills I have acquired during its

progression.

3




