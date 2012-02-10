Location = function() {}

RealEstateMap = function(element_name) {
    var me = this;
	me.geocoder = new google.maps.Geocoder();
	me.distance_service = new google.maps.DistanceMatrixService();
	var myOptions = {
		center: new google.maps.LatLng(-34.397, 150.644),
		zoom:   12,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	me.map = new google.maps.Map(document.getElementById(element_name), myOptions);
	me.destinations = [];
	me.houses = [];
    alert("done initializing map");
}

RealEstateMap.prototype = {};

RealEstateMap.prototype.make_loc_object = function (marker, addr, location) {
    var me = this;
	var myWindowOptions = {
    	content: "<h3>" + addr + "</h3>"
	};
	var infoWindow = new google.maps.InfoWindow(myWindowOptions);
	google.maps.event.addListener(marker, "click", function() {
		infoWindow.open(me.map, marker);
	});
	google.maps.event.addListener(infoWindow, "close", function() {
  	infoWindow.close();
	});
	me.map.setCenter(location);

	var loc = new Location();
	loc.marker = marker;
	loc.name = addr;
	loc.infoWindow = infoWindow;
	return loc;
}

RealEstateMap.prototype.add_destination = function(destination) {
	// Destinations are places that we want to record the distance to.
    alert("in add_destination");
    var me = this;
	me.geocoder.geocode({'address': destination}, function(results, status) {
        alert("in geocoder status");
		if (status == google.maps.GeocoderStatus.OK) {
            alert('geocoder response ok');
			var marker = new google.maps.Marker({
				icon: "http://www.googlemapsmarkers.com/v1/7CFC00",
				map:	me.map,
				position: results[0].geometry.location,
			});
			var loc = me.make_loc_object(marker, results[0].formatted_address, results[0].geometry.location);
            alert("made loc object, adding to destinations");
			me.destinations.push(loc);
            alert("destinations length is now" + me.destinations.length);
			me.update_house_distances(loc);
		}
	});
}

RealEstateMap.prototype.add_house = function(house) {
    var me = this;
	me.geocoder.geocode({'address': destination}, function(results, status) {
		var marker = new google.maps.Marker({
			map: me.map,
			position: results[0].geometry.location,
		});
		var loc = me.make_loc_object(marker, results[0].formatted_address);
		me.houses.push(loc);
		me.populate_new_house(loc);
	});
}

RealEstateMap.prototype.update_house_distances = function(dest) {
    alert("in update house distances");
    var me = this;
    alert("destinations length is " + me.destinations.length);
    alert("updating for " + dest.name);
	var house_strings = [];
	for (var i = 0; i < me.houses.length; i++) {
		house_strings.push(me.houses[i].name);
	}
    if (house_strings.length == 0) {
        alert("no house strings, not updating");
        return;
    }

	me.distance_service.getDistanceMatrix({
		origins: house_strings,
		destinations: [dest.name],
		travelMode: google.maps.TravelMode.DRIVING,
		unitSystem: google.maps.UnitSystem.IMPERIAL,
		avoidHighways: false,
		avoidTolls: false
	}, function(response, status) {
		if (status == google.maps.DistanceMatrixStatus.OK) {
			for (var i = 0; i < response.rows.length; i++) {
				var row = response.rows[i];
				// we should only have one destination in each row, so just take the first one.
				var element = row.elements[0];
				var distance = element.distance.text;
				var time = element.duration.text;
				var loc = me.houses[i];
				content = loc.infoWindow.getContent();
				content = me.append_time_to_content(distance, time, content);
				loc.infoWindow.setContent(content);
			}
		}
	});
}

RealEstateMap.prototype.append_time_to_content = function(distance, time, content) {
 	content = content + "<p><b>distance: </b>" + distance + "</p>";
	content = content + "<p><b>time: </b>" + time + "</p>";
	return content;
}

RealEstateMap.prototype.populate_new_house = function(house) {
    var me = this;
	var dest_strings = [];
	for (var i = 0; i < me.destinations.length; i++) {
		dest_strings.push(me.destinations[i].name);
	}
	me.distance_service.getDistanceMatrix({
		origins: [house.name],
		destinations: dest_strings,
		travelMode: google.maps.TravelMode.DRIVING,
		unitSystem: google.maps.UnitSystem.IMPERIAL,
		avoidHighways: false,
		avoidTolls: false
	}, function(response, status) {
		if (status == google.maps.DistanceMatrixStatus.OK) {
			// should only have one row
			var row = response.rows[0];
			for (var i = 0; i < row.elements.length; i++) {
				var element = row.elements[i];
				var distance = element.distance.text;
				var time = element.duration.text;
				content = house.infoWindow.getContent();
				content = me.append_time_to_content(distance, time, content);
				house.infoWindow.setContent(content);
			}
		}
	});
}
