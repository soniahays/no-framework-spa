(function () {
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

		// Get products, our products data from products.json.
		$.getJSON('product.json', function (products) {
			this.products = products;
			this.$productGrid = this.generateProductGridHTML(this.products);
			this.$productGrid.find('li').on('click', this.openProductModal);

			this.$allProductCells = $('.all-products .product-grid > li');

			// Manually trigger a url change to start the app.
			this.$window.trigger('urlchange');
		}.bind(this));

		// Get the criteria that will be used in the filters.
		$.getJSON('/specs', function (data) {
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
		this.$window.on('urlchange', this.handleWindowURLChange.bind(this));
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
		this.createQueryString(this.filters);
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

		//Update the url querystring
		this.createQueryString(this.filters);
	};

	/**
	 * Clear filters by removing all the filters from the URL:
	 * reset the URL to its home page state.
	 * @param e jQuery event
	 */
	Product.prototype.clearAllFilters = function (e) {
		e.preventDefault();
		this.setURL('/');
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
			// Rebuild the URL querystring with the last used filters.
			this.createQueryString(this.filters);
		}
	};

	/**
	 *  Calls the render page function on every url change event.
	 */
	Product.prototype.handleWindowURLChange = function () {
		this.render(window.location.search);
	};

	/**
	 * Navigation.
	 * @param queryString
	 */
	Product.prototype.render = function (queryString) {
		var filterValue = getParameterByName(queryString, 'filter');
		var productValue = getParameterByName(queryString, 'product');

		this.$homePageContent.removeClass('visible');

		if (filterValue) {
			try {
				this.filters = JSON.parse(filterValue);
			}
			catch (err) {
				this.setURL('/');
			}

			var filteredProducts = this.getFilterResults(this.criteria, this.products);
			this.renderProductsPage(filteredProducts);
		}
		else if (productValue) {
			this.renderProductDetailPage(productValue, this.products);
		}
		else {
			this.filters = {};
			this.$checkboxesInput.prop('checked', false);
			this.renderProductsPage(this.products);
		}
	};

	/**
	 * Generates Product Grid Html using handlebars.
	 * @param products list of products
	 * @returns {*|jQuery|HTMLElement}
	 */
	Product.prototype.generateProductGridHTML = function (products) {
		var productGrid = $('.all-products .product-grid');

		var templateScript = this.$productCellTemplate.html();
		var template = Handlebars.compile(templateScript);
		productGrid.append(template(products));

		return productGrid;
	};

	/**
	 * //TODO:
	 * Opens product detail modal
	 */
	Product.prototype.openProductModal = function () {
//		var productId = $(this).data('index');
//		this.setURL(url);
	};

	/**
	 * Hides and Un-hides products depending on whether they are among the
	 * product that have been selected in the filter.
	 * @param filteredProducts
	 */
	Product.prototype.filterRenderedProducts = function (filteredProducts) {
		var $unfilteredProducts = this.$allProductCells;

		//Hide all the products in the products list.
		$unfilteredProducts.addClass('hidden');

		//Iterate over all the products, if their ID is in the filteredProducts
		// object, remove the hidden class to show the product.
		$unfilteredProducts.each(function () {
			var $product = $(this);

			filteredProducts.forEach(function (item) {
				if ($product.data('index') === item.id) {
					$product.removeClass('hidden');
				}
			});
		});
	};

	/**
	 * Renders the main Products page.
	 * @param filteredProducts
	 */
	Product.prototype.renderProductsPage = function (filteredProducts) {
		var page = this.$allProductsPage;

		this.filterRenderedProducts(filteredProducts);

		page.addClass('visible');
	};

	/**
	 * Renders the product details page.
	 * @param productID id of the selected product
	 * @param products list of products
	 */
	Product.prototype.renderProductDetailPage = function (productID, products) {
		var page = this.$singleProductPage;
		var $container = $('.preview-large');

		if (products.length !== 0) {
			products.forEach(function (item) {
				if (item.id === parseInt(productID, 10)) {
					$container.find('h3').text(item.name);
					$container.find('img').attr('src', item.image.large);
					$container.find('p').text(item.description);
				}
			});
		}

		page.addClass('visible');
	};

	/**
	 * Get the list of filtered products
	 * @param criteria array of available product specs.
	 * @param products
	 * @returns {Array} returns an Array of filtered products.
	 */
	Product.prototype.getFilterResults = function (criteria, products) {
		var filteredProducts = [];
		var isFiltered = false;

		this.$checkboxesInput.prop('checked', false);

		criteria.forEach(
			function (criterion) {
				if (this.filters[criterion] && this.filters[criterion].length !== 0) {
					if (isFiltered) {
						products = filteredProducts;
						filteredProducts = [];
					}

					this.filters[criterion].forEach(function (filter) {
							products.forEach(function (item) {
								if (typeof item.specs[criterion] === 'string') {
									if (item.specs[criterion].toLowerCase().indexOf(filter) !== -1) {
										filteredProducts.push(item);
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

		return filteredProducts;
	};

	/**
	 * //TODO:
	 * Renders error page.
	 */
	Product.prototype.renderErrorPage = function () {
		var page = this.$errorPage;
		page.addClass('visible');
	};

	/**
	 * Creates query hash either with or without filters.
	 * @param filters
	 */
	Product.prototype.createQueryString = function (filters) {
		var url = '?filter=' + JSON.stringify(filters);
		if ($.isEmptyObject(filters) === false) {
			this.setURL(url);
		}
		else {
			this.setURL('/');
		}
	};

	/**
	 *
	 * @param url
	 */
	Product.prototype.setURL = function (url) {
		window.history.pushState(null, null, url);
		this.$window.trigger('urlchange');
	};

	var product = new Product();


	/**
	 * Get query string by name
	 * TODO: Move to utils.js.
	 */
	function getParameterByName(queryString, name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(queryString);
		return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
}());