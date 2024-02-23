const figures_container = document.querySelector(".figures-container");
const bikeScooterCanvas = document.querySelector("#bike-scooter-canvas");
const likedBrandsCanvas = document.querySelector("#liked-brands-canvas");
const citiesComparison = document.querySelector("#liked-cities-canvas");
const userBookingCanvas = document.querySelector("#user-bookings-canvas");
const revenueChartCanvas = document.querySelector("#revenue-chart-canvas");
const revenueSelect = document.querySelector(".revenue-select");
const topUsersList = document.querySelector("#top-users");

window.addEventListener("load", () => {
  const currUser = JSON.parse(localStorage.getItem("currUser"));

  if (currUser === null || currUser.role !== "admin") {
    window.location = "./index.html";
  }
});
function calculateTotalRevenue() {
  return openDatabase()
    .then((db) => {
      return getAllFromObjectStore(db, "Bookings");
    })
    .then((orders) => {
      orders = orders.filter((order) => isOrderInPast(order));
      let totalAmount = orders.reduce((acc, order) => {
        return acc + parseInt(order.cost);
      }, 0);
      return totalAmount;
    })
    .catch((err) => {
      console.log("Error in calculating total revenue ", err);
    });
}

function calculateUsers() {
  return openDatabase()
    .then((db) => {
      //  return countNoOfRecords(db, "users"); // ab count ni kr skte aise

      return getAllFromObjectStore(db, "users").then((usersArr) => {
        const users = usersArr.filter((user) => user.role !== "admin");
        return users.length;
      });
    })
    .catch((err) => {
      console.log("Error in counting users", err);
    });
}

function totalBookings() {
  return openDatabase()
    .then((db) => {
      return getAllFromObjectStore(db, "Bookings");
    })
    .then((bookings) => {
      let bookingCount = {
        completed: 0,
        pending: 0,
      };
      bookings.reduce((acc, booking) => {
        if (isOrderInPast(booking)) {
          acc.completed += 1;
        } else {
          acc.pending += 1;
        }
        return acc;
      }, bookingCount);

      return bookingCount;
    })
    .catch((err) => {
      console.log("Error in counting bookings", err);
    });
}

function totalVehicles() {
  return openDatabase()
    .then((db) => {
      return countNoOfRecords(db, "vehicles");
    })
    .catch((err) => {
      console.log("Error in counting vehicles", err);
    });
}

function displayFigures() {
  const promises = [
    calculateTotalRevenue(),
    calculateUsers(),
    totalBookings(),
    totalVehicles(),
  ];
  let revenue = 0;
  let users = 0;
  let bookings = 0;

  let vehicles = 0;

  Promise.all(promises)
    .then((results) => {
   
      revenue = results[0];
      users = results[1];
      bookings = results[2];
      vehicles = results[3];

      figures_container.innerHTML = ` <div class="figures">
    
    <h3> Total Revenue (Rs)</h3>
     <p>  ${revenue}</p>
   </div>
   <div class="figures">
   
   <h3> Total Users</h3>
   <p> ${users}</p></div>
   <div class="figures">
   <h3> Total Bookings</h3>
   <div>
   <div>
   <span>Completed : </span>
   <p>${bookings.completed}</p>
   </div>
   <div>
   <span>Pending : </span>
   <p>  ${bookings.pending}</p>
   </div>
   </div>
   </div>
   <div class="figures"><h3> Total Vehicles</h3>
   <p> ${vehicles}</p></div>
   </div>`;
    })
    .catch((err) => {
      console.log("Error in displaying figures: ", err);
    });
}
displayFigures();

function calculateBikesScooters() {
  let bikeScooterCount = { bike: 0, scooter: 0 };

  openDatabase()
    .then((db) => {
      console.log(db);
      return getAllFromObjectStore(db, "Bookings");
    })
    .then((bookings) => {

      // Map each booking to a promise that fetches the associated vehicle
      //  const vehiclePromises = bookings.map(function (booking) {
      //   return openDatabase()
      //    .then(function (db) {
      //     return getObjectById(db, "vehicles", booking.vehicleId);
      //    })
      //    .then((vehicle) => {
      //     if (vehicle.vType === "bike") {
      //      bikeScooterCount.bike += 1;
      //     } else {
      //      bikeScooterCount.scooter += 1;
      //     }
      //    });
      //  });

      //  // Use Promise.all to wait for all vehicle promises to resolve
      //  return Promise.all(vehiclePromises).then(() => bikeScooterCount);
     
      bookings.forEach(function (booking) {
        if (booking.vehicleType === "bike") {
          bikeScooterCount.bike += 1;
        } else {
          bikeScooterCount.scooter += 1;
        }
      });

      return bikeScooterCount;
    })
    .then((bikeScooterCount) => {
      const chartLabels = Object.keys(bikeScooterCount);
      const chartData = Object.values(bikeScooterCount);
      const data = {
        labels: chartLabels,
        datasets: [
          {
            label: "Count",
            data: chartData,
            backgroundColor: ["#292950", "#f5738d", "rgb(255, 205, 86)"],
            hoverOffset: 4,
          },
        ],
      };
      const existingChart = Chart.getChart(bikeScooterCanvas);
      if (existingChart) {
        existingChart.destroy();
      }
      new Chart(bikeScooterCanvas, {
        type: "doughnut",
        data: data,
      });
    })
    .catch((err) => {
      console.log("Error in calculating most booked vehicles", err);
    });
}

