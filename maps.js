var geocoder;
var distance_service;
var starting_point = "Cal Poly Pomona";
var markers = [];
var map;
var starting_point_results;

function initialize() {
  geocoder = new google.maps.Geocoder();
  distance_service = new google.maps.DistanceMatrixService();
  var myOptions = {
    center: new google.maps.LatLng(-34.397, 150.644),
    zoom: 12,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"),
      myOptions);
  geocoder.geocode( {'address': starting_point}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
          starting_point_results = results[0];
      }
      addLocation(results, status);
  });
  var add_form = "<h3>Add a place</h3>";
  add_form = add_form + "<label for='address'>Address:</label>";
  add_form = add_form + "<input type='text' name='address' id='address' />"; 
  add_form = add_form + "<input type='submit' value='Submit' onclick='handleFormSubmit()'/>";
  var add_window = new google.maps.InfoWindow({content: add_form});
  google.maps.event.addListener(map, "click", function(mouseevent) {
    add_window.open(map);
    add_window.setPosition(mouseevent.latLng);
  });
}

function handleFormSubmit() {
  address = document.getElementById("address").value;
  document.getElementById("address").value = "";
  geocoder.geocode( {'address': address}, addLocation);
}

function addLocation(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
          var marker = new google.maps.Marker({
              map: map,
              position: results[0].geometry.location
          });
          markers.push(marker);
          var addr = results[0].formatted_address;
          var myWindowOptions = {
              content: "<h3>" + addr + "</h3>"
          };
          var infoWindow = new google.maps.InfoWindow(myWindowOptions);
          google.maps.event.addListener(marker, "click", function() {
              infoWindow.open(map, marker);
          });
          google.maps.event.addListener(infoWindow, "close", function() {
              infoWindow.close();
          });
          map.setCenter(results[0].geometry.location);
          addDistances(addr, infoWindow);
      }
}
function addDistances(address, infoWindow) {
  distance_service.getDistanceMatrix(
      {
          origins: [address],
          destinations: [starting_point],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.IMPERIAL,
          avoidHighways: false,
          avoidTolls: false
      }, function(response, status) {
          if (status == google.maps.DistanceMatrixStatus.OK) {
              var element = response.rows[0].elements[0];
              var distance = element.distance.text;
              var time = element.duration.text;
              content = infoWindow.getContent();
              content = content + "<p><b>distance: </b>" + distance + "</p>";
              content = content + "<p><b>time: </b>" + time + "</p>";
              infoWindow.setContent(content);
          }
      });
}
