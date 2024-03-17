// Go to https://cors-anywhere.herokuapp.com/corsdemo and click the button before opening application

// Define the base URL for Yelp API
const queryURL = "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?";
// Prompt the user to enter the Yelp API key, zip code, and limit
const apiKey = prompt('Enter Yelp API key');
const googleApiKey = prompt('Enter Places API key');
const zip = prompt('Enter a zip code');
const limit = 3;
const term = 'donut';
// define the base url for google places api
const googlePlacesURL = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?";//how-to.dev/api/user", {
    
const googlePlacesPhotoURL = "https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/photo?";


// Construct the URL for searching businesses using the provided parameters
const listURL = new URL(queryURL);
listURL.searchParams.append('limit', limit);
listURL.searchParams.append('term', term);
listURL.searchParams.append('location', zip);

// fetches place_id from google
const fetchPlaceId = async (address) => {
    const placeURL = new URL(googlePlacesURL);
    placeURL.searchParams.append('query', 'donuts ' + address);
    placeURL.searchParams.append('radius', '5');
    placeURL.searchParams.append('key', googleApiKey);

    const response = await fetch(placeURL);
    const data = await response.json();
    console.log(data);
    return data.results[0].place_id;
}
//fetches photo references from google
const fetchPhotoReference = async (placeId) => {
    const detailsURL = new URL(`https://places.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photo&key=${googleApiKey}`);
    const response = await fetch(detailsURL);
    const data = await response.json();
    return data.result.photos[0].photo_reference;
}
//fetches photo from google places
const fetchPhoto = async (photoReference) => {
    const photoURL = new URL(googlePlacesPhotoURL);
    photoURL.searchParams.append('maxwidth', '400');
    photoURL.searchParams.append('photoreference', photoReference);
    photoURL.searchParams.append('key', googleApiKey);

    return photoURL.href; 
}

// Function to fetch businesses from Yelp API
const fetchBusinesses = async () => {
    try {
        const response = await fetch(listURL, {
            method: "GET",
            headers: {
                "accept": "application/json",
                "x-requested-with": "xmlhttprequest",
                "Access-Control-Allow-Origin": "*",
                "Authorization": `Bearer ${apiKey}`
            },
        });
        // Extract JSON data from the response
        const data = await response.json();
        //return the array of business
        const businesses = data.businesses;
       // log the business
        for (const business of businesses) {
            const address = business.location.address1
            const placeId = await fetchPlaceId(address.substring(1, address.length - 1) + ' ' + business.location.city + ' ' + business.location.state + ' ' + business.location.zip);
            // const photoReference = await fetchPhotoReference(placeId);
            // const photoURL = await fetchPhoto(photoReference);

            // Create an img element and set its src to the photo URL
            const img = document.createElement('img');
            img.src = photoURL;
            // Append the img element to the body of the document
            document.body.appendChild(img);
        }
    } catch (error) {
        // Handle errors if fetching businesses fails
        console.error('Error fetching businesses:', error);
        throw error;
    }
};


// Function to fetch reviews for each business
const fetchReviews = async (businesses) => {
    console.log('Fetching reviews...');
    // Iterate through each business
    for (const business of businesses) {
        const reviewsURL = `https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/${business.id}/reviews?limit=3&sort_by=yelp_sort`;
        try {
            // Fetch reviews data from Yelp API
            const response = await fetch(reviewsURL, {
                method: "GET",
                headers: {
                    "accept": "application/json",
                    "x-requested-with": "xmlhttprequest",
                    "Access-Control-Allow-Origin": "*",
                    "Authorization": `Bearer ${apiKey}`
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

// Call the fetchBusinesses function to fetch businesses, then call fetchReviews with the retrieved businesses
fetchBusinesses()
    .then(fetchReviews)
    .catch(error => {
        // Handle errors from fetchBusinesses or fetchReviews
        console.error('Error:', error);
    });
