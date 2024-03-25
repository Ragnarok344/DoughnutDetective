// Go to https://cors-anywhere.herokuapp.com/corsdemo and click the button before opening application

/*
    This script is used to fetch donut shops near a given zip code using the Yelp and Google Places APIs.
    It also allows the user to view the search history and select a previous search to view the results.
*/

// Define constants and global variables
const yelpKey = "sHy9Gc5XgP9u3-Q919iLbJQ_jvzDuoz7kWnV-axjrEVNg5uvF3Q2mDPG1uMDoYSQKPNe2VmtZt82mLFCWzHJwhDgP64jiAHlR9PPNCGWZUoBH_0mZJFj16WH-YrzZXYx"; // Yelp fusion API key
const placesKey = "AIzaSyDekQjZnmtOgvPJybLzorOh7BmFKT4SAFs"; // Goodle Places API key
const limit = 3; // Number of businesses to return
const term = 'donut'; // Search term
const queryURL = "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?"; // Yelp API URL
const googlePlacesURL = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?"; // Google Places API URL
const googlePlacesPhotoURL = "https://places.googleapis.com/v1/"; // Google Places Photo API URL

$(document).ready(function () {
    // Event listeners

    // Search form submit event
    $("#search").on("submit", function (event) {
        event.preventDefault();
        searchZip();
    });

    // Search history change event
    $("#history").change(function () {
        let selectedValue = $(this).find('option:selected').val();
        let parts = selectedValue.split(" -");
        let selectedZip = parts[1].trim();
        searchZip(selectedZip);
    });

    // New search button click event
    $('#newSearch').click(function (e) {
        e.preventDefault();
        $('#modal').attr('open', '');
    });

    // Close modal button click event
    $('#close').click(function (e) {
        $('#modal').removeAttr('open');
    });

    // Close CORS error modal
    $('#closeCorsErrorModal').click(function (e) {
        $('#corsErrorModal').removeAttr('open');
    });

    // Initialize
    $('#results a').css('text-decoration', 'none');
    updateSearchHistory();
});

// Functions

// Handle CORS error modal
function showCorsErrorModal() {
    $('#corsErrorModal').attr('open', '');
}

/*
Handle fetch errors
response: object - Fetch response object
returns: object - Response object or throws error
*/
function handleFetchErrors(response) {
    if (!response.ok) {
        if (response.status === 403) {
            showCorsErrorModal(); // Show CORS error modal for 403 error
        } else {
            console.error('Fetch error:', response.status);
        }
        throw Error(response.statusText);
    }
    return response;
}

/*
Fetch place ID from Google Places API
address: string - Address to search for
returns: string - Place ID or null if no results are found
*/
const fetchPlaceId = async (address) => {
    // Construct URL for Google Places API
    const placeURL = new URL(googlePlacesURL);
    placeURL.searchParams.append('query', 'donuts ' + address);
    placeURL.searchParams.append('radius', '5');
    placeURL.searchParams.append('key', placesKey);

    const response = await fetch(placeURL);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
        return data.results[0].place_id;
    } else {
        console.error("No results found for the given address.");
        return null; // Or handle this case accordingly
    }
};

/*
Fetch business details from Google Places API
placeId: string - Place ID to fetch details for
returns: object - Business details
*/
const fetchBusinessDetails = async (placeId) => {
    const detailsURL = new URL(`https://cors-anywhere.herokuapp.com/https://places.googleapis.com/v1/places/${placeId}?fields=photos,googleMapsUri&key=${placesKey}`);
    const response = await fetch(detailsURL);
    const data = await response.json();
    return { reference: data.photos[0].name, id: data.photos[0].placeId, googleMapsUri: data.googleMapsUri };
};

/*
Fetch photo from Google Places API
photoReference: string - Photo reference to fetch
returns: string - Photo URL
*/
const fetchPhoto = async (photoReference) => {
    const photoURL = new URL(googlePlacesPhotoURL + photoReference + '/media');
    photoURL.searchParams.append('maxHeightPx', '400');
    photoURL.searchParams.append('key', placesKey);
    return photoURL.href;
};

/*
Fetch reviews for a single business from Yelp API
businessId: string - Business ID to fetch reviews for
returns: array - Reviews or null if no reviews are found
*/
const fetchBusinessReviews = async (businessId) => {
    const reviewsURL = `https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/${businessId}/reviews?limit=3&sort_by=yelp_sort`;

    try {
        // Fetch reviews data from Yelp API
        const response = await fetch(reviewsURL, {
            method: "GET",
            headers: {
                "accept": "application/json",
                "x-requested-with": "xmlhttprequest",
                "Access-Control-Allow-Origin": "*",
                "Authorization": `Bearer ${yelpKey}`
            },
        });

        // Extract JSON data from the response
        const data = await response.json();

        // Return reviews
        return data.reviews;
    } catch (error) {
        // Handle errors if fetching reviews fails
        console.error('Error fetching reviews:', error);
        return null;
        throw error;
    }
};

