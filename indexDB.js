const dbName = "2WheelWander";
const dbVersion = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = function (event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains("users")) {
        const usersStore = db.createObjectStore("users", {
          keyPath: "userId",
          autoIncrement: false,
        });
        usersStore.createIndex("emailIndex", "email", { unique: true });
      }

      if (!db.objectStoreNames.contains("locations")) {
        const locations = db.createObjectStore("locations", {
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains("vehicles")) {
        const vehicles = db.createObjectStore("vehicles", {
          keyPath: "vId",
          autoIncrement: true,
        });

        vehicles.createIndex("vehicleLocationIndex", "location", {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains("Bookings")) {
        const bookings = db.createObjectStore("Bookings", {
          keyPath: "orderId",
          autoIncrement: false,
        });

        console.log("Bookings object store created");
        bookings.createIndex("orderIndex", "userId", {
          unique: false,
        });

        bookings.createIndex("vehicleIndex", "vehicleId", {
          unique: false,
        });
      }
    };
    request.onerror = function (event) {
      reject(new Error("Error opening the database: " + event.target.error));
    };

    request.onsuccess = function (event) {
      db = event.target.result;
      console.log("Database opened successfully.");
      resolve(db);
    };

    request.onblocked = function (event) {
      console.warn(
        "Database connection blocked. Please close other instances of the application."
      );
    };
  });
}

//to add object to object store
function addToObjectStore(db, objectStoreName, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStoreName, "readwrite");
    const objectStore = transaction.objectStore(objectStoreName);

    const query = objectStore.put(data);

    query.onsuccess = function (event) {
      console.log("Data added successfully:", event.target.result);
      //event.target.result gives key
      resolve(event.target.result);
    };

    query.onerror = function (event) {
      console.error("Error adding data:", event.target.error);
      reject(new Error("Error adding data: " + event.target.error));
    };
  });
}

// to get data from index

function getObjectFromIndex(db, objectStore, indexName, indexKey) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStore, "readonly");
    const store = transaction.objectStore(objectStore);
    const index = store.index(indexName);

    let query = index.get(indexKey);
    query.onsuccess = function (event) {
      console.log("Data retrieved successfully:", event.target.result);
      resolve(event.target.result);
    };

    query.onerror = function (event) {
      console.log("Error retrieving data:", event.target.error);
      reject(new Error("Error retrieving data") + event.target.error);
    };
  });
}
// get from index based on condition

function conditionedIndexing(
  db,
  objectStore,
  indexName,
  condition1,
  condition2
) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStore, "readonly");
    const store = transaction.objectStore(objectStore);
    const index = store.index(indexName);

    const range = IDBKeyRange.bound(condition1, condition2);

    let query = index.openCursor(range);

    const resultArr = [];

    query.onsuccess = (event) => {
      let cursor = event.target.result;

      if (cursor) {
        // console.log(cursor.value);
        resultArr.push(cursor.value);
        cursor.continue();
      } else {
        // console.log(resultArr);
        resolve(resultArr);
      }
    };
    query.onerror = (event) => {
      console.log(event.target.error);
      reject(
        new Error("Error on conditioned based indexing") + event.target.error
      );
    };
  });
}

//get object from object store based on id

function getObjectById(db, objectStore, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStore, "readonly");
    const store = transaction.objectStore(objectStore);

    let query = store.get(key);

    query.onsuccess = (event) => {
      // console.log(event.target.result);
      resolve(event.target.result);
    };

    query.onerror = (event) => {
      console.log(event.target.error);
      reject(new Error("Error getting object by key") + event.target.error);
    };
  });
}

//get all objects

function getAllFromObjectStore(db, objectStore) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStore, "readonly");
    const store = transaction.objectStore(objectStore);

    let query = store.openCursor();
    const getAllArr = [];

    query.onsuccess = (event) => {
      let cursor = event.target.result;

      if (cursor) {
        getAllArr.push(cursor.value);
        // console.log(cursor.value);
        cursor.continue();
      } else {
        // console.log(getAllArr);
        resolve(getAllArr);
      }
    };
    query.onerror = (event) => {
      console.log("Error retrieving data:", event.target.error);
      reject(new Error("Error retrieving data") + event.target.error);
    };
  });
}

// to delete in object objectstore

function deleteObject(db, objectStore, objectId) {
  return new Promise((reolve, reject) => {
    const transaction = db.transaction(objectStore, "readwrite");
    const store = transaction.objectStore(objectStore);

    let query = store.delete(objectId);

    query.onsuccess = (event) => {
      // console.log(event.target.result);
      reolve(event.target.result);
    };
    query.onerror = (event) => {
      console.log(event.target.error);
      reject(new Error("Error in deleting object") + event.target.error);
    };
  });
}

function clearObjectStore(db, objectStore) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStore, "readwrite");
    const store = transaction.objectStore(objectStore);

    let query = store.clear();

    query.onsuccess = (event) => {
      // console.log(event.target.result);
      resolve(event.target.result);
    };
    query.onerror = (event) => {
      console.log(event.target.error);
      reject(new Error("Error in clearing object store") + event.target.error);
    };
  });
}
//count no of records in objectstore

function countNoOfRecords(db, objectStore) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(objectStore, "readonly");
    const store = transaction.objectStore(objectStore);
    let query = store.count();

    query.onsuccess = (event) => {
      // console.log(event.target.result);
      resolve(event.target.result);
    };
    query.onerror = (event) => {
      console.log("Error in counting records", event.target.error);
      reject(
        new Error("Error in counting no. of records") + event.target.error
      );
    };
  });
}

function getOrdersForVehicle(vehicleId) {
  return openDatabase()
    .then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction("Bookings", "readonly");
        const bookingsStore = transaction.objectStore("Bookings");
        const index = bookingsStore.index("vehicleIndex");
        const range = IDBKeyRange.only(vehicleId);
        const getRequest = index.getAll(range);

        getRequest.onsuccess = function (event) {
          const orders = event.target.result;
          console.log("Orders for vehicle: ", orders);
          resolve(orders);
        };

        getRequest.onerror = function (event) {
          console.log(
            "Error fetching orders for vehicle: " + event.target.error
          );
          reject(event.target.error);
        };
      });
    })
    .catch((error) => {
      console.error("Error opening database: ", error);
      throw error;
    });
}
