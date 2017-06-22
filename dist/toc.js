var TOC = function() {

	this.generate = function(src_node_id, toc_node_id) {
		var item_count = $("#" + src_node_id + " toc").length;
		if(item_count > 0) {
			var toc_content = '<div class="toc-body">';
			var md_content = $(src_node_id).html();
			$("#" + src_node_id + " toc").each(function() {
				var title = $(this).text();
				var level = $(this).attr("level");
				var link = "javascript:new TOC().jumpto('" + $(this).attr("id") + "')";
				var toc_entry = '<div class="toc-entry-' + level + '"><a href="' + link + '">' + title + '</a></div>';
				toc_content += toc_entry;
			});
			toc_content += "</div>";
			$("#" + toc_node_id).css("visibility", "visible").css("display", "block");
			$("#" + toc_node_id).html(toc_content);
		}
		else {
			$("#" + toc_node_id).css("visibility", "hidden").css("display", "none");
		}
	}

	this.jumpto = function(jump_id) {
		var ofst = $("#" + jump_id).offset();
		$(window).scrollTop(ofst.top - 60);
	};
}