// function getVehicleDetails(vehicleId) {
//   const vehicles = JSON.parse(localStorage.getItem("vehicles"));

//   const vehicle = vehicles.filter((vehicle) => vehicleId === vehicle.vId);

//   return vehicle[0];
// }
calculateBikesScooters();

function mostLikedVehicleBrand() {
  let brandsMap = new Map();

  openDatabase()
    .then((db) => {
      const vehicles = getAllFromObjectStore(db, "vehicles");
      vehicles
        .then((vehiclesArr) => {
       
          vehiclesArr.forEach((vehicle) => {
            brandsMap.set(vehicle.vbrand, 0);
          });
        })
        .then(() => {
          return getAllFromObjectStore(db, "Bookings");
        })
        .then((bookings) => {
          bookings.forEach(function (booking) {
            brandsMap.set(
              booking.vehicleBrand,
              brandsMap.get(booking.vehicleBrand) + 1
            );
          });

          return brandsMap;
        })
        .then(() => {
         
          const graphLabels = [...brandsMap.keys()];
          const graphData = [...brandsMap.values()];

          const data = {
            labels: graphLabels,
            datasets: [
              {
                label: "Bookings Count",
                data: graphData,
                backgroundColor: [
                  "rgba(255, 99, 132, 0.2)",
                  "rgba(255, 159, 64, 0.2)",
                  "rgba(255, 205, 86, 0.2)",
                  "rgba(75, 192, 192, 0.2)",
                  "rgba(54, 162, 235, 0.2)",
                  "rgba(153, 102, 255, 0.2)",
                  "rgba(201, 203, 207, 0.2)",
                ],
                borderColor: [
                  "rgb(255, 99, 132)",
                  "rgb(255, 159, 64)",
                  "rgb(255, 205, 86)",
                  "rgb(75, 192, 192)",
                  "rgb(54, 162, 235)",
                  "rgb(153, 102, 255)",
                  "rgb(201, 203, 207)",
                ],
                borderWidth: 1,
              },
            ],
          };
          const existingChart = Chart.getChart(likedBrandsCanvas);
          if (existingChart) {
            existingChart.destroy();
          }
          new Chart(likedBrandsCanvas, {
            type: "bar",
            data: data,
          });
        });
    })
    .catch((err) => {
      console.log("Error in calculating most likes brands", err);
    });
}
mostLikedVehicleBrand();

function mostBookingCities() {
  // const orders = JSON.parse(localStorage.getItem("orders"));
  // const locations = JSON.parse(localStorage.getItem("locations"));

  // const initialState = {};

  // locations.forEach((location) => {
  //   initialState[location.city] = 0;
  // });
  // const cityWiseOrder = orders.reduce((acc, order) => {
  //   if (acc[order.location] === undefined) acc[order.location] = 0;
  //   acc[order.location] += 1;

  //   return acc;
  // }, initialState);

  let cityBookingsMap = new Map();

  openDatabase().then((db) => {
    const locations = getAllFromObjectStore(db, "locations");
    locations
      .then((locationsArr) => {
        locationsArr.forEach((location) => {
          cityBookingsMap.set(location.city, 0);
        });
      })
      .then(() => {
        return getAllFromObjectStore(db, "Bookings");
      })
      .then((bookings) => {
        bookings.forEach((booking) => {
          cityBookingsMap.set(
            booking.location,
            cityBookingsMap.get(booking.location) + 1
          );
        });
      })
      .then(() => {
       
        const graphLabels = [...cityBookingsMap.keys()];
        const graphData = [...cityBookingsMap.values()];

        const data = {
          labels: graphLabels,
          datasets: [
            {
              label: "Bookings Count",
              data: graphData,
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(255, 159, 64, 0.2)",
                "rgba(255, 205, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(153, 102, 255, 0.2)",
                "rgba(201, 203, 207, 0.2)",
              ],
              borderColor: [
                "rgb(255, 99, 132)",
                "rgb(255, 159, 64)",
                "rgb(255, 205, 86)",
                "rgb(75, 192, 192)",
                "rgb(54, 162, 235)",
                "rgb(153, 102, 255)",
                "rgb(201, 203, 207)",
              ],
              borderWidth: 1,
            },
          ],
        };
        const existingChart = Chart.getChart(citiesComparison);
        if (existingChart) {
          existingChart.destroy();
        }
        new Chart(citiesComparison, {
          type: "bar",
          data: data,
        });
      });
  });
}
mostBookingCities();

