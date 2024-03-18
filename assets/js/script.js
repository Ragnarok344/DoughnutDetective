// Go to https://cors-anywhere.herokuapp.com/corsdemo and click the button before opening application

$(document).ready(function () {
    // Define the base URL for Yelp API
    const queryURL = "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?";
    // Prompt the user to enter the Yelp API key, zip code, and limit
    const yelpKey = localStorage.getItem('yelpKey') || prompt('Enter Yelp API key');
    localStorage.setItem('yelpKey', yelpKey);
    const placesKey = localStorage.getItem('placesKey') || prompt('Enter Places API key');
    localStorage.setItem('placesKey', placesKey);
    const zip = prompt('Enter a zip code');
    const limit = 3;
    const term = 'donut';
    // Define the base URL for Google Places API
    const googlePlacesURL = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?";
    const googlePlacesPhotoURL = "https://places.googleapis.com/v1/";

    // Construct the URL for searching businesses using the provided parameters
    const listURL = new URL(queryURL);
    listURL.searchParams.append('limit', limit);
    listURL.searchParams.append('term', term);
    listURL.searchParams.append('location', zip);

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
        const photoURL = new URL(googlePlacesPhotoURL + photoReference.reference + '/media');
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
    const fetchBusinesses = async () => {
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

                // Fetching reviews for the current business
                const reviews = await fetchBusinessReviews(business.id);

                // Adding the required data to the result array
                result.push({
                    photoURL: photoURL,
                    name: business.name,
                    url: business.url,
                    reviews: reviews,
                    googleMapsUri: businessDetails.googleMapsUri // Include googleMapsUri
                });
            }

            return result;
        } catch (error) {
            // Handle errors if fetching businesses fails
            console.error('Error fetching businesses:', error);
            throw error;
        }
    };

    // Call the fetchBusinesses function to fetch businesses, then call fetchReviews with the retrieved businesses
    fetchBusinesses()
        .then(result => {
            // Log or process the result as needed
            console.log(result);
        })
        .catch(error => {
            // Handle errors from fetchBusinesses
            console.error('Error:', error);
        });
});