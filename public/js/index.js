'use strict';
/* globals $:false, Handlebars */
var products = [],
	filters = {};

/**
 * @class Product
 * @constructor
 */
var Product = function() {
	// jQuery selectors.
	this.$checkboxesInput = $('.all-products input[type=checkbox]');
	this.$window = $(window);
	this.$homePageContent = $('.main-content .page');
	this.$clearFiltersButton = $('.filters button');
	this.$productGrid = $('.all-products .product-grid');

	//Handlebar templates.
	this.$productCellTemplate = $('#product-cell-template');

	// Pages.
	this.$errorPage = $('.error');
	this.$singleProductPage = $('.single-product');
	this.$allProductsPage = $('.all-products');

	this.bindEvents();

	// Get data our products data from products.json.
	$.getJSON('product.json', function(data) {
		products = data;

		this.generateAllProductsHTML(products);

		// Manually trigger a hashchange to start the app.
		this.$window.trigger('hashchange');
	}.bind(this));
};

/**
 * Bind events
 */
Product.prototype.bindEvents = function() {
	this.$checkboxesInput.on('click', this.updateFilters.bind(this));
	this.$clearFiltersButton.on('click', this.clearAllFilters.bind(this));
	this.$singleProductPage.on('click',  this.closeModal.bind(this));
	this.$window.on('hashchange', this.handleWindowHashChange.bind(this));
};

/**
 *
 * @param e
 */
Product.prototype.addFilter = function(e) {
	var $checkbox = $(e.target),
		specName = $checkbox.attr('name');

	if(!(filters[specName] && filters[specName].length)) {
		filters[specName] = [];
	}

	//Push values into the chosen filter array.
	filters[specName].push($checkbox.val());

	//Update the url hash.
	this.createQueryHash(filters);
};

/**
 *
 * @param e jQuery event
 */
Product.prototype.removeFilter = function(e) {
	var $checkbox = $(e.target),
		specName = $checkbox.attr('name');

	if(filters[specName] &&
		filters[specName].length &&
		(filters[specName].indexOf($checkbox.val()) !== -1)) {
		var index = filters[specName].indexOf($checkbox.val());

		filters[specName].splice(index, 1);

		//If it was the last remaining value for this specification,
		//delete the whole array.
		if(filters[specName].length === 0){
			delete filters[specName];//TODO: use something else than delete.
		}
	}

	//Update the url hash;
	this.createQueryHash(filters);
};

/**
 * Clear filters by updating url to go to the home page.
 *
 * @param e jQuery event
 */
Product.prototype.clearAllFilters = function(e) {
	e.preventDefault();
	window.location.hash = '#';
};

/**
 * Checkboxes Input event handlers/filtering
 * @param e jQuery event.
 */
Product.prototype.updateFilters = function(e) {
	var $checkbox = $(e.target);

	//Update filters object when a checkbox is checked.
	if($checkbox.is(':checked')) {
		this.addFilter(e);
	}

	//Remove the checkbox value from the filters when the checkbox is unchecked.
	if($checkbox.is(':checked') === false) {
		this.removeFilter(e);
	}
};

/**
 * Handles event to dismiss modal window.
 * @param e jQuery event.
 */
Product.prototype.closeModal = function(e) {
	var $modal = null;

	if($(e.target).hasClass('close')) {
		var $closeButton = $(e.target);
		$modal = $closeButton.parent().parent();
	}

	if($(e.target).hasClass('overlay')) {
		var $overlay = $(e.target);
		$modal = $overlay.parent();
	}

	if($modal !== null &&
		$modal.hasClass('visible')) {
		// Change the url hash with the last used filters.
		this.createQueryHash(filters);
	}
};

/**
 *  Calls the render function on every hashchange event.
 */
Product.prototype.handleWindowHashChange = function() {
	this.render(window.location.hash);
};

/**
 * Navigation.
 * @param url
 */
