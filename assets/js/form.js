import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-storage.js";

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyC63fKcQygMGxuaekB3LUhLHBrtePlgorc",
    authDomain: "plasware-pr.firebaseapp.com",
    projectId: "plasware-pr",
    storageBucket: "plasware-pr.appspot.com",
    messagingSenderId: "754561855795",
    appId: "1:754561855795:web:53001379d46a303ba0ce46",
    measurementId: "G-T4YEG16RDC"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);



 


// Reference to the location input and suggestions list
const locationInput = document.getElementById("location-name");
const suggestionsList = document.getElementById("location-suggestions");

// Initialize the geocoder for location suggestions
const geocoder = L.Control.Geocoder.nominatim();

// Handle typing in the location input field
locationInput.addEventListener("input", function () {
    const query = locationInput.value;

    if (query.length > 2) {
        geocoder.geocode(query, function (results) {
            suggestionsList.innerHTML = ""; // Clear previous suggestions

            results.forEach(function (result) {
                const li = document.createElement("li");
                li.textContent = result.name; // Display location name

                // Store lat/lng when a suggestion is selected
                li.addEventListener("click", function () {
                    document.getElementById("latitude").value = result.center.lat;
                    document.getElementById("longitude").value = result.center.lng;

                    locationInput.value = result.name; // Set the selected location
                    suggestionsList.innerHTML = ""; // Clear the suggestion list
                });

                suggestionsList.appendChild(li);
            });
        });
    }
});

// Handle form submission
document.getElementById("submit-button").addEventListener("click", function () {
    const shopLocation = document.getElementById("location-name").value;
    const fullAddress = document.getElementById("full-address").value;
    const productName = document.getElementById("product-name").value;
    const productPrice = document.getElementById("product-price").value;
    const sellerPhone = document.getElementById("seller-phone").value;
    const productDescription = document.getElementById("product-description").value; 
    const productCategory = document.getElementById("product-category").value; // Get the selected product category
    const imageFile = document.getElementById("image-upload").files[0];
    const latitude = document.getElementById("latitude").value;
    const longitude = document.getElementById("longitude").value;

    // Log productCategory to check if it's being selected correctly
    console.log("product Category selected: ", productCategory);

    if (shopLocation && productCategory && fullAddress && productName && productPrice && sellerPhone && productDescription && imageFile && latitude && longitude) {
        uploadData(shopLocation, fullAddress, productName, productPrice, sellerPhone, productCategory, productDescription, imageFile, latitude, longitude);
    } else {
        alert("Please fill in all fields and select a location.");
    }
});

// Upload data to Firebase Firestore
function uploadData(shopLocation, fullAddress, productName, productPrice, sellerPhone, productCategory, productDescription, imageFile, latitude, longitude) {
    const storageRef = ref(storage, 'assets/images/' + imageFile.name);

    uploadBytes(storageRef, imageFile).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadURL) => {
            addDoc(collection(db, "shopLocations"), {
                shopLocation: shopLocation,
                fullAddress: fullAddress,
                productName: productName,
                productPrice: productPrice,
                sellerPhone: sellerPhone,
                productCategory: productCategory, // Store the selected waste type
                productDescription: productDescription,
                imageUrl: downloadURL,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            })
            .then(() => {
                alert("Shop location submitted successfully!");
                window.location.href = 'index.html'; // Redirect to home page
            })
            .catch((error) => {
                console.error("Error storing location:", error);
                alert("An error occurred while storing the location.");
            });
        });
    });
}
