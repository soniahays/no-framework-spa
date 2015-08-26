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

		// Get products, our products data from products.json.
		$.getJSON('product.json', function(products) {
			this.products = products;
			this.$productGrid = this.generateProductGridHTML(this.products);
			this.$productGrid.find('li').on('click', this.openProductModal);

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
				var productID = url.split('#product/')[1].trim();
				this.renderProductDetailPage(productID, this.products);
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

				var filteredProducts = this.getFilterResults(this.criteria, this.products);
				this.renderProductsPage(filteredProducts);

			}.bind(this)
		};

		if (map[temp] !== null && typeof map[temp] !== 'undefined') {
			map[temp]();
		} else {
			this.renderErrorPage();
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
	 * Opens product detail modal
	 */
	Product.prototype.openProductModal = function() {
		var productId = $(this).data('index');
		window.location.hash = 'product/' + productId;
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
