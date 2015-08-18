'use strict';
/* globals $:false */
var products = [],
	filters = {};

/**
 * @class Product
 * @constructor
 */
var Product = function() {
	// jQuery selectors.
	this.$checkboxes = $('.all-products input[type=checkbox]');
	this.$window = $(window);
	this.$homePageContent = $('.main-content .page');
	this.$clearFilterButton = $('.filters button');

	//Handlbar templates.
	this.$productCellTemplate = $('#products-template');

	// Pages.
	this.$errorPage = $('.error');
	this.$singleProductPage = $('.single-product');
	this.$allProductsPage = $('.all-products');

	this.bindEvents();

	$.getJSON('product.json', function(data) {
		products = data;
		this.generateAllProductsHTML(data);
		this.$window.trigger('hashchange');
	}.bind(this));
};

/**
 * Bind events
 */
Product.prototype.bindEvents = function() {
	this.$checkboxes.on('click', this._checkboxesClick.bind(this));
	this.$singleProductPage.on('click',  this._singleProductPageClick.bind(this));
	this.$window.on('hashchange', this._windowHashChange.bind(this));
};

/**
 *
 * @param e jQuery event.
 * @private
 */
Product.prototype._checkboxesClick = function(e) {
	var checkbox = $(e.target),
		specName = checkbox.attr('name');

	if(checkbox.is(':checked')) {
		if(!(filters[specName] && filters[specName].length)){
			filters[specName] = [];
		}

		//	Push values into the chosen filter array
		filters[specName].push(checkbox.val());

		// Change the url hash;
		this.createQueryHash(filters);
	}

	if(checkbox.is(':checked') === false) {
		if(filters[specName] &&
			filters[specName].length &&
			(filters[specName].indexOf(checkbox.val()) != -1)) {
			var index = filters[specName].indexOf(checkbox.val());

			filters[specName].splice(index, 1);

			if(filters[specName].length === 0){
				delete filters[specName];
			}
		}

		// Change the url hash;
		this.createQueryHash(filters);
	}

	this.$clearFilterButton.click(function (e) {
		e.preventDefault();
		window.location.hash = '#';
	});
};

/**
 *
 * @param e jQuery event
 * @private
 */
Product.prototype._singleProductPageClick = function(e) {

	if (this.$singleProductPage.hasClass('visible')) {
		var clicked = $(e.target);

		// If the close button or the background are clicked go to the previous page.
		if (clicked.hasClass('close') || clicked.hasClass('overlay')) {
			// Change the url hash with the last used filters.
			this.createQueryHash(filters);
		}
	}
};

Product.prototype._windowHashChange = function() {
	this.render(window.location.hash);
};

/**
 *
 * @param url
 */
Product.prototype.render = function(url) {
	var temp = url.split('/')[0];
	this.$homePageContent.removeClass('visible');

	var map = {
		// Homepage
		'': function() {
			filters = {};
			this.$checkboxes.prop('checked', false);
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
	var list = $('.all-products .products-list');

	var templateScript = this.$productCellTemplate.html();
	var template = Handlebars.compile(templateScript);
	list.append(template(data));

	list.find('li').on('click', function(e) {
		e.preventDefault();
		var productIndex = $(this).data('index');
		window.location.hash = 'product/' + productIndex;
	})
};

/**
 *
 * @param data
 */
Product.prototype.renderProductsPage = function(data) {
	var page = this.$allProductsPage,
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
};

/**
 *
 * @param index
 * @param data
 */
Product.prototype.renderSingleProductPage = function(index, data) {
	var page = this.$singleProductPage,
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

	this.$checkboxes.prop('checked', false);

	criteria.forEach(
		function(criterion) {
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
