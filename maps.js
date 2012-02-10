Location = function() {}

RealEstateMap = function(element) {
    var me = this;
	me.geocoder = new google.maps.Geocoder();
	me.distance_service = new google.maps.DistanceMatrixService();
	var myOptions = {
		center: new google.maps.LatLng(-34.397, 150.644),
		zoom:   12,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}
	me.map = new google.maps.Map(element, myOptions);
	me.destinations = [];
	me.houses = [];
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
    var me = this;
	me.geocoder.geocode({'address': destination}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			var marker = new google.maps.Marker({
				icon: "http://www.googlemapsmarkers.com/v1/7CFC00",
				map:	me.map,
				position: results[0].geometry.location,
			});
			var loc = me.make_loc_object(marker, results[0].formatted_address, results[0].geometry.location);
			me.destinations.push(loc);
			me.update_house_distances(loc);
		}
	});
}

RealEstateMap.prototype.add_house = function(house) {
    var me = this;
	me.geocoder.geocode({'address': house}, function(results, status) {
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
    var me = this;
	var house_strings = [];
	for (var i = 0; i < me.houses.length; i++) {
		house_strings.push(me.houses[i].name);
	}
    if (house_strings.length == 0) {
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
				content = me.append_time_to_content(dest.name, distance, time, content);
				loc.infoWindow.setContent(content);
			}
		}
	});
}

RealEstateMap.prototype.append_time_to_content = function(dest_name, distance, time, content) {
	content = content + "<h4>" + dest_name + "</h4>";
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
				var dest_name = dest_strings[i];
				content = me.append_time_to_content(dest_name, distance, time, content);
				house.infoWindow.setContent(content);
			}
		}
	});
}