function userRegisterBookingsRatio() {
  let uniqueOrder = new Set();

  openDatabase()
    .then((db) => {
      return getAllFromObjectStore(db, "Bookings");
    })
    .then((bookings) => {
      const uniqueOrder = new Set();

      bookings.forEach((order) => {
        uniqueOrder.add(order.userId);
      });
      calculateUsers().then((usersCount) => {
        // const percentageForBookingUsers = (uniqueOrder.size / usersCount) * 100;
        // const percentageForNonBookingUsers = 100 - percentageForBookingUsers;
        const performingUsers = uniqueOrder.size;
        const nonPerformingUsers = usersCount - uniqueOrder.size;
        const data = {
          labels: ["PerformingUsers", "Non-performingUsers"],
          datasets: [
            {
              label: "Count",
              data: [performingUsers, nonPerformingUsers],
              backgroundColor: ["#292950", "#f5738d", "rgb(255, 205, 86)"],
              hoverOffset: 4,
            },
          ],
        };
        const existingChart = Chart.getChart(userBookingCanvas);
        if (existingChart) {
          existingChart.destroy();
        }
        new Chart(userBookingCanvas, {
          type: "pie",
          data: data,
        });
      });
    });
}
userRegisterBookingsRatio();

//revenue by location

//timmewise revenue
function sortOrders(orders) {
  orders.sort((a, b) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return dateA - dateB;
  });
  return orders;
}

function isOrderInPast(order) {
  const currentDate = new Date();
  const endDate = new Date(order.end_date + "T" + order.end_time);

  return endDate <= currentDate;
}

function calculateRevenue() {
  openDatabase().then((db) => {
    const orders = getAllFromObjectStore(db, "Bookings");
    orders.then((ordersArr) => {
      ordersArr = ordersArr.filter((order) => isOrderInPast(order));
   
      ordersArr = sortOrders(ordersArr);
      const filterOption = revenueSelect.value;
      const revenue = ordersArr.reduce((stats, order) => {
        const orderDate = new Date(order.start_date);
        // const isWithinTimeRange =
        //   orderDate >= TIME_RANGE.start_date && orderDate <= TIME_RANGE.end_date;
        if (true) {
          let key;
          switch (filterOption) {
            case "day-wise":
              key = orderDate.toISOString().split("T")[0];
              break;
            case "month-wise": {
              const month = orderDate.getMonth() + 1;
              const year = orderDate.getFullYear();
              const formattedMonth = month < 10 ? `0${month}` : month;
              const joinedDate = `${formattedMonth}-${year}`;

              key = joinedDate;
              break;
            }
            case "year-wise":
              key = orderDate.getFullYear().toString();
              break;
            default:
              key = orderDate.toISOString().slice(0, 7);
          }

          if (!stats[key]) {
            stats[key] = 0;
          }
          stats[key] += parseInt(order.cost);
        }
        return stats;
      }, {});

      const graphLabels = Object.keys(revenue);
      const graphData = Object.values(revenue);
    
      const data = {
        labels: graphLabels,
        datasets: [
          {
            label: "revenue",
            data: graphData,
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      };
      const existingChart = Chart.getChart(revenueChartCanvas);
      if (existingChart) {
        existingChart.destroy();
      }
      new Chart(revenueChartCanvas, {
        type: "line",
        data: data,
      });
    });
  });
}
revenueSelect.addEventListener("change", () => {
  calculateRevenue();
});

calculateRevenue();

function topPerformingUsers() {
  openDatabase()
    .then((db) => {
      return getAllFromObjectStore(db, "Bookings");
    })
    .then((bookings) => {
      let userBookingsMap = new Map();
      bookings.forEach((booking) => {
        if (userBookingsMap.has(booking.userId)) {
          userBookingsMap.set(booking.userId, {
            user: userBookingsMap.get(booking.userId).user,
            bookingCount:
              parseInt(userBookingsMap.get(booking.userId).bookingCount) + 1,
          });
        } else {
          userBookingsMap.set(booking.userId, {
            user: {
              userId: booking.userId,
              firstname: booking.userFirstName,
              lastname: booking.userLastName,
              email: booking.userEmail,
            },
            bookingCount: 1,
          });
        }
      });
      const sortedUserBookings = new Map(
        [...userBookingsMap.entries()].sort(
          (a, b) => b[1].bookingCount - a[1].bookingCount
        )
      );
      const topUsers = Array.from(sortedUserBookings).slice(0, 3);
    

      topUsersList.innerHTML = "";
      topUsers.forEach((userObj) => {
        const user = userObj[1].user;
        const bookingCount = userObj[1].bookingCount;
        const row = document.createElement("tr");
        // Create table cells for each data item
        row.classList.add("user-row");
        const nameCell = document.createElement("td");
        nameCell.textContent = `${user.firstname} ${user.lastname}`;
        row.appendChild(nameCell);
  
        const emailCell = document.createElement("td");
        emailCell.textContent = user.email;
        row.appendChild(emailCell);
  
        const bookingCountCell = document.createElement("td");
        bookingCountCell.textContent = bookingCount;
        row.appendChild(bookingCountCell);
  
        topUsersList.appendChild(row);
      });
      
    })

    .catch((err) => {
      console.log("Error in calculating top performing users", err);
    });
}
topPerformingUsers();