/*
Fetch businesses from Yelp API based on zip code and search term
zip: string - Zip code to search for
returns: array - Businesses or null if no businesses are found
*/
const fetchBusinesses = async (zip) => {
    const listURL = new URL(queryURL);
    listURL.searchParams.append('limit', limit);
    listURL.searchParams.append('term', term);
    listURL.searchParams.append('location', zip);

    try {
        const response = await fetch(listURL, {
            method: "GET",
            headers: {
                "accept": "application/json",
                "x-requested-with": "xmlhttprequest",
                "Access-Control-Allow-Origin": "*",
                "Authorization": `Bearer ${yelpKey}`
            },
        });

        handleFetchErrors(response); // Check for errors in response

        const data = await response.json();

        if (!data.businesses || data.businesses.length === 0) {
            return null;
        }

        const businesses = data.businesses;
        const result = [];

        // Loop through the businesses and fetch details for each
        for (const business of businesses) {
            const address = business.location.address1;
            const placeId = await fetchPlaceId(business.location.address1 + ' ' + business.location.city + ' ' + business.location.state + ' ' + business.location.zip_code);
            const businessDetails = await fetchBusinessDetails(placeId);
            const photoReference = businessDetails.reference;
            const photoURL = await fetchPhoto(photoReference);
            const addy = business.location.city + ', ' + business.location.state;
            const zip = business.location.zip_code;
            const reviews = await fetchBusinessReviews(business.id);

            result.push({
                photoURL: photoURL,
                name: business.name,
                url: business.url,
                reviews: reviews,
                googleMapsUri: businessDetails.googleMapsUri,
                address: addy,
                zip: zip
            });
        }

        return result;
    } catch (error) {
        // Handle errors if fetching businesses fails
        console.error('Error fetching businesses:', error);
        return null;
        throw error;
    }
};

/*
Function to search for businesses using the provided zip code
zip: string - Zip code to search for
*/
async function searchZip(zip = $("#zip").val()) {
    if (zip.length !== 5 || isNaN(zip)) {
        $('#error').css('visibility', 'visible');
    } else {
        $('#modal').removeAttr('open');

        try {
            const businesses = await fetchBusinesses(zip);
            if (businesses === null) {
                $('#results').empty();
                $('#results').append(`<h2>No donut places found near ${zip}</h2>`);
                return;
            }
            $('#error').css('visibility', 'hidden');
            addSearch(businesses[0].address, businesses[0].zip);
            displayResults(businesses, zip);
        } catch (error) {
            console.error('Error:', error);
        };
    }
}

// Function to update search history in the UI
function updateSearchHistory() {
    // Get search history from local storage
    let searchHistory = JSON.parse(localStorage.getItem('History')) || [];

    $("#history").empty();

    let firstOption = $("<option selected disabled value=''>").text("Search History");
    $("#history").append(firstOption);

    firstOption.hide();

    for (let i = 0; i < searchHistory.length; i++) {
        let option = $("<option>").text(searchHistory[i].city + " - " + searchHistory[i].zip);
        $("#history").append(option);
    }
}

// Function to add a search to the search history
function addSearch(city, zip) {
    // Get search history from local storage
    let searchHistory = JSON.parse(localStorage.getItem('History')) || [];
    let search = {
        city: city,
        zip: zip
    };

    // Check if the search already exists in the history
    let duplicate = searchHistory.some(item => item.city === city && item.zip === zip);

    // If it's not a duplicate, add it to the history
    if (!duplicate) {
        searchHistory.push(search);
        localStorage.setItem('History', JSON.stringify(searchHistory));
        updateSearchHistory();
    }
}

/*
Function to display search results
businesses: array - Array of businesses to display
zip: string - Zip code to display
*/
function displayResults(businesses, zip) {
    $('#results').empty();

    let resultText = $("<h2>").text("Donut Shops near " + businesses[0].address + " " + zip);
    $('#results').append(resultText);

    for (let i = 0; i < businesses.length; i++) {
        let card = $("<article>");
        let cardBody = $("<div>").addClass("container-fluid card-container");
        let yelpLink = $("<a>").attr("href", businesses[i].url);
        let cardTitle = $("<header>");
        yelpLink.append('<h3>' + businesses[i].name + '</h3>');
        cardTitle.append(yelpLink);

        let googleMapsLink = $("<a>").attr("href", businesses[i].googleMapsUri);
        let img = $("<img>").attr("src", businesses[i].photoURL);
        let imgDiv = $("<div>").addClass("imgDiv grid");
        googleMapsLink.append(img);
        imgDiv.append(googleMapsLink);

        let reviewsContainer = $("<div>").addClass("accordian").attr("id", "myAccordion");
        let reviews = $("<div>").addClass("reviews");
        for (let j = 0; j < businesses[i].reviews.length; j++) {
            let review = $("<details>");
            let summary = $("<summary>");
            let stars = "";
            for (let k = 0; k < businesses[i].reviews[j].rating; k++) {
                stars += "⭐";
            }
            for (let k = 0; k < 5 - businesses[i].reviews[j].rating; k++) {
                stars += "☆";
            }
            summary.html(businesses[i].reviews[j].user.name + " - " + stars + " - " + businesses[i].reviews[j].time_created);
            let p = $("<p>");
            p.text(businesses[i].reviews[j].text);
            review.append(summary, p);
            reviews.append(review);

            if (j < businesses[i].reviews.length - 1) {
                reviews.append($("<hr />"));
            }
        }

        reviewsContainer.append(reviews);
        cardBody.append(imgDiv, reviewsContainer);
        card.append(cardTitle, cardBody);
        $("#results").append(card);
    }

    updateSearchHistory();
}