Product.prototype.render = function(url) {
	var temp = url.split('/')[0];
	this.$homePageContent.removeClass('visible');

	var map = {
		// Homepage
		'': function() {
			filters = {};
			this.$checkboxesInput.prop('checked', false);
			this.renderProductsPage(products);
		}.bind(this),
		// Single Product page
		'#product': function() {
			var index = url.split('#product/')[1].trim();
			this.renderSingleProductPage(index, products);
		}.bind(this),
		// Page with filtered products
		'#filter': function() {
			url = url.split('#filter/')[1].trim();

			try {
				filters = JSON.parse(url);
			}
			catch(err) {
				window.location.hash = '#';
			}

			this.renderFilterResults(filters, products);
		}.bind(this)
	};

	if(map[temp]) {
		map[temp]();
	}
	else {
		this.renderErrorPage();
	}
};

/**
 *
 * @param data
 */
Product.prototype.generateAllProductsHTML = function(data) {
	var list = this.$productGrid;

	var templateScript = this.$productCellTemplate.html();
	var template = Handlebars.compile(templateScript);
	list.append(template(data));

	list.find('li').on('click', function(e) {
		e.preventDefault();
		var productIndex = $(this).data('index');
		window.location.hash = 'product/' + productIndex;
	});
};

/**
 *
 * @param data
 */
Product.prototype.filterRenderedProducts = function(data) {
	var $unfilteredProducts = $('.all-products .product-grid > li');

	//Hide all the products in the products list.
	$unfilteredProducts.addClass('hidden');

	//Iterate over all the products, if their ID is in the data object, remove
	//the hidden class to show the product.
	$unfilteredProducts.each(function() {
		var $product = $(this);

		data.forEach(function (item) {
			if($product.data('index') === item.id) {
				$product.removeClass('hidden');
			}
		});
	});
};

/**
 *
 * @param data
 */
Product.prototype.renderProductsPage = function(data) {
	var page = this.$allProductsPage;

	this.filterRenderedProducts(data);

	page.addClass('visible');
};

/**
 *
 * @param index
 * @param data
 */
Product.prototype.renderSingleProductPage = function(index, data) {
	var page = this.$singleProductPage,
		$container = $('.preview-large');

	if(data.length) {
		data.forEach(function(item) {
			if(item.id === parseInt(index, 10)) {
				$container.find('h3').text(item.name);
				$container.find('img').attr('src', item.image.large);
				$container.find('p').text(item.description);
			}
		});
	}

	page.addClass('visible');
};

/**
 *
 * @param filters
 * @param products
 */
Product.prototype.renderFilterResults = function(filters, products) {
	var criteria = ['manufacturer', 'style', 'color', 'heel'],
		results = [],
		isFiltered = false;

	this.$checkboxesInput.prop('checked', false);

	criteria.forEach(
		function(criterion) {
			if(filters[criterion] && filters[criterion].length) {
				if(isFiltered) {
					products = results;
					results = [];
				}

				filters[criterion].forEach(function(filter){
					products.forEach(function(item) {
						if(typeof item.specs[criterion] === 'number') {
							if(item.specs[criterion] === filter) {
								results.push(item);
								isFiltered = true;
							}
						}

						if(typeof item.specs[criterion] === 'string') {
							if(item.specs[criterion].toLowerCase().indexOf(filter) !== -1) {
								results.push(item);
								isFiltered = true;
							}
						}
					});

					if(criterion && filter) {
						$('input[name=' + criterion + '][value=' + filter +']')
							.prop('checked', true);
					}
				});
			}
		}
	);

	this.renderProductsPage(results);
};

/**
 *
 */
Product.prototype.renderErrorPage = function() {
	var page = this.$errorPage;
	page.addClass('visible');
};

/**
 *
 * @param filters
 */
Product.prototype.createQueryHash = function(filters) {
	if($.isEmptyObject(filters) === false) {
		window.location.hash = '#filter/' + JSON.stringify(filters);
	}
	else {
		window.location.hash = '#';
	}
};

var product = new Product();
