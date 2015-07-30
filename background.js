chrome.runtime.onInstalled.addListener(function(){
	window.localStorage.setItem("chapeuOnOff", "on");
	chrome.browserAction.setBadgeText ( { text: "on" } );
	chrome.tabs.executeScript(null, {file: "contentscript.js"});
});

chrome.browserAction.onClicked.addListener(function(tab) {
	var status = window.localStorage.getItem("chapeuOnOff");
	if (status === "on") {
  		window.localStorage.setItem("chapeuOnOff", "off");
  		chrome.browserAction.setBadgeText ( { text: "off" } );
  	} else {
  		window.localStorage.setItem("chapeuOnOff", "on");
  		chrome.browserAction.setBadgeText ( { text: "on" } );
  	}
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getLocalStorage")
      sendResponse({ data : window.localStorage.getItem(request.key) });
    else
      sendResponse({});
});

