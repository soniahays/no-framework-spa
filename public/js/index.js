$(function() {
    var products = [],
        filters = {};

    var checkboxes = $('.all-products input[type=checkbox]');

	checkboxes.click(function() {
        var that = $(this),
            specName = that.attr('name');

        if(that.is(':checked')) {
            // If the filter for this specification isn't created yet - do it.
            if(!(filters[specName] && filters[specName].length)){
                filters[specName] = [];
            }

            //	Push values into the chosen filter array
            filters[specName].push(that.val());

            // Change the url hash;
            createQueryHash(filters);
        }

        if(!that.is(":checked")) {
            if(filters[specName] && filters[specName].length && (filters[specName].indexOf(that.val()) != -1)){
                var index = filters[specName].indexOf(that.val());

                filters[specName].splice(index, 1);

                if(!filters[specName].length){
                    delete filters[specName];
                }

            }
            // Change the url hash;
            createQueryHash(filters);
        }

        $('.filters button').click(function (e) {
            e.preventDefault();
            window.location.hash = '#';
        });
	});

    var singleProductPage = $('.single-product');

    singleProductPage.on('click', function (e) {

        if (singleProductPage.hasClass('visible')) {
            var clicked = $(e.target);

            // If the close button or the background are clicked go to the previous page.
            if (clicked.hasClass('close') || clicked.hasClass('overlay')) {
                // Change the url hash with the last used filters.
                createQueryHash(filters);
            }
        }
    });

	$.getJSON('product.json', function(data) {
	   generateAllProductsHTML(data);
	   $(window).trigger('hashchange');
	});

	$(window).on('hashchange', function() {
		render(window.location.hash);
	});

	function render(url) {
		var temp = url.split('/')[0];
		$('.main-content .page').removeClass('visible');

		var map = {
			// Homepage
			'': function() {
				filters = {};
				checkboxes.prop('checked', false);
				renderProductsPage(products);
			},
			// Single Product page
			'#product': function() {
				var index = url.split('#product/')[1].trim();
				renderSingleProductPage(index, products);

			},
			// Page with filtered products
			'#filter': function() {
				url = url.split('#filter/')[1].trim();

				try {
					filter = JSON.parse(url);
				}
				catch(err) {
					window.location.hash = '#';
				}

				renderFilterResults(filters, products);
			}
		};

		if(map[temp]) {
			map[temp]();
		}
		else {
			renderErrorPage();
		}
	}

	function generateAllProductsHTML(data) {
		var list = $('.all-products .products-list');

		var templateScript = $('#products-template').html();
		var template = Handlebars.compile(templateScript);
		list.append(template(data));

		list.find('li').on('click', function(e) {
			e.preventDefault();
			var productIndex = $(this).data('index');
			window.location.hash = 'product/' + productIndex;
		})
	}

	function renderProductsPage(data) {
		var page = $('.all-products'),
			allProducts = $('.all-products .products-list > li');

		allProducts.addClass('hidden');

		allProducts.each(function() {
            var that = $(this);

            data.forEach(function(item) {
                if(that.data('index') == item.id) {
                    that.removeClass('hidden');
                }
            });
		});

        page.addClass('visible');
	}

	function renderSingleProductPage(index, data) {
        var page = $('.single-product'),
            container = $('.preview-large');

        if(data.length) {
            data.forEach(function(item) {
                if(item.id == index) {
                    container.find('h3').text(item.name);
                    container.find('img').attr('src', item.image.large);
                    container.find('p').text(item.description);
                }
            });
        }

        page.addClass('visible');
	}

    function renderFilterResults(filters, products) {
        var criteria = ['manufacturer', 'style', 'color', 'heel'],
            results = [],
            isFiltered = false;

        checkboxes.prop('checked', false);

        criteria.forEach(function(criterion) {
            if(filters[criterion] && filters[criterion].length) {
                if(isFiltered) {
                    products = results;
                    results = [];
                }

                filters[criterion].forEach(function(filter){
                    products.forEach(function(item) {
                        if(typeof item.specs[criterion] == 'number') {
                            if(item.specs[criterion] == filter) {
                                results.push(item);
                                isFiltered = true;
                            }
                        }

                        if(typeof item.specs[criterion] == 'string') {
                            if(item.specs[criterion].toLowerCase().indexOf(filter) != -1) {
                                results.push(item);
                                isFiltered = true;
                            }
                        }
                    });

                    if(criterion && filter) {
                        $('input[name=' + criterion + '][value=' + filter +']').prop('checked', true);
                    }
                });
            }
        });
        renderProductsPage(results);
    }

	function renderErrorPage() {
        var page = $('.error');
        page.addClass('visible');
	}

	function createQueryHash(filters) {
        if(!$.isEmptyObject(filters)) {
            window.location.hash = '#filter/' + JSON.stringify(filters);
        }
        else {
            window.location.hash = '#';
        }
	}
});