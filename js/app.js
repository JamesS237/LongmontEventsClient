serverURL = 'http://leserver.jacksonroberts.me/';
function insertIntoList(data) {
	console.log(data);
	var event_string = "<h3>" + data.title + "</h3>";
	event_string += "<p> Address: " + data.address + "</p>";
	event_string += "<p> Date: " + data.date + "</p>";
	event_string += "<p> Description: " + data.description.slice(0,140) + "...</p>"
	event_string += "<a id=\"eventdetails\" href=\"#" + data.identifier + "\" class=\"btn btn-info\"><span class=\"glyphicon glyphicon-eye-open\"></span> More Info</a>";
	event_string += "<hr>";

	$('#list').append(event_string);
}
function loadMyEvents() {
	idList = store.get('goingList');
	for (i = 0; i < idList.length; i++){
		var apiURL = serverURL + 'api/getevent/' + idList[i] + '/';
		$.getJSON(apiURL, function(data) {
			string = "<h3><a href=\"#" + data.identifier + "\" id='eventdetails'>" + data.title + "</a></h3>";
			$('#myevents').append(string);
		});
	}
}
function loadEvents(date) {
	$('#list').html('');
	if (typeof markers !== 'undefined') {
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
		console.log('clearing');
	} else {
		markers = [];
	}
	if (typeof date == 'undefined') {
		var currentDate = new Date();
	} else {
		var splitDate = date.split('/');
		var currentDate = new Date(splitDate[2], splitDate[0] - 1, splitDate[1])
	}

	var year = currentDate.getFullYear();
	var month = currentDate.getMonth() + 1;
	var day = ('0' + currentDate.getDate()).slice('-2');

	var dateString = month + '/' + day + '/' + year;
	$('#datepicker').val(dateString);

	var apiURL = serverURL + 'api/getevents/' + year + '/' + month + '/' + day + '/';
	$.getJSON(apiURL, function(data) {
		function dropPin(latlng, title, id) {
			var marker = new google.maps.Marker({
				position: latlng,
				map: map,
				title: title,
				url: id,
			});
			markers.push(marker);
			console.log('dropped pin');
			google.maps.event.addListener(marker, 'click', function() {loadEventPage(marker.url);
			$('.row').hide();
			$('hr').hide();});
		}
		if (data.length != 0) {
			$('#noeventsfortoday').hide();
			console.log(data.length);
			for (var i = 0; i < data.length; i++) {
				codeAddress(data[i], dropPin);
				insertIntoList(data[i]);
			}
		} else {
			$('#noeventsfortoday').show();
		}
	});
}
//do the main event loading
var map;
function initialize() {
	console.log(store.getAll());
	if (typeof(store.get('goingList')) == 'undefined') {
		store.set('goingList', {going: []});
		console.log('made it');
	} else {
		console.log('didnt');
	}
	geocoder = new google.maps.Geocoder();
	console.log('initialized map and geocoder');
	var mapOptions = {
		zoom: 13,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	 };
	 map = new google.maps.Map(document.getElementById('map-canvas'),
	  mapOptions);
	 loadEvents();
	 loadMyEvents();
}

google.maps.event.addDomListener(window, 'load', initialize);

function codeAddress(data, callback) {
	geocoder.geocode({'address': data.address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			callback(results[0].geometry.location, data.title, data.identifier);
		}
	});
}
function loadEventPage(id) {
	console.log('LOADING FOR EVENT ' + id);
	var apiURL = serverURL + 'api/getevent/' + id + '/';
	$('#eventpage').show();
	$('#star').attr('class', 'glyphicon glyphicon-star-empty');
	$('#imgoing').attr('class', 'btn btn-lg btn-warning btn-block');
	$('#imgoing').attr('data-isactive', 'false');

	console.log(store.get('goingList'));
	goingList = store.get('goingList');

	if (goingList.going.indexOf(String(id)) > -1) {
		$('#star').attr('class', 'glyphicon glyphicon-star');
		$('#imgoing').attr('class', 'btn btn-lg btn-success btn-block');
		$('#imgoing').attr('data-isactive', 'true');
	}
	$.getJSON(apiURL, function(data) {
		console.log(data);
		$('#title').text(data.title);
		$('#address').append(data.address + '<br>' + '<a class="btn btn-success btn-sm" href="http://maps.apple.com/?q=' + data.address + '"><span class="glyphicon glyphicon-map-marker"></span> Open in Maps</a>');
		$('#date').append(data.date);
		$('#description').append(data.description);
		$('#imgoing').attr('data-id', id);
		if (data.going_count == 1) {
			var suffix = ' person is going.';
		} else {
			var suffix = ' people are going.'
		}
		$('#goingcount').text(data.going_count + suffix)
	});
}
$('#maplink').click(function() {
	setTimeout(function() {
		google.maps.event.trigger(map, 'resize');
		var latitude = 40.1639404;
		var longitude = -105.100502;
		var reCenter = new google.maps.LatLng(latitude, longitude);
		map.setCenter(reCenter);
		map.setZoom(12);
	}, 1);
});
var today = new Date();
$("#datepicker").datepicker({
	onSelect: function(dateText) {
		loadEvents(dateText);
	},
	minDate: today,
});
$('#list').on("click", "#eventdetails", function() {
	$('.row').hide();
	$('hr').hide();
	var id = $(this).attr('href').substring(1);
	loadEventPage(id);
});
$('#myevents').on("click", "#eventdetails", function() {
	$('.row').hide();
	$('hr').hide();
	var id = $(this).attr('href').substring(1);
	loadEventPage(id);
});
$('#backbutton').click(function() {
	$('.row').show();
	$('hr').show();
	$('#eventpage').hide();

	$('#title, #address, #date, #description').html('');
});
$('#cal').click(function() {
	$('#datepicker').focus();
});
$('#imgoing').click(function() {
	if ($(this).attr('data-isactive') != 'true') {
		var apiURL = serverURL + 'api/imgoing/' + $(this).attr('data-id') + '/';
		$.getJSON(apiURL, function(data) {
			console.log(data);
		});
		$('#imgoing').attr('data-isactive', 'true');
		$('#star').attr('class', 'glyphicon glyphicon-star');
		$('#imgoing').attr('class', 'btn btn-lg btn-success btn-block');
		var newGoingCount = parseInt($('#goingcount').text()) + 1;
		if (newGoingCount == 1) {
			suffix = ' person is going.';
		} else {
			suffix = ' people are going.';
		}
		$('#goingcount').text(newGoingCount + suffix);
		goingList = store.get('goingList').going;
		goingList.push($(this).attr('data-id'));
		store.set('goingList', {going: goingList});
		//localStorage.getItem('going-list');
		loadMyEvents();
	}
});