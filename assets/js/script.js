// Go to https://cors-anywhere.herokuapp.com/corsdemo and click the button before opening application

$(document).ready(function () {
    // Define the base URL for Yelp API
    const queryURL = "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?";
    // Prompt the user to enter the Yelp API key, zip code, and limit
    const yelpKey = "sHy9Gc5XgP9u3-Q919iLbJQ_jvzDuoz7kWnV-axjrEVNg5uvF3Q2mDPG1uMDoYSQKPNe2VmtZt82mLFCWzHJwhDgP64jiAHlR9PPNCGWZUoBH_0mZJFj16WH-YrzZXYx";
    localStorage.setItem('yelpKey', yelpKey);
    const placesKey = "AIzaSyDekQjZnmtOgvPJybLzorOh7BmFKT4SAFs";
    localStorage.setItem('placesKey', placesKey);
    const limit = 3;
    const term = 'donut';
    // Define the base URL for Google Places API
    const googlePlacesURL = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?";
    const googlePlacesPhotoURL = "https://places.googleapis.com/v1/";
    // Fetches place_id from Google
    const fetchPlaceId = async (address) => {
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
    }
    // Fetches photo references from Google
    const fetchBusinessDetails = async (placeId) => {
        const detailsURL = new URL(`https://cors-anywhere.herokuapp.com/https://places.googleapis.com/v1/places/${placeId}?fields=photos,googleMapsUri&key=${placesKey}`);
        const response = await fetch(detailsURL);
        const data = await response.json();
        return { reference: data.photos[0].name, id: data.photos[0].placeId, googleMapsUri: data.googleMapsUri };
    }

    // Fetches photo from Google Places
    const fetchPhoto = async (photoReference) => {
        console.log(photoReference);
        const photoURL = new URL(googlePlacesPhotoURL + photoReference + '/media');
        photoURL.searchParams.append('maxHeightPx', '400');
        photoURL.searchParams.append('key', placesKey);
        return photoURL.href;
    }
    // Function to fetch reviews for each business
    const fetchReviews = async (businesses) => {
        console.log('Fetching reviews...');
        console.log(businesses);
        // Iterate through each business
        for (const business of businesses) {
            const reviewsURL = `https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/${business.id}/reviews?limit=3&sort_by=yelp_sort`;
            console.log(business);
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
                // Log reviews for the current business
                console.log('Reviews for', business.name + ':', data.reviews);
            } catch (error) {
                // Handle errors if fetching reviews fails
                console.error('Error fetching reviews:', error);
            }
        }
        console.log('Reviews fetching complete.'); // Log completion of reviews fetching
    };
    // Function to fetch reviews for a single business
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
            throw error;
        }
    };
    // Function to fetch businesses from Yelp API
    const fetchBusinesses = async (zip) => {
        const listURL = new URL(queryURL);
        listURL.searchParams.append('limit', limit);
        listURL.searchParams.append('term', term);
        listURL.searchParams.append('location', zip);
        // Fetch businesses data from Yelp API
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
            // Extract JSON data from the response
            const data = await response.json();
            // Return null if no businesses are found
            if (!data.businesses || data.businesses.length === 0) {
                console.log('No businesses found.');
                return null;
            }
            // Return the array of business
            const businesses = data.businesses;

            // Array to store the final result
            const result = [];

            // Iterate through each business
            for (const business of businesses) {
                const address = business.location.address1;
                const placeId = await fetchPlaceId(business.location.address1 + ' ' + business.location.city + ' ' + business.location.state + ' ' + business.location.zip_code);
                const businessDetails = await fetchBusinessDetails(placeId);
                const photoReference = businessDetails.reference;
                const photoURL = await fetchPhoto(photoReference);
                const addy = business.location.city + ', ' + business.location.state;
                const zip = business.location.zip_code;
                // Fetching reviews for the current business
                const reviews = await fetchBusinessReviews(business.id);

                // Adding the required data to the result array
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
            throw error;
        }
    };
    // Event listener for the search form
    $("#search").on("submit", function (event) {
        event.preventDefault();
        searchZip();
    });
    $("#history").change(function () {
        let selectedValue = $(this).find('option:selected').val();
        let parts = selectedValue.split(" -");
        let selectedZip = parts[1].trim();
        console.log("Change event triggered");
        searchZip(selectedZip);
    });


    $('#newSearch').click(function (e) {
        e.preventDefault();
        $('#modal').attr('open', '');
    });

    $('#close').click(function (e) {
        $('#modal').removeAttr('open');
    })
    // Function to search for businesses using the provided zip code
    async function searchZip(zip = $("#zip").val()) {
        console.log("searchZip called with zip:", zip);
        if (zip.length !== 5 || isNaN(zip)) {
            $('#error').css('visibility', 'visible');

        } else {
            $('#modal').removeAttr('open');

            // Fetch businesses using the provided zip code
            try {
                const businesses = await fetchBusinesses(zip);
                console.log(businesses);
                $('#error').css('visibility', 'hidden');
                addSearch(businesses[0].address, businesses[0].zip);
                displayResults(businesses);
            } catch (error) {
                console.error('Error:', error);
            };

        }
    }

    $(document).click(function(event) {
        if ($(event.target).closest('#modal article').length === 0 && $('#modal').attr('open')) {
            $('#modal').removeAttr('open');
        }
    });

    function updateSearchHistory() {
        let searchHistory = JSON.parse(localStorage.getItem('History')) || [];

        $("#history").empty();
        for (let i = 0; i < searchHistory.length; i++) {
            let option = $("<option>").text(searchHistory[i].city + " - " + searchHistory[i].zip);

            $("#history").append(option);
        }
    }

    function addSearch(city, zip) {
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


    // Function to display the results
    function displayResults(businesses) {
        // Clear the previous results
        for (let i = 0; i < businesses.length; i++) {
            // Create a new card for each business
            let card = $("<article>");
            let cardBody = $("<div>").addClass("container-fluid card-container");
            let yelpLink = $("<a>").attr("href", businesses[i].url);
            let cardTitle = $("<header>");
            yelpLink.text(businesses[i].name);
            cardTitle.append(yelpLink);
            // Create a new link for each business
            let googleMapsLink = $("<a>").attr("href", businesses[i].googleMapsUri);
            let img = $("<img>").attr("src", businesses[i].photoURL);
            let imgDiv = $("<div>").addClass("imgDiv grid");
            googleMapsLink.append(img);
            imgDiv.append(googleMapsLink);

            // Create a new div for reviews
            let reviewsContainer = $("<div>").addClass("accordian").attr("id", "myAccordion");;
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
            // Append the links and reviews to the card
            reviewsContainer.append(reviews);
            cardBody.append(imgDiv, reviewsContainer);
            card.append(cardTitle, cardBody);
            $("main").append(card); // Changed to append to body
        }
    }
    updateSearchHistory();
});
