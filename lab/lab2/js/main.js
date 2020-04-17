/* =====================
Lab 2: Geocoding and route calculation with Mapbox

So far, we've avoided doing complex operations on our GIS data. With
only front end tools at our disposal and a wide range of competencies
to develop, this is largely unavoidable in a single semester class. Luckily
enough, there now exist *free* online resources which can greatly reduce
the complexity of implementing some of these harder and more computationally
intensive tasks.

In this lab, we'll be using a few new features to actually plot out a route
from (roughly) where you are to a location you specify by typing in an address.

There are a few steps involved here. First, we'll go over (at a very high level)
these steps which the application must complete to be usable as a routing tool.
After that, a sequence of tasks will guide you through the process of building
this logic.

*Overview*

1. We need to know where we are currently (in the form of a lat/lng pair) so
    that we can plot this location and later use it as the origin for our route.
    Note: this has been provided for you. The application should automatically
    determine your location when you open it.
2. We'll need to find some way of converting the text from an input box into
    (at least one) lat/lng pair
3. With both an origin and a destination, we should be able to get directions
4. Directions should come back in a form which can be processed into a line which
    we can then plot on our map


*Tasks*

Task 0 (optional): Prepare your tools so that you can efficiently explore this problem

This could very well be the first complex set of API interactions you've had to
reason about. As is the case with most programming challenges, the faster you can
iterate on hypothesis creation ("I think this piece does X when I push Y")
and testing ("It looks like X only *sometimes* happens when I push Y"),
the easier your life will be and the faster you'll be able to solve problems. To
this end, there are some nifty tools directly integrated into many modern browsers
which allow us to rapidly prototype API requests.

I suggest Postman, which is available for free in the chrome app store. It provides
a cleaner, easier way to test ajax calls than simply using the console.


Task 1: Use Mapbox's 'Search' API to 'geocode' information from your input

The docs: https://docs.mapbox.com/api/search/#geocoding
(For this first task, the URL pattern you'll want to produce looks like this:
`https://api.mapbox.com/geocoding/v5/mapbox.places/{geocode_this}.json?access_token={your_mapbox_token}`)

You might note that this task is slightly underspecified: there are multiple different
ways to transform text into an address. For the lab, the simplest form of geocoding
(i.e. without any further options being specified) is entirely appropriate. More complex
applications or geocoding needs might require playing with the parameters mentioned in
documentation.

A familiar refrain: experiment with this API and come to an understanding of how
it works BEFORE writing code you expect to use it. This can be done in the console or
in a REST client like Postman mentioned above.

Questions you should ask yourself:
  - What are the inputs?
  - How does the output look?
  - What can I do with the output?
  - Can I get a lat/lng from the output?


Task 2: Use Mapbox's 'Navigation' API to generate a route based on your origin and destination

The docs: https://docs.mapbox.com/api/navigation/#directions
(No example url provided, try to figure it out using the docs)

Again, the task is somewhat underspecified. Let's start with the simplest routing
option available. Once you're getting a valid (as best you can tell) response
from the server, move to the next task.


Task 3: Decode your route response

Intrepid readers may have already discovered that route responses are NOT
in the familiar GeoJSON format. To see what I mean, look at the `geometry` property
of each `route` provided by the Mapbox `direction` response. Rather, they use a
special encoding standardized by google to try and cut down on response sizes and
response times. Relevant docs may be found here:
https://developers.google.com/maps/documentation/utilities/polylineutility

The string you'll have to decode will look something like this:
`ee~jkApakppCmPjB}TfCuaBbQa|@lJsd@dF|Dl~@pBfb@t@bQ?tEOtEe@vCs@xBuEfNkGdPMl@oNl^eFxMyLrZoDlJ{JhW}JxWuEjL]z@mJlUeAhC}Tzi@kAv`...

A mapbox library for decoding these polylines is included for decoding these into
an array of lat/lng coordinates from which a line can be constructed.
Simply call `polyline.decode` on the polyline encoding.
https://github.com/mapbox/polyline

To plot these on the map, write a function to convert them to GeoJSON. Remember:
GeoJSON is just an agreed upon format to storing shapes in JSON. Take a look
at what GeoJSON for a line looks like (you may want to create a line on geojson.io
as an example). How can you convert the array of points into the GeoJSON format?
Hint: GeoJSON defines points as [lng, lat] instead of [lat, lng], so you may need
to flip your coordinates.


Task 4: Plot your route to the map

If you've completed step 3 with valid GeoJson (test it at geojson.io), plotting it
to the map should be a breeze.


Task 5 (stretch): Display travel time (seconds and minutes) and distance (km or mi)

Task 6 (stretch): Refocus the map to roughly the bounding box of your route


===================== */

