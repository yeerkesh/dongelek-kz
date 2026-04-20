# Дөңгелек.kz

## Description

Дөңгелек.kz is a web application for posting and managing car sale advertisements.

The main purpose of the project is to allow users to:
- register and log in
- create car advertisements
- view available cars
- edit and delete their own cars
- send messages to other users

The project is built using Angular for the frontend and Django with Django REST Framework for the backend.


## Features

- User registration and login (JWT authentication)
- Create, read, update, delete car advertisements (CRUD)
- Cars are linked to brands
- Users can edit and delete only their own cars
- Messaging between users
- Admin panel for managing data


## Backend

Technologies:
- Django
- Django REST Framework
- JWT (SimpleJWT)

Main models:
- Car
- CarBrand
- Message
- Profile

Main functionality:
- REST API for frontend
- Authentication using JWT
- Linking cars to users (owner)
- Permission control (only owner can edit/delete)


## Frontend

Technologies:
- Angular
- TypeScript
- HTML, CSS

Main functionality:
- Forms for login and registration
- Communication with backend via HTTP
- Token stored in localStorage
- Routing between pages


## API Endpoints (examples)

- POST /api/register/ – register user  
- POST /api/login/ – login user  
- GET /api/cars/ – get all cars  
- POST /api/cars/ – create car  
- PUT /api/cars/{id}/ – update car  
- DELETE /api/cars/{id}/ – delete car  
- GET /api/brands/ – get brands  


## How to run

### Backend

cd webdevdj  
python -m venv venv  
venv\Scripts\activate  
pip install -r requirements.txt  
python manage.py migrate  
python manage.py runserver  

### Frontend

cd Angular  
npm install  
ng serve  


## Project Structure

Web-Dev-Project/
- Angular/ (frontend)
- webdevdj/ (backend)
  - api/
    - models.py
    - views.py
    - serializers.py
    - urls.py


## Group Members

- Yessimbek Yerkebulan 
- Baiguzhinov Amir 
- Serikbayev Ali


## Summary

This project is a full-stack web application using Angular and Django. It includes authentication, CRUD operations, and interaction between frontend and backend through REST API.