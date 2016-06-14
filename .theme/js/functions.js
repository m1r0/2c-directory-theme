jQuery(function($) {

	var	settings = {
		// Set the root relative path
		// Examples: '/' (default) 	=> 	http://website.com/
		// 			 '/projects/' 	=> 	http://website.com/projects/
		// * Note that the paths have to be changed in the .htaccess and header.html files also
		root: '/',
		color: 'light',
		font: 'medium',
		depth: 1
	};

	var $html            = document.getElementsByTagName('html')[0];
	var $search          = $('.search');
	var $search_input    = $('.typeahead');
	var excluded_options = ['root'];
	var has_storage      = supports_html5_storage();
	var html_class       = settings.color + ' ' + settings.font;
	var current_path     = document.location.pathname.substring(settings.root.length);

	function typeAheadInit() {
		var search_data = new Bloodhound({
			datumTokenizer: Bloodhound.tokenizers.obj.nonword('name'),
			queryTokenizer: Bloodhound.tokenizers.nonword,
			// set results limit
			limit: 15,
			// fetch data
			prefetch: {
				url: settings.root + '.theme/lib/directory-crawler.php',
				// remove cache (time to live)
				ttl: 0,
				// the json response contains an array of strings, but the Bloodhound
				// suggestion engine expects JavaScript objects so this converts all of those strings
				filter: function(list) {
					return $.map(list, function(data) { return { name: data }; });
				},
				ajax: {
					data: {
						root_path    : settings.root,
						current_path : document.location.pathname,
						depth        : settings.depth
					},
					success: function() {
						$search.removeClass('loading');
					},
					error: function(e) {
						console.log(e);
					}
				}
			},
			sorter: function(a, b) {
				var search_value;
				var dirs_a;
				var dirs_b;
				var pos_a;
				var pos_b;

				// sort by path
				if (current_path) {
					if (a.name.indexOf(current_path) == 0 && b.name.indexOf(current_path) == 0) {
						// continue
					} else if(a.name.indexOf(current_path) == 0) {
						return -1;
					} else if(b.name.indexOf(current_path) == 0) {
						return 1;
					}
				}

				dirs_a = a.name.substring(0, a.name.length-1).split('/');
				dirs_b = b.name.substring(0, b.name.length-1).split('/');

				// sort by dir count
				if (dirs_a.length < dirs_b.length)
					return -1;

				if (dirs_a.length > dirs_b.length)
					return 1;

				// sort by dir name
				if (dirs_a < dirs_b)
					return -1;

				if (dirs_a > dirs_b)
					return 1;

				// sort by string position
				search_value = $search_input.val();
				pos_a = a.name.indexOf(search_value);
				pos_b = b.name.indexOf(search_value);

				if ( pos_a < pos_b )
					return -1;

				if ( pos_a > pos_b )
					return 1;

				return 0;
			}
		});

		$search.addClass('loading');

		// kicks off the loading/processing of `prefetch` data
		search_data.initialize();

		$search_input
			// destroy typeahead, needed for reinitialization
			.typeahead('destroy')
			.typeahead({
				// minLength: 1,
				autoselect: true,
				highlight: true,
				hint: true
			}, {
				name: 'search-data',
				displayKey: 'name',
				source: search_data.ttAdapter()
			});
	}

	function typeAheadEvents() {
		$search_input
			// Redirect on select
			.on('typeahead:selected', function(e){
				window.location.href = getProtocol() + document.location.host + settings.root + e.target.value;
				$search.addClass('loading');
			})
			// Select first suggestion by pressing tab
			.on('keydown', function(e) {
				if (e.keyCode == 9) {
					var $first_suggestion = $('.tt-suggestion').first();
					var first_value       = $first_suggestion.length ? $first_suggestion.text() : '';
					var current_value     = $search_input.val();

					if (first_value && first_value != current_value) {
						$search_input.typeahead('val', first_value);
						e.preventDefault();
					}
				}
			});

		// Focus search by pressing a-z, 0-9
		$(document).on('keydown', function(e) {
			if (e.keyCode >= 48 && e.keyCode <= 90) {
				if (!$search_input.is(':focus')) {
					$search_input.focus();
				}
			}
		});
	}

	function serverLinksGenerator() {
		var server_link = document.location.href.replace(getProtocol(), ''),
		    server_link = server_link.split('?'),
		    server_link = server_link[0],
		    server_link = server_link.substring(server_link.length - 1, '');

		var server_links            = server_link.split('/');
		var server_links_count      = server_links.length - 1;
		var $server_links_container = document.getElementsByTagName('th')[1];

		$server_links_container.innerHTML = '';

		for(i=0; i<=server_links_count; i++) {
			var $link = document.createElement('a'),
				link_href = '/',
				link_text = document.location.hostname + '/';

			$link.href = link_href;

			if(server_links_count > 0) {
				for(n=0; n<=i; n++) {
					link_href = link_href + server_links[n] + '/';
				}

				if(i>0) {
					link_text = server_links[i] + '/';
				}
			} else {
				link_href = link_text;
			}

			link_href = getProtocol() + link_href;
			link_href = link_href.replace('///', '//');

			$link.href = link_href;
			$link.innerHTML = link_text;

			$server_links_container.appendChild($link);
		}
	}

	function createSelection(field, start, end) {
		if( field.createTextRange ) {
			var selRange = field.createTextRange();
			selRange.collapse(true);
			selRange.moveStart('character', start);
			selRange.moveEnd('character', end-start);
			selRange.select();
		} else if( field.setSelectionRange ) {
			field.setSelectionRange(start, end);
		} else if( field.selectionStart ) {
			field.selectionStart = start;
			field.selectionEnd = end;
		}
		field.focus();
	}

	function createCookie(name,value,days) {
		var expires = "";
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			expires = "; expires="+date.toGMTString();
		}
		document.cookie = name+"="+value+expires+"; path=/";
	}

	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}

	function eraseCookie(name) {
		createCookie(name,"",-1);
	}

	function updateTheme() {
		if(has_storage) {
			for (var option in settings) {
				if ($.inArray(option, excluded_options) > -1)
					continue;

				if(localStorage.getItem('2c_theme_' + option) != settings[option]) {
					localStorage.setItem('2c_theme_' + option, settings[option]);
				}
			}
		} else {
			for (var option in settings) {
				if ($.inArray(option, excluded_options) > -1)
					continue;

				if(readCookie('2c_theme_' + option) != settings[option]) {
					eraseCookie('2c_theme_' + option);
					createCookie('2c_theme_' + option, settings[option], 99999);
				}
			}
		}

		html_class = settings.color + ' ' + settings.font;

		$html.setAttribute('class', html_class);

		// set active class for settings
		$('.settings').each(function() {
			var option = $(this).data('option');

			$(this).find('a').removeClass('active');
			$(this).find('a[data-value="' + settings[option] + '"]').addClass('active');
		});
	}

	function supports_html5_storage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	}

	function initTheme() {
		if(has_storage) {
			for (var option in settings) {
				if ($.inArray(option, excluded_options) > -1)
					continue;

				if(localStorage.getItem('2c_theme_' + option) == null) {
					localStorage.setItem('2c_theme_' + option, settings[option]);
				} else if(localStorage.getItem('2c_theme_' + option)) {
					settings[option] = localStorage.getItem('2c_theme_' + option);
				}
			}
		} else {
			for (var option in settings) {
				if ($.inArray(option, excluded_options) > -1)
					continue;

				if(readCookie('2c_theme_' + option) == undefined) {
					createCookie('2c_theme_' + option, settings[option], 99999);
				} else if(readCookie('2c_theme_' + option)) {
					settings[option] = readCookie('2c_theme_' + option);
				}
			}
		}
	}

	function getProtocol() {
		return document.location.href.match(/(\w+\:\/\/)/)[1];
	}

	initTheme();
	updateTheme();
	typeAheadInit();
	typeAheadEvents();
	serverLinksGenerator();

	// Add tabindex to rows
	$('.wrapper table tr').slice(1).each(function(i) {
		var $self = $(this);

		$(this).find('a')
			.attr('tabindex', i+2)
			.on('focus', function() { $self.addClass('active'); })
			.on('blur', function() {  $self.removeClass('active'); });
	});

	$('.settings a').on('click', function(e) {
		e.preventDefault();

		if ($(this).hasClass('active'))
			return;

		var option = $(this).closest('.settings').data('option');
		var value  = $(this).data('value');

		settings[option] = value;

		updateTheme();

		if (option == 'depth')
			typeAheadInit();
	});

	$('.link-settings, .link-close').on('click', function(e) {
		$('.modal').toggleClass('modal-open');

		e.preventDefault();
	});

});
