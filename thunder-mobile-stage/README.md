# Thunder Mobile


This is an Ionic-Angular based food delivery app similar . 
The app allows customers to browse restaurants, menus, place orders, and track their orders in real-time. The app also provides restaurant owners a dashboard to manage their menus and orders.

## Getting started

To run this app on your local machine, you'll need to follow these simple steps:

Clone this repository.
Install the required dependencies by running npm install.
Run the app using ionic serve.

# App structure

The app has the following structure:

### Authentication: Allows users to log in or sign up using their email and password, Facebook or Google accounts.
### Home: Displays the list of available restaurants near the user's location.
### Restaurant Details: Displays the restaurant's details, menu, reviews, and ratings.
### Cart: Allows the user to add or remove items from their cart and place an order.
### Orders: Displays the list of orders the user has placed and their current status.
### Profile: Allows the user to edit their profile, change their password or log out.


## Running test automation with playwright

All test cases are developed under tests folder, this feature is in preview please if you find any issue
contact test team.
In order to run test suit you should follow those steps:

1. `npx playwright install` to install playwright browsers.
1. `npx playwright test` to execute all tests.
1. `npx playwright test tests/Login/<test use case name>.spec.js` to execute sepecfic test in tests folder.

If you are using windows wsl or linux please consider installing dependecies before running the tests with this command `npx playwright install-deps`.

For further information you can visit playwright documentation [here](https://playwright.dev/)
