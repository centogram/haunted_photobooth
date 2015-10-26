function getFormattedDate() {
	var date = new Date();
	var str = date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate() + "-" + date.getHours() + "." + date.getMinutes() + "." + date.getSeconds();

	return str;
}

var doFlash = function() {
	//
}

var magnifyThem = function() {
	$('.popup').magnificPopup({
		type: 'image',
		closeOnContentClick: true,
		closeBtnInside: false,
		fixedContentPos: true,
		mainClass: 'mfp-no-margins mfp-with-zoom', // class to remove default margin from left and right side
		gallery: {
			enabled: true,
			navigateByImgClick: true,
			preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
		},
		image: {
			verticalFit: true
		},
		zoom: {
			enabled: true,
			duration: 300 // don't foget to change the duration also in CSS
		}
	});
}

var scrollToSelected = function(strip) {
	var top = $("#photo-strips a.selected").offset().top;
	/*$('html,body').animate({
		scrollTop: top
	},100);*/
	$(window).scrollTop(top);
	//console.log("scrolling to " + top);
};
var scrollToTop = function(strip) {
	/*	$('html,body').animate({
			scrollTop: 0
		},100);
		*/
	$(window).scrollTop(0);
	//console.log("scrolling to top");
};

var anythingSelected = function() {
	return $("#photo-strips a.selected").length ? true : false;
}
var selectFirst = function() {
	$("#photo-strips a.selected").removeClass('selected');
	$("#photo-strips a").first().addClass("selected");
}
var selectLast = function() {
	$("#photo-strips a.selected").removeClass('selected');
	$("#photo-strips a").last().addClass("selected");
}

var selectNext = function() {
	$("#photo-strips a.selected").removeClass('selected').next().addClass("selected");
}
var selectPrev = function() {
	$("#photo-strips a.selected").removeClass('selected').prev().addClass("selected");
}

var closeAndGotoLatest = function() {
	var magnificPopup = $.magnificPopup.instance;
	magnificPopup.close();
	selectLast();
	$("#photo-strips a.selected").click();
};

var enlarge = function() {
	console.log("enlarge");
	if (!$.magnificPopup.instance.isOpen) {
		$("#photo-strips a.selected").click();
	} else {
		var magnificPopup = $.magnificPopup.instance;
		magnificPopup.close();
	}
};

var moveRight = function() {
	if (anythingSelected()) {
		if ($("#photo-strips a").last().hasClass("selected")) {
			scrollToSelected();
		} else {
			selectNext();
			scrollToSelected();
		}
	} else {
		scrollToTop();
		selectFirst();
	}
}
var moveLeft = function() {
	if (anythingSelected()) {
		if ($("#photo-strips a").first().hasClass("selected")) {
			scrollToTop();
		} else {
			selectPrev();
			scrollToSelected();
		}
	} else {
		scrollToTop();
	}
}

App = {
	blank_photo: "/themes/2010/images/pixel.png",
	photos_to_take: 4,
	photo_id: null,
	timer: 3,
	in_progress: false,

	countdown: function() {
		App.in_progress = true;

		if (App.timer == 3) {
			$('#status').attr('original', $('#status').html());
			//$('#photo-strips').hide();
		}

		if (App.timer > 0) {
			$('#status').html("Get ready! I'm going to start <br/>in " + App.timer + " Seconds");
			setTimeout(function() {
				App.timer = App.timer - 1;
				App.countdown();
			}, 1000);
		} else {
			$('#status').text('Ok, Say "cheese"!');
			App.take_photo(1);
			App.timer = 3;
		}
	},

	take_photo: function(current_photo) {
		// new photo
		if (current_photo == 1) {
			App.photo_id = getFormattedDate();
		}
		doFlash();

		$.get('index.php?action=take_photo&id=' + App.photo_id + '&photos_to_take=' + App.photos_to_take, function(data) {
			var d = Math.random() * 20 - 20;
			$('#photos').append('<img src="' + data.photo_src + '" alt="" style="-webkit-transform:rotate(' + d + 'deg);-moz-transform:rotate(' + d + 'deg);" />');
			if (current_photo == App.photos_to_take) {
				App.combine_and_finish();
			} else {
				var remaining = App.photos_to_take - current_photo;
				$('#status').text('Keep smiling. ' + remaining + " more to go!");
				setTimeout(function() {
					App.take_photo((current_photo + 1));
				}, 3500);

			}
		}, 'json');
	},

	combine_and_finish: function() {
		$('#status').text("You were awesome. Now give me a sec to prep them...");

		setTimeout(function() {
			$.get('index.php?action=combine_and_finish&id=' + App.photo_id, function(data) {

				// add new photo strip the the pile
				var d = Math.random() * 8 + 1;
				var $html = $('<a class="brick popup" href="' + data.photo_src + '"><img src="' + data.photo_src + '" alt="" style="-webkit-transform:rotate(-' + d + 'deg);-moz-transform:rotate(-' + d + 'deg);" /></a>');

				// show success message
				$('#status').text("Ok, your photos were sent to the printer...");

				// wait a couple seconds and clean up
				setTimeout(function() {
					//window.location.reload(); return;
					App.timer = 3;
					App.in_progress = false;
					var $status = $('#status');
					$status.html($status.attr('original'));
					$('#photos img').remove();
					$('#photo-strips').append($html).isotope('appended', $html, true);
					magnifyThem();
					setTimeout(closeAndGotoLatest, 1000);
				}, 3000);
			}, 'json');
		}, 2000);

	},

	init: function() {
		$(window).load(function() {
			magnifyThem();
			$.each($('#photo-strips img'), function(i, img) {
				var d = Math.random() * 8 + 1;
				if (Math.floor(Math.random() * 2 + 1) == 1) {
					d *= -1;
				}
				$(img).css({
					'-webkit-transform': 'rotate(-' + d + 'deg)',
					'-moz-transform': 'rotate(-' + d + 'deg)'
				});
			});
			$('#photo-strips').isotope({
				resizeable: true,
				itemSelector: '.brick',
				columnWidth: 150,


			});
		});

		$(window).keydown(function(e) {
			if (App.in_progress) return;

			var photo_count = 0;

			switch (e.which) {
				case 69:
					enlarge();
					break;
				case 37: // left
					moveLeft();
					break;
				case 38: // up
					moveLeft();
					break;
				case 39: // right
					moveRight();
					break;
				case 40: // down
					moveRight();
					break;
				case 84:
					var magnificPopup = $.magnificPopup.instance;
					magnificPopup.close();
					//scrollToTop();
					photo_count = 4;
					break;
				default:
					console.log(e.keyCode);

			}

			// the numbers 1-9 = keyCodes 49-57
			if (photo_count > 0) {
				App.photos_to_take = photo_count;
				App.countdown();
				return;
			}
		});



		$(document).ready(function() {
			// start taking photos when a number key is pressed
			// take photo button
			$('.take-photo').click(function() {
				App.photos_to_take = 4;
				App.countdown();
				return false;
			});
			Webcam.set({
        width: 320,
        height: 180,
        fps: 45
    	});
			Webcam.attach('#my-camera');
		});
	}
};
