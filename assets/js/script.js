/*
go to https://cors-anywhere.herokuapp.com/corsdemo and click the button before opening application
*/

let zip = '90210';

let queryURL = "https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?limit=5"; //bypass CORS errors using CORS Anywhere
let apiKey = 'N4oz6qWW8EnrgxxMt05QXdKKTbGlj8zBBTh5m2MYD6sENyqKsnhYZYrwbqktNihoJgNdcLx4doKQhdnfBeds-M2e89aJ7M5CUmSxYfhXPbGUMGY78RgM2AOKZuTwZXYx'
$.ajax({
    url: queryURL,
    method: "GET",
    headers: {
        "accept": "application/json",
        "x-requested-with": "xmlhttprequest",
        "Access-Control-Allow-Origin": "*",
        "Authorization": `Bearer ${apiKey}`
    },
    data: {
        term: 'donut',
        location: zip
    }
}).done(function (data) {
    console.log(data);
    for (let i = 0; i < data.businesses.length; i++) {
        console.log('business', data.businesses[i].id, data.businesses[i].name) //id used for another yelp call for reviews. business name displayed to user
        console.log('address:', data.businesses[i].location.address1, data.businesses[i].location.city, data.businesses[i].location.zip_code) //address used for places call
    }
});