var JSONIndex;
var JSONDetails;
var visibleHits = {};
var hitsCount = 0;
var htmlReplacements = {};
var pageBuffer = document.body.innerHTML;
var displayedLoading = false;
var warning;

String.prototype.capitalize = function(lower) {
    return (lower ? this.toLowerCase() : this).replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

function setup() {
	var style = document.createElement("link");
	style.rel = "stylesheet";
	style.type = "text/css";
	style.href = chrome.extension.getURL("contentscript_style.css");
	(document.head||document.documentElement).appendChild(style);
}

function setupWarning() {
	var animation = document.createElement("link");
	animation.rel = "stylesheet";
	animation.type = "text/css";
	animation.href = chrome.extension.getURL("res/animate.css");
	(document.head||document.documentElement).appendChild(animation);
}

function loadingSign(toggle) {
	if ((toggle === "show") && (typeof loadingSign.blockRepetition === "undefined")) {
		warning = noty({
            text        : "A extensão Chapéu Eleitoral encontrou muitos nomes nesta página e seu processamento pode demorar alguns instantes. Caso queira desligá-la, clique no ícone acima e à direita.",
            type        : "information",
            dismissQueue: true,
            killer      : true,
            buttons     : false,
            layout      : "topRight",
            theme       : "defaultTheme",
            animation: {
		        open: "animated flipInX",
		        close: "animated flipOutX",
		        speed: 500
   		 	},
   		 	callback: {
   		 		onClose: function() {
   		 			loadingSign.blockRepetition = false;
   		 		},
   		 	}
        });
	} else {
		$.noty.close(warning.options.id);
	}
	loadingSign.blockRepetition = true;
}

function highlightPolitician() {
	var names = JSONDetails["searchable"];
	var donations = JSONDetails["donations"];
	var img = "<img style='width:60px;height:80px;margin-bottom:5px' src='" + JSONDetails["image"] + "'/>";
	var moreInfo = JSONDetails["title"] + " - " + JSONDetails["party"] + " (" + JSONDetails["state"] + ")";
	var total = "Total arrecadado: R$ " + JSONDetails["total"].toLocaleString();

	for (var i in names) {
		var name = names[i];

		var highlightHtml = "<span class='highlightedPolitician-outter'>";
		highlightHtml = highlightHtml + "<span class='highlightedPolitician-inner'>" + name + "</span>";
		highlightHtml = highlightHtml + "<span style='text-align:center;display:none;font-size:1.25em;font-family:x-small arial,helvetica,freesans,sans-serif!important'>";
		highlightHtml = highlightHtml + img + "</br>";
		highlightHtml = highlightHtml + "<b>" + name.toUpperCase() + "</b></br>";
		highlightHtml = highlightHtml + moreInfo.toUpperCase() + "</br></br>";
		highlightHtml = highlightHtml + total + "</br></br>";
		if ("stands" in JSONDetails) {
			if (JSONDetails["stands"].length > 0) {
				var stands = JSONDetails["stands"];
				highlightHtml = highlightHtml + "Pertence à(s) bancada(s):</br>";
				for (var stand in stands) {
					highlightHtml = highlightHtml + stands[stand] + "</br>";
				}
			}
		}
		highlightHtml = highlightHtml + "</span></span>";

		if (JSONDetails["donations"] !== undefined ) {
			highlightHtml = highlightHtml + "<span style='display:none;font-family:x-small arial,helvetica,freesans,sans-serif!important;'>";
			highlightHtml = highlightHtml + "<b>Empresas que doaram para sua campanha:</b></br>";
			for (var donator in donations) {
				highlightHtml = highlightHtml + donator.capitalize(true) + ": <span style='color:green'><b>R$ " + donations[donator].toLocaleString() + "</b></span></br>";
			}
			
			if ("similars" in JSONDetails) {
				var similars = JSONDetails["similars"];
				highlightHtml = highlightHtml + "</br><b>Padrões similares de doações empresariais:</b></br>";
				for (var similar in similars) {
					highlightHtml = highlightHtml + similars[similar].toUpperCase() + "</br>";
				}
			}
		} else {
			highlightHtml = highlightHtml + "<span style='display:none;'>Não foram encontradas doações empresariais superiores a R$ 5000.";
		}
		highlightHtml = highlightHtml + "</span>";

		htmlReplacements[name] = highlightHtml;
		$("body").trigger("politicianCompiled");
	}
}

function applyTooltips() {
	$(".highlightedPolitician-inner").each( function() {
		$(this).qtip({
			position : {
				my  : "bottom center",
				at  : "top center"
			},
			content : {
				text : $(this).next("span")
			},
			style   : {
				classes : "qtip-green qtip-shadow qtip-rounded"
			},
			show    : {
            	effect: function() {
                	$(this).fadeTo(500, 1);
            	}
        	},
        	hide    : {
            	effect: function() {
                	$(this).fadeTo(500, 0);
            	},
            	fixed: true
        	}
		});
	});
	$(".highlightedPolitician-outter").each( function() {
		$(this).qtip({
			position : {
				my  : "top center",
				at  : "bottom center"
			},
			content : {
				text : $(this).next("span")
			},
			style   : {
				classes : "qtip-light qtip-shadow qtip-rounded",
			},
			show    : {
            	effect: function() {
                	$(this).fadeTo(500, 1);
            	}
        	},
        	hide    : {
            	effect: function() {
                	$(this).fadeTo(500, 0);
            	},
            	fixed: true
        	}
		});
	});
}

function searchPoliticians() {

	if (displayedLoading === true) {
		loadingSign("hide");
	}

	for (var hit in visibleHits) {
		var detailsFile = "final/" + hit + ".json";
			
		$.get(chrome.extension.getURL(detailsFile), function(details) {					
			JSONDetails = $.parseJSON(details);
					
			highlightPolitician(JSONDetails);
		});
	}

	$("body").on("politicianCompiled", function() {
		if (Object.keys(htmlReplacements).length >= hitsCount) {
			for (var name in htmlReplacements) {
				pageBuffer = pageBuffer.replace( new RegExp(name, "g"), htmlReplacements[name] );
				$("body").append("<span class='politicianRegistered'></span>").trigger("politicianAdded");
			}
		}
	});

	$("body").on("politicianAdded", function() {
		var registerTags = $(".politicianRegistered").length;
		if (registerTags >= hitsCount) {
			document.body.innerHTML = pageBuffer;
			applyTooltips();
		}
	});
}

$(document).one("ready", function() {

	chrome.runtime.sendMessage({ method: "getLocalStorage", key: "chapeuOnOff" }, function(response) {
  		if(response.data === "on") {
  			setup();

			$.get(chrome.extension.getURL("final/index.json"), function(index) {
				JSONIndex = $.parseJSON(index);

				var visibleText = $("body").text();

				for (var i = 0; i < JSONIndex.length; i++) {
					for (var j = 0; j < JSONIndex[i]["searchable"].length; j++) {
						if (visibleText.search(new RegExp(JSONIndex[i]["searchable"][j])) > -1) {
							visibleHits[i] = JSONIndex[i]["searchable"][j];
							hitsCount += JSONIndex[i]["searchable"].length;
							break;
						}
					}
				}

				if ((hitsCount > 50) && (displayedLoading === false)) {
					setupWarning();
					loadingSign("show");
					displayedLoading = true;
				}

				if (displayedLoading === true) {
					setTimeout(searchPoliticians, 5000);
				} else {
					searchPoliticians();
				}

			});
  		}
	});	
});