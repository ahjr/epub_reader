(function(){
	var search = document.location.search;
	var activeBook = {};
	var bookRequested = false,
		bookValid	  = false;

	if (search) {
		bookRequested = true;
		$('<a/>')
  		  .attr("href", "js/bibi/bib/i/?book=" + search.substring(1))
  		  .attr("data-bibi", "embed")
  		  .attr("data-bibi-autostart", true)
  		  .attr("data-bibi-style", "display: inline-block; height: 100%; width: 100%;")
  		  .html("activeBook.title")
  		  .appendTo(".book");
	}

	$.getJSON('http://192.168.1.30:9091', function(data){
		$.each(data, function(key, book){
			var isActive = "";
			if ("?" + book.dir === search) {
				isActive = " active";
				activeBook = book;
				$("head").find("title").html(book.title);
				bookValid = true;
			}

			$("<div><span/><a></a></div>")
			  .addClass("dropdown-item")
			  .find("span")
			  .addClass("glyphicon glyphicon-menu-right inactive" + isActive)
			  .end() // span
			  .find("a")
			  .attr("href", "?" + book.dir)
			  .html(book.title)
			  .end() //div
			  .appendTo("#books-dropdown");

			$(".picker-images")
			  // .find("ol")
			  .append(
				$("<li>")
				  .attr("id", book.dir)
				  .addClass("picker-img-container hidden")
				  .append($("<a>")
				  	.attr("href", "?" + book.dir)
				  	.append($("<img>")
			          .addClass("picker-img").attr("src", book.cover_img)
				  	  .attr("alt", book.title + " * " + book.author)
			  	    ) // img
			  	  ) // a
			  )  // li
			$(".picker-dots")
			  // .find("ol")
			  .append($("<li>")
			  	  .addClass("picker-dots-item")
			  	  .append($("<a>")
			  	  	.attr("href", "?" + book.dir)
			  	    .addClass("picker-dot glyphicon glyphicon-filled-dot")
			  	    .hoverIntent(function(){
			  	  	  $(".picker-images")
			  	  	    .find("li:not([display*='none'])")
			  	  	    .stop(true, true)
			  	  	    .fadeOut("slow")
			  	  	    .promise()
			  	  	      .done(function(){
				  	  	    $("#" + book.dir).fadeIn("slow");
			  	  	      });
			  	  	  $(this).addClass("hover-dot");
			  	    }, function(){
			  	  	  $(this).removeClass("hover-dot");
			  	    }) // hover
			  )); // div.li 
		});

		$(".picker-images").find("li").first().removeClass("hidden");
		$(".picker-dots").find("li").first().addClass("picker-dot-first");

		if (bookRequested && bookValid) {
			$(".home").removeClass("hidden")
			  .find('a')
			      .addClass("home-icon")
				  .hover(function(){
				  	$(this).addClass("home-hover");
				  }, function(){
				  	$(this).removeClass("home-hover");
			  });
			$(".picker").addClass("hidden");
			$(".book").removeClass("hidden");
		} else if (bookRequested) {
			$(".text")
			  .removeClass("hidden")
			  .find(".error")
			  .removeClass("inactive")
			  .html("Requested book does not exist.")
		} 
	});
})();