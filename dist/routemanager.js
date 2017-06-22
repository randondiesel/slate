var RouteManager = function () {

	route_config = {};

	this.init = function (configDir) {
		var dfr = $.Deferred();

		console.log('initializing route manager');
		$.ajax({
	    	cache: false,
	    	url: configDir + 'routes.json',
	    	dataType: "json",
			success: function(data) {
				console.log("routes.json loaded");
				route_config = data;
				dfr.resolve("success");
			},
			error : function(xhdr, textStatus, error) {
				console.log("error loading [routes.json]");
				console.log("    status : " + textStatus);
				console.log("    description : " + error);
				dfr.reject(textStatus);
			}
		});

		return dfr;
	}

	this.getDefaultRoute = function () {
		return route_config["default-route"];
	}

	this.getRoute = function (route_id) {
		if(findConfig(route_id) === null) {
			return null;
		}
		var route = {};
		route.layout = findLayout(route_id);
		route.redirect = findRedirect(route_id);
		route.title = findTitle(route_id);

		var styles = [];
		styles = mergeStyles(route_id, styles);
		route.styles = styles;

		var parameters = {};
		mergeParams(route_id, parameters);
		route.parameters = parameters;
		return route;
	}

	////////////////////////////////////////////////////////////////////////////
	// Helper methods

	function findConfig(route_id) {
		for(var i = 0; i < route_config.routes.length; i++) {
			if(route_config.routes[i].id === route_id) {
				return route_config.routes[i];
			}
		}
		return null;
	}

	function findLayout(route_id) {
		var config = findConfig(route_id);
		if(config !== null) {
			if(config.layout !== undefined) {
				return config.layout;
			}
			else if(config.parent !== undefined) {
				return findLayout(config.parent);
			}
		}
		return null;
	}

	function findRedirect(route_id) {
		var config = findConfig(route_id);
		if(config !== null && config.redirect !== undefined) {
			return config.redirect;
		}
		return null;
	}

	function findTitle(route_id) {
		var config = findConfig(route_id);
		if(config !== null) {
			if(config.title !== undefined) {
				return config.title;
			}
			else if(config.parent !== undefined) {
				return findTitle(config.parent);
			}
		}
		return null;
	}

	function mergeStyles(route_id, result) {
		var config = findConfig(route_id);
		if(config !== null && config.styles !== undefined) {
			if(config.parent !== undefined) {
				return mergeStyles(config.parent, result);
			}
			return $.merge(result, config.styles);
		}
	}

	function mergeParams(route_id, result) {
		var config = findConfig(route_id);
		if(config !== null) {
			if(config.parent !== undefined) {
				mergeParams(config.parent, result);
			}
			$.extend(true, result, config.parameters);
		}
	}
}
