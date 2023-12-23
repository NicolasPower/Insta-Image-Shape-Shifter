# Insta Image Shape Shifter

Insta Image Shape Shifter is a web application developed as part of a cloud computing unit to demonstrate a stateless application. The primary purpose of this application is to take a user's image or images and dynamically crop them using nodeSharp to achieve Instagram-friendly ratios. The application showcases the power of stateless architecture, emphasizing efficiency and scalability.

## Features

- **Image Cropping:** Utilizing the nodeSharp library, the application dynamically adjusts the dimensions of user-uploaded images to conform to Instagram-friendly ratios, ensuring a visually appealing presentation.

## Architecture

Insta Image Shape Shifter is hosted on Amazon Web Services (AWS) and employs cutting-edge cloud technologies to achieve scalability and efficiency:

- **Auto Scaling EC2 Instances:** The application utilizes auto-scaling EC2 instances to dynamically adjust resources based on demand, ensuring optimal performance and cost-effectiveness.

- **S3 Buckets:** Two S3 buckets are employed—one for hosting the client-side of the application and another for storing images. This separation allows for efficient content delivery and streamlined storage management.

- **SQS (Simple Queue Service):** SQS is used for queuing, providing a reliable and scalable way to manage the processing of image cropping tasks.

## Development

The development of Insta Image Shape Shifter was undertaken during a cloud computing unit, focusing on stateless application design principles.

### Technologies Used

- **NodeSharp:** NodeSharp library for dynamic image cropping.
- **AWS Services:** Auto Scaling EC2, S3, SQS.

## Deployment

Insta Image Shape Shifter is currently not deployed 
