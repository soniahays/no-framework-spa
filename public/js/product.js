(function() {
	'use strict';
	/* globals $:false, Handlebars */

	/**
	 * @class Product
	 * @constructor
	 */
	var Product = function () {
		this.products = [];
		this.filters = {};

		// jQuery selectors.
		this.$checkboxesInput = $('.all-products input[type=checkbox]');
		this.$window = $(window);
		this.$homePageContent = $('.main-content .page');
		this.$clearFiltersButton = $('.filters button');

		//Handlebar templates.
		this.$productCellTemplate = $('#product-cell-template');

		// Pages.
		this.$errorPage = $('.error');
		this.$singleProductPage = $('.single-product');
		this.$allProductsPage = $('.all-products');

		this.bindEvents();

		// Get data, our products data from products.json.
		$.getJSON('product.json', function(data) {
			this.products = data;
			this.$productGrid = $('.all-products .product-grid');

			this.generateAllProductsHTML(this.products);
			this.$allProductCells = $('.all-products .product-grid > li');

			// Manually trigger a hashchange to start the app.
			this.$window.trigger('hashchange');
		}.bind(this));

        // Get the criteria that will be used in the filters.
        $.getJSON('/specs', function(data) {
            this.criteria = data;
        }.bind(this));
	};

	/**
	 * Bind events
	 */
	Product.prototype.bindEvents = function () {
		this.$checkboxesInput.on('click', this.updateFilters.bind(this));
		this.$clearFiltersButton.on('click', this.clearAllFilters.bind(this));
		this.$singleProductPage.on('click', this.closeModal.bind(this));
		this.$window.on('hashchange', this.handleWindowHashChange.bind(this));
	};

	/**
	 * Add filter and filter values to the filters Object.
	 * @param e jQuery event
	 */
	Product.prototype.addFilter = function (e) {
		var $checkedBox = $(e.target);
		var filterName = $checkedBox.attr('name');

		// Initialize filter to an empty array if this is the first time we are
		// selecting this type of filter.
		if (this.filters[filterName] === null ||
			typeof this.filters[filterName] === 'undefined') {
			this.filters[filterName] = [];
		}

		// Push values into the chosen filter array.
		this.filters[filterName].push($checkedBox.val());

		//Update the url hash.
		this.createQueryHash(this.filters);
	};

	/**
	 * Remove filter and filter values from the filters Object.
	 * @param e jQuery event
	 */
	Product.prototype.removeFilter = function (e) {
		var $checkbox = $(e.target);
		var filterName = $checkbox.attr('name');

		// If this filter type exists with at least one value in it.
		// remove the filter value that passed
		if (this.filters[filterName] &&
			this.filters[filterName].length &&
			(this.filters[filterName].indexOf($checkbox.val()) !== -1)) {

			var index = this.filters[filterName].indexOf($checkbox.val());
			this.filters[filterName].splice(index, 1);

			// If it is the last remaining value for this type of filter
			// delete the entire Filter array.
			if (this.filters[filterName].length === 0) {
				delete this.filters[filterName];
			}
		}

		//Update the url hash;
		this.createQueryHash(this.filters);
	};

	/**
	 * Clear filters by removing all the filters from the URL:
	 * reset the URL to its home page state.
	 * @param e jQuery event
	 */
	Product.prototype.clearAllFilters = function (e) {
		e.preventDefault();
		window.location.hash = '#';
	};

	/**
	 * Checkboxes Input event handlers/filtering
	 * Update Filters object when checkboxes are checked
	 * and unchecked.
	 *
	 * @param e jQuery event.
	 */
	Product.prototype.updateFilters = function (e) {
		var $checkbox = $(e.target);

		if ($checkbox.is(':checked')) {
			this.addFilter(e);
		}

		if ($checkbox.is(':checked') === false) {
			this.removeFilter(e);
		}
	};

	/**
	 * Handles event to dismiss modal window.
	 * @param e jQuery event.
	 */
	Product.prototype.closeModal = function (e) {
		var $modal = null;

		if ($(e.target).hasClass('close')) {
			var $closeButton = $(e.target);
			$modal = $closeButton.parent().parent();
		}

		if ($(e.target).hasClass('overlay')) {
			var $overlay = $(e.target);
			$modal = $overlay.parent();
		}

		if ($modal !== null &&
			$modal.hasClass('visible')) {
			// Rebuild the URL hash with the last used filters.
			this.createQueryHash(this.filters);
		}
	};

	/**
	 *  Calls the render page function on every hashchange event.
	 */
	Product.prototype.handleWindowHashChange = function () {
		this.render(window.location.hash);
	};

	/**
	 * Navigation.
	 * @param url
	 */
	Product.prototype.render = function (url) {
		var temp = url.split('/')[0];
		this.$homePageContent.removeClass('visible');

		var map = {
			// Homepage
			'': function () {
				this.filters = {};
				this.$checkboxesInput.prop('checked', false);
				this.renderProductsPage(this.products);
			}.bind(this),
			// Single Product page
			'#product': function () {
				var index = url.split('#product/')[1].trim();
				this.renderSingleProductPage(index, this.products);
			}.bind(this),
			// Page with filtered products
			'#filter': function () {
				url = url.split('#filter/')[1].trim();

				try {
					this.filters = JSON.parse(url);
				}
				catch (err) {
					window.location.hash = '#';
				}

				this.renderFilterResults();
			}.bind(this)
		};

		if (map[temp]) {
			map[temp]();
		} else {
			this.renderErrorPage();
		}
	};

	/**
	 *
	 * @param data
	 */
	Product.prototype.generateAllProductsHTML = function (data) {
		var list = this.$productGrid;

		var templateScript = this.$productCellTemplate.html();
		var template = Handlebars.compile(templateScript);
		list.append(template(data));

		list.find('li').on('click', function (e) {
			e.preventDefault();
			var productIndex = $(this).data('index');
			window.location.hash = 'product/' + productIndex;
		});
	};

	/**
	 *
	 * @param data
	 */
	Product.prototype.filterRenderedProducts = function (data) {
		var $unfilteredProducts = this.$allProductCells;

		//Hide all the products in the products list.
		$unfilteredProducts.addClass('hidden');

		//Iterate over all the products, if their ID is in the data object, remove
		//the hidden class to show the product.
		$unfilteredProducts.each(function () {
			var $product = $(this);

			data.forEach(function (item) {
				if ($product.data('index') === item.id) {
					$product.removeClass('hidden');
				}
			});
		});
	};

	/**
	 *
	 * @param data
	 */
	Product.prototype.renderProductsPage = function (data) {
		var page = this.$allProductsPage;

		this.filterRenderedProducts(data);

		page.addClass('visible');
	};

	/**
	 *
	 * @param index
	 * @param data
	 */
	Product.prototype.renderSingleProductPage = function (index, data) {
		var page = this.$singleProductPage;
		var $container = $('.preview-large');

		if (data.length) {
			data.forEach(function (item) {
				if (item.id === parseInt(index, 10)) {
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
	Product.prototype.renderFilterResults = function () {
		var criteria = this.criteria;
		var results = [];
		var isFiltered = false;

		this.$checkboxesInput.prop('checked', false);

		criteria.forEach(
			function (criterion) {
				if (this.filters[criterion] && this.filters[criterion].length) {
					if (isFiltered) {
						this.products = results;
						results = [];
					}

					this.filters[criterion].forEach(function (filter) {
							this.products.forEach(function (item) {
								if (typeof item.specs[criterion] === 'number') {
									if (item.specs[criterion] === filter) {
										results.push(item);
										isFiltered = true;
									}
								}

								if (typeof item.specs[criterion] === 'string') {
									if (item.specs[criterion].toLowerCase().indexOf(filter) !== -1) {
										results.push(item);
										isFiltered = true;
									}
								}
							});

							if (criterion && filter) {
								$('input[name=' + criterion + '][value=' + filter + ']')
									.prop('checked', true);
							}
						}.bind(this)
					);
				}
			}.bind(this)
		);

		this.renderProductsPage(results);
	};

	/**
	 *
	 */
	Product.prototype.renderErrorPage = function () {
		var page = this.$errorPage;
		page.addClass('visible');
	};

	/**
	 *
	 * @param filters
	 */
	Product.prototype.createQueryHash = function (filters) {
		if ($.isEmptyObject(filters) === false) {
			window.location.hash = '#filter/' + JSON.stringify(filters);
		}
		else {
			window.location.hash = '#';
		}
	};

	var product = new Product();
}());
