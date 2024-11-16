// Import necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC63fKcQygMGxuaekB3LUhLHBrtePlgorc",
    authDomain: "plasware-pr.firebaseapp.com",
    projectId: "plasware-pr",
    storageBucket: "plasware-pr.appspot.com",
    messagingSenderId: "754561855795",
    appId: "1:754561855795:web:53001379d46a303ba0ce46",
    measurementId: "G-T4YEG16RDC"
};

// Initialize Firebase app and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    setupCarousel();
    loadSponsoredProducts();
    setupSidebar();
});

// Self-Scrolling Carousel
function setupCarousel() {
    const carousel = document.querySelector(".carousel");
    const items = carousel.querySelectorAll(".carousel-item");
    let currentIndex = 0;

    // Clone the first and last items
    const firstClone = items[0].cloneNode(true);
    const lastClone = items[items.length - 1].cloneNode(true);
    carousel.appendChild(firstClone);
    carousel.insertBefore(lastClone, items[0]);

    // Function to move the carousel
    function moveCarousel() {
        if (currentIndex >= items.length) {
            carousel.style.transition = "none";
            currentIndex = 0;
            carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        } else {
            carousel.style.transition = "transform 0.5s ease-in-out";
            carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
        currentIndex++;
    }

    // Change every 3 seconds
    setInterval(moveCarousel, 3000);
}

// Initialize the carousel
setupCarousel();


// Load Sponsored Products
async function loadSponsoredProducts() {
    const sponsoredSection = document.querySelector(".sponsored-section");
    const querySnapshot = await getDocs(collection(db, "sponsoredProducts"));

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const productCard = `
            <div class="product-card">
                <img src="${data.imageUrl}" alt="${data.name}" width="80">
                <div>
                    <h3>${data.name}</h3>
                    <p>${data.description}</p>
                </div>
            </div>
        `;
        sponsoredSection.insertAdjacentHTML("beforeend", productCard);
    });
}

/* Sidebar Ads
function setupSidebar() {
    const sidebar = document.querySelector(".sidebar");
    sidebar.innerHTML = `
        <h3>Advertisements</h3>
        <p>Ad content goes here.</p>
    `;
}
    */
// Variables for selected coordinates
let userLat, userLng;

$(document).ready(function () {
    // Initialize hidden map
    const map = L.map('map').setView([0, 0], 2); // Default view
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Event listener for location input
    $('#location-input').on('input', function () {
        const query = $(this).val();
        if (query.length > 2) {
            getSuggestions(query);
        } else {
            $('#location-suggestions').hide();
        }
    });

    // Function to get location suggestions using Nominatim
    async function getSuggestions(query) {
        const nominatimURL = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`;
    
        try {
            const response = await fetch(nominatimURL);
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            
            const data = await response.json();
            
            // Check if data is an array before calling map
            if (Array.isArray(data)) {
                const suggestions = data.map(result => ({
                    name: result.display_name,
                    lat: result.lat,
                    lng: result.lon
                }));
                displaySuggestions(suggestions);
            } else {
                console.error("Unexpected response format from Nominatim:", data);
            }
        } catch (error) {
            console.error("Error fetching data from Nominatim:", error);
        }
    }

    // Display location suggestions
    function displaySuggestions(suggestions) {
        $('#location-suggestions').empty().show();
        suggestions.forEach((suggestion) => {
            const suggestionItem = `<li data-lat="${suggestion.lat}" data-lng="${suggestion.lng}">${suggestion.name}</li>`;
            $('#location-suggestions').append(suggestionItem);
        });

        // Click event for selecting a suggestion
        $('#location-suggestions li').click(function () {
            const selectedLocation = $(this).text();
            userLat = $(this).data('lat');
            userLng = $(this).data('lng');

            $('#location-input').val(selectedLocation);
            $('#location-suggestions').hide();
        });
    }

    // Hide suggestions if clicked outside
    $(document).click(function (e) {
        if (!$(e.target).closest('#location-input, #location-suggestions').length) {
            $('#location-suggestions').hide();
        }
    });

    // Search button event to proceed with coordinates
    $('#search-button').click(function () {
        const productName = $('#product-input').val();
        if (!userLat || !userLng) {
            alert('Please select a location from the suggestions.');
            return;
        }
        if (!productName) {
            alert('Please enter a product name.');
            return;
        }

        // Use userLat and userLng in your query
        searchProducts(productName);
    });

    // Helper function to calculate distance between two coordinates using Haversine formula
    function calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    }

    // Function to search for products using Firestore
    async function searchProducts(productName) {
        try {
            const querySnapshot = await getDocs(collection(db, 'shopLocations'));
            const productList = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();

                if (data.productName && data.productName.toLowerCase().includes(productName.toLowerCase())) {
                    // Calculate distance from user location
                    const distance = calculateDistance(userLat, userLng, data.latitude, data.longitude);
                    productList.push({
                        ...data,
                        shopId: doc.id,
                        distance
                    });
                }
            });

            // Sort products by distance
            productList.sort((a, b) => a.distance - b.distance);

            // Display sorted products
            $('#product-results').empty();
            productList.forEach((product) => {
                displayProductCard(product);
            });

            console.log("Searching products near:", userLat, userLng, "for:", productName);
        } catch (error) {
            console.error("Error querying products:", error);
        }
    }

    // Function to display product cards
    function displayProductCard(product) {
        const productCard = `
            <div class="product-card" onclick="redirectToProductDetail('${product.shopId}')">
                <img src="${product.imageUrl}" alt="${product.productName}">
                <div class="product-info">
                    <h3>${product.productName}</h3>
                    <p class="price">$${product.productPrice}</p>
                    <p>Distance: ${product.distance.toFixed(2)} km</p>
                    <h5>Shop Address: ${product.fullAddress}</h5>
                    <p>${product.productDescription.substring(0, 50)}...</p>
                </div>
            </div>
        `;
        $('#product-results').append(productCard);
    }

    // Redirect to product details page
    window.redirectToProductDetail = function(shopId) {
        window.location.href = `productDetails.html?shopId=${shopId}`;
    };

    // Fetch product details based on shopId from URL
    async function fetchProductDetails() {
        const params = new URLSearchParams(window.location.search);
        const shopId = params.get('shopId');

        if (shopId) {
            const productRef = doc(db, 'shopLocations', shopId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                const productData = productSnap.data();
                displayProductDetails(productData);
            } else {
                console.log("No such product!");
            }
        }
    }

    // Display product details on the productDetails.html page
    function displayProductDetails(product) {
        $('#product-image').attr('src', product.imageUrl);
        $('#product-name').text(product.productName);
        $('#product-price').text(`$${product.productPrice}`);
        $('#product-description').text(product.productDescription);
        $('#product-address').text(`Address: ${product.address}`);
    }

    // Call fetchProductDetails if on productDetails.html page
    if (window.location.pathname.includes('productDetails.html')) {
        fetchProductDetails();
    }
});
