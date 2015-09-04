$(document).ready(function() {
	var theme = $.cookie('background-theme');

	if(typeof theme !== undefined || theme !== null ) {
		// find theme
		var theme_control = $('#themeswitcher').find('a[href="#'+theme+'"]');

		$('#themeswitcher').find('li').removeClass('current');
		theme_control.parent().addClass('current');

		// set theme
		setTheme(theme_control.text(),theme_control.data('stylesheet'))

	}
});

$('#themeswitcher a').on('click', function(e) {
	e.preventDefault();

	$('#themeswitcher').find('li').removeClass('current');
	$(this).parent().addClass('current');

	setTheme($(this).text(),$(this).data('stylesheet'),$(this).data('logo'))

	// Save our setting to cookie
	$.cookie('background-theme', $(this).attr('href').replace('#',''));
});

function setTheme(name,stylesheet) {
	$('head link.client-stylesheet').remove();

	if(typeof stylesheet !== undefined || stylesheet !== null) {
		$('head').append($('<link media="all" rel="stylesheet" type="text/css" class="client-stylesheet">')
			.attr('href','css/theme-' + stylesheet + '.css'));
	}

	$('.theme-name').text(name);
}