// Go to https://cors-anywhere.herokuapp.com/corsdemo and click the button before opening application

// Define the base URL for Yelp API
const queryURL = "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?sort_by=best_match";
// Prompt the user to enter the Yelp API key, zip code, and limit
const apiKey = prompt('Enter Yelp API key');
const zip = prompt('Enter a zip code');
const limit = prompt('Enter limit');
const term = 'donut';

// Construct the URL for searching businesses using the provided parameters
const listURL = new URL(queryURL);
listURL.searchParams.append('limit', limit);
listURL.searchParams.append('term', term);
listURL.searchParams.append('location', zip);

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
        // Return the array of businesses
        return data.businesses;
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
            console.log('Location', business.location.address1, business.location.city, business.location.state, business.location.zip);
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
