function getFormattedDate() {
	var date = new Date();
	var str = date.getFullYear() + "." + (date.getMonth() + 1) + "." + date.getDate() + "-" + date.getHours() + "." + date.getMinutes() + "." + date.getSeconds();
	return str;
}

var doBeep = function() {
	var beep = document.createElement('audio');
	beep.setAttribute('src', '/sounds/beep.mp3');
	beep.setAttribute('autoplay', 'autoplay');
	beep.play();
}

var doFlash = function() {
	$("#photos").addClass("flash");
	var shutter = document.createElement('audio');
	shutter.setAttribute('src', '/sounds/shutter.mp3');
	shutter.setAttribute('autoplay', 'autoplay');
	shutter.play();
	setTimeout(function() {
		$("#photos").removeClass("flash");
	}, 100);
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

var scrollToSelected = function(animated) {
	var top = $("#photo-strips a.selected").offset().top;
	if (animated) {
		$('html, body').animate({
			scrollTop: top
		}, 500);
	} else {
		$(window).scrollTop(top);
	}

};
var scrollToTop = function() {
	$(window).scrollTop(0);
};

var selectRandom = function() {
	if (App.in_progress) return;
	var random = Math.floor(Math.random() * $("#photo-strips a").length);
	closePopup();
	$("#photo-strips a.selected").removeClass('selected');
	$("#photo-strips a").eq(random).addClass("selected");
	scrollToSelected(true);
	clickSelected();
}
var randomInterval = false;
var randomSelect = function() {
	clearInterval(randomInterval);
	randomInterval = setInterval(selectRandom, 20000);
}
var clickTimeout = false;
var doTheClick = function() {
	$("#photo-strips a.selected").click();
}
var clickSelected = function() {
	clearTimeout(clickTimeout);
	clickTimeout = setTimeout(doTheClick, 750);
}
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
var printSelected = function() {
	$('#status').attr('original', $('#status').html());
	App.in_progress = true;
	$('#status').html("I'll send that strip to the printer. Give me a sec.");
	var file = $("#photo-strips a.selected img").attr("src");
	setTimeout(function() {
		$.get('index.php?action=print_photo&filename=' + file, function(data) {
			$('#status').html("Ok, you're all set.  Your photo should be printing.");
			setTimeout(function() {
				App.in_progress = false;
				$('#status').html($('#status').attr('original'));
			}, 2000);
		});
	}, 2000);

}


var closePopup = function() {
	var magnificPopup = $.magnificPopup.instance;
	magnificPopup.close();
}

var closeAndGotoLatest = function() {
	closePopup();
	selectFirst();
	scrollToSelected();
	clickSelected();
};

var enlarge = function() {
	if (!$.magnificPopup.instance.isOpen) {
		$("#photo-strips a.selected").click();
	} else {
		closePopup();
	}
};

var moveRight = function() {
	closePopup();
	if (anythingSelected()) {
		if ($("#photo-strips a").last().hasClass("selected")) {
			scrollToSelected();
			clickSelected();
		} else {
			selectNext();
			scrollToSelected();
			clickSelected();
		}
	} else {
		scrollToTop();
		selectFirst();
		clickSelected();
	}
	randomSelect();
}
var moveLeft = function() {
	closePopup();
	if (anythingSelected()) {
		if ($("#photo-strips a").first().hasClass("selected")) {
			scrollToTop();
		} else {
			selectPrev();
			scrollToSelected();
			clickSelected();
		}
	} else {
		scrollToTop();
	}
	randomSelect();
}

App = {
	blank_photo: "/themes/2010/images/pixel.png",
	photos_to_take: 4,
	photo_id: null,
	timer: 3,
	in_progress: false,

	countdown: function() {
		App.in_progress = true;
		$('#photos').fadeIn();
		$('#my-camera').fadeIn();

		if (App.timer == 3) {
			$('#status').attr('original', $('#status').html());
			//$('#photo-strips').hide();
		}

		if (App.timer > 0) {
			var seconds = 1;
			seconds += App.timer;
			$('#status').html("Get ready! I'm going to begin in " + seconds + " seconds");
			doBeep();
			setTimeout(function() {
				App.timer = App.timer - 1;
				App.countdown();
			}, 1000);
		} else {
			doBeep();
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
		$.get('index.php?action=take_photo&id=' + App.photo_id + '&photos_to_take=' + App.photos_to_take, function(data) {
			var d = Math.random() * 20 - 20;
			$('#photos').append('<img src="' + data.photo_src + '" alt="" style="-webkit-transform:rotate(' + d + 'deg);-moz-transform:rotate(' + d + 'deg);" />');
			doFlash();
			if (current_photo == App.photos_to_take) {
				$('#my-camera').fadeOut();
				App.combine_and_finish();
			} else {
				var remaining = App.photos_to_take - current_photo;
				if (remaining == 1) {
					$('#status').html("One more. ");
				} else {
					$('#status').html("Looking good. " + remaining + " to go. ");
				}
				setTimeout(function() {
					$('#status').html($('#status').html() + "In 3");
					doBeep();
					setTimeout(function() {
						$('#status').html($('#status').html() + " 2");
						doBeep();
						setTimeout(function() {
							$('#status').html($('#status').html() + " 1");
							doBeep();
							App.take_photo((current_photo + 1));
						}, 1000);
					}, 1000);
				}, 1000);
			}
		}, 'json');
	},

	combine_and_finish: function() {
		$('#status').text("Awesome! Now just a sec...");

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
					$('#photos').fadeOut();
					$('#photos img').remove();
					$('#photo-strips').prepend($html).isotope('prepended', $html, true);
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
				// Map the griffin powermate button to all of these keys for the browser
				case 69: // letter e
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
				case 80: // down
					printSelected();
					break;
				case 13: // enter key
				case 84: // letter t
					closePopup();
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
			Webcam.attach('#my-camera');
			$('#my-camera').fadeOut();
			randomSelect();
		});
	}
};
