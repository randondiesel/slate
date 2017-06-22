var Slate = function() {

	/* Determine the directory from where slate.js is loaded */

	var scripts = document.getElementsByTagName('script');
	var path = scripts[scripts.length-1].src.split('?')[0]; // remove any ?query
	var SCRIPT_DIR = path.split('/').slice(0, -1).join('/')+'/';

	//Deprecated. Move to pastbin and remove.
	function randomId() {
		var msb = Math.floor((1 + Math.random()) * Number.MAX_SAFE_INTEGER).toString(36);
		var lsb = Math.floor((1 + Math.random()) * Number.MAX_SAFE_INTEGER).toString(36);
		return msb + "_" + lsb;
	};

	root_tag_selector = "body";
	param_tag_selector = "[slate-param]";
	route_manager = null;
	current_layout = null;

	function loadScript(url, options) {
		console.log("loading script: " + url);
		options = $.extend( options || {}, {
			dataType: "script",
	    	cache: false,
	    	url: SCRIPT_DIR + url
		});
		return $.ajax(options);
	}

	function setup() {
		console.log("setup called");

		var root_tag = $("[slate-root]").first();
		if(root_tag !== null) {
			var root_tag_id = root_tag.attr("id");
			if(root_tag_id === undefined) {
				root_tag_id = randomId();
				root_tag.attr("id", root_tag_id);
				root_tag_selector = "#" + root_tag_id;
				param_tag_selector = root_tag_selector + " [slate-param]";
			}
			else {
				root_tag_selector = "#" + root_tag_id;
				param_tag_selector = root_tag_selector + " [slate-param]";
			}
		}

		route_manager = new RouteManager();
		$.when(
			route_manager.init("config/")
		)
		.done(function() {
			Path.map("#!/:route_id").to(function(){
				changeRoute(this.params);
			});
			if(route_manager.getDefaultRoute() !== undefined) {
				Path.root("#!/" + route_manager.getDefaultRoute());
			}

			$(document).ready(function() {
				Path.listen();
			});
		});
	}

	function changeRoute(params) {
		var route_id = params["route_id"] || "404";
		route_id = route_id.replace(new RegExp("[$]", "g"), "/");

		console.log("route is : " + route_id);

		var route = route_manager.getRoute(route_id);
		if(route === null) {
			console.log("route not defined : " + route_id);
			route = route_manager.getRoute("404");
			if(route === null) {
				console.log("route 404 not defined.");
				return;
			}
		}

		if(route.layout === null) {
			console.log("route does not have a layout : " + route_id);
			if(route.redirect !== null) {
				console.log("redirecting to: " + route.redirect);
				location.replace(route.redirect);
			}
			return;
		}

		if(route.layout !== current_layout) {
			current_layout = route.layout;
			$.get(route.layout, function(data) {
				$(root_tag_selector).html(data);
				replaceOnPage(route.parameters);
			});
		}
		else {
			replaceOnPage(route.parameters);
		}

		if(route.title !== null) {
			$(document).attr("title", route.title);
		}
		if(route.styles !== undefined) {
			replaceStyles(route.styles);
		}
	}

	function replaceStyles(styles) {
		$('head').children("link[slate-style]").each(function() {
			var sel_tag  = $(this);
			sel_tag.remove();
			console.log('removed link with href=' + sel_tag.attr('href'));
		});
		for(i=0; i<styles.length; i++) {
			$('head').append('<link rel="stylesheet" href="'
					+ styles[i] + '" slate-style type="text/css" />');
		}
	}

	function replaceOnPage(parameters) {
		var dfrArr = [];
		$(param_tag_selector).each(function() {
			var html_tag  = $(this);
			var param_name = $(this).attr("slate-param");
			if(param_name === undefined) {
				return;
			}
			console.log("param_name " + param_name);
			var param_val = parameters[param_name];
			if(param_val === undefined) {
				return;
			}

			var extPat = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/
			var extnArr = param_val.match(extPat);
			if(extnArr !== null && extnArr.length > 0) {
				var extn = extnArr[0].toLowerCase();
				if(extn === '.html' || extn === '.htm') {
					var dfr = loadHTML(html_tag, param_val);
					dfrArr.push(dfr);
				}
				else if(extn === '.md') {
					var dfr = loadMD(html_tag, param_val);
					dfrArr.push(dfr);
				}
				else {
					html_tag.html(param_val);
				}
			}
			else {
				html_tag.html(param_val);
			}
		});

		$.when.apply($, dfrArr).done(function() {
			$(root_tag_selector).trigger("slate-transition");
			console.log("replacement complete");
		});
	};

	function loadHTML(html_tag, location) {
		console.log("loading html: " + location);
		var dfr = $.Deferred();
		html_tag.load(location, function(response, status, xhr) {
			if(status === "error") {
				//TODO: Handle error
			}
			dfr.resolve();
		});
		return dfr;
	}

	function loadMD(html_tag, location) {
		console.log("loading markdown: " + location);
		// Begin setup for markdown generation.
		var renderer = new marked.Renderer();
		renderer.heading = function (text, level) {
			var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
			return '<h' + level + '><toc id="' + escapedText + '" level="' + level + '">' + text + '</toc></h' + level + '>';
		};

		var highlighter = function (code) {
			return hljs.highlightAuto(code).value;
		};

		var marked_opts = {
			renderer: renderer,
			highlight: highlighter,
			gfm: true,
			tables: true,
			breaks: false,
			pedantic: true,
			sanitize: true,
			smartLists: true,
			smartypants: false
		};
		// End setup for markdown generation.

		var dfr = $.Deferred();
		$.get(location, function(md_data) {
			var html_content = marked(md_data, marked_opts);
			var markdown_id = randomId();
			html_tag.html(html_content);

			var toc_id = html_tag.attr("slate-toc-id");
			if(toc_id !== undefined) {
				var src_node_id = html_tag.attr("id");
				if(src_node_id === undefined) {
					src_node_id = randomId();
					html_tag.attr("id", src_node_id);
				}
				console.log("generating toc into node id: " + src_node_id);
				new TOC().generate(src_node_id, toc_id);
			}
			dfr.resolve();
		});
		return dfr;
	}

	/*
	------------------------------------------------------------------------------------------------
	initialization sequence
	------------------------------------------------------------------------------------------------
	*/
	$.when(
		loadScript("path.min.js"),
		loadScript("highlight.pack.js"),
		loadScript("marked.min.js"),
		loadScript("routemanager.js"),
		loadScript("toc.js")
	)
	.done(setup);
}

$(document).ready(function() {
	var cacheFlag = location.hostname.endsWith('.io') || location.hostname.endsWith('.com');
	$.ajaxSetup ({
	    // Disable caching of AJAX responses
	    cache: cacheFlag
	});
	new Slate();
});