var token='pk.eyJ1IjoibGl6aXF1biIsImEiOiJjazhnZG1kOGkwMGlwM2VwbmVqNXd5eGhjIn0.Pd66q4rj8ncYTNtcFGxUGQ'
var origin;
var destination;

var state = {
  position: {
    marker: null,
    updated: null,
    line: null
  }
};

/* We'll use underscore's `once` function to make sure this only happens
 *  one time even if weupdate the position later
 */
var goToOrigin = _.once(function(lat, lng) {
  map.flyTo([lat, lng], 14);
});


/* Given a lat and a long, we should create a marker, store it
 *  somewhere, and add it to the map
 */
var updatePosition = function(lat, lng, updated) {
  if (state.position.marker) { map.removeLayer(state.position.marker); }
  state.position.marker = L.circleMarker([lat, lng], {color: "blue"});
  state.position.updated = updated;
  state.position.marker.addTo(map);
  goToOrigin(lat, lng);
};

$(document).ready(function() {
  /* This 'if' check allows us to safely ask for the user's current position */
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
      origin=[position.coords.latitude,position.coords.longitude];
      updatePosition(position.coords.latitude, position.coords.longitude, position.timestamp);
    });
  } else {
    alert("Unable to access geolocation API!");
  }


  /* Every time a key is lifted while typing in the #dest input, disable
   * the #calculate button if no text is in the input
   */
  $('#dest').keyup(function(e) {
    if ($('#dest').val().length === 0) {
      $('#calculate').attr('disabled', true);
    } else {
      $('#calculate').attr('disabled', false);
    }
  });

  // click handler for the "calculate" button (probably you want to do something with this)
  // add the time and value
  var jhtml=$.parseHTML(`<h3 class="Distance"></h3><h3 class="Time"></h3>`)
  $(".sidebar").append(jhtml);
  //generate the route
  $("#calculate").click(function(e) {
    //plot the destination point
    var destination_value = $('#dest').val();
    console.log(destination_value);
    var request = `https://api.mapbox.com/geocoding/v5/mapbox.places/${destination_value}.json?access_token=${token}`;
    $.ajax({method:'GET',url:request}).done(function(data){
      destination = data;
      var destination_coor=destination.features[0].geometry.coordinates;
      L.circleMarker([destination_coor[1],destination_coor[0]],{color:"red"}).addTo(map);
    //plot the route
      var dirRequest = `https://api.mapbox.com/directions/v5/mapbox/walking/${origin[1]},${origin[0]};${destination_coor[0]},${destination_coor[1]}.json?access_token=${token}`;
      $.ajax(dirRequest).done(function(directions){
         var route = turf.lineString(polyline.decode(directions.routes[0].geometry));
         var lines = polyline.decode(directions.routes[0].geometry);
         lines=_.map(lines,function(coordinates){return [coordinates[1],coordinates[0]];});
         var myStyle = {
           "color":'#ff7800',
           "weight":5,
           "opacity":0.65
         };
         L.geoJSON(turf.lineString(lines),{
           style:myStyle
         }).addTo(map);
      //set the viewport
        var bbox= turf.bbox(turf.lineString(lines));
        map.fitBounds([
          [bbox[1],bbox[0]],
          [bbox[3],bbox[2]]
        ])
      //plot the distance and Duration
         $(".Distance").text(`Distance:${directions.routes[0].distance} meters`)
         $(".Time").text(`Duration:${directions.routes[0].duration} seconds`)
       });
    });
  });

});
