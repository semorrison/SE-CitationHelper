// ==UserScript==
// @name Citation Helper
// @version 2.3.0
// @author Manish Goregaokar (http://stackapps.com/users/10098/manishearth)
// @description Adds a cite button to the toolbar that allows for easy insertions of citations
// @license CC-BY-SA
// @include http://mathoverflow.net/*
// @include http://physics.stackexchange.com/*
// ==/UserScript==


// Necessary for userscript to work, but not for plugin
function with_jquery(f) {
     var script = document.createElement("script");
     script.type = "text/javascript";
     script.textContent = "(" + f.toString() + ")(jQuery)";
     document.body.appendChild(script);
};


function injected($){
  
StackExchange.citationhelper = (function(){
  // Cached selection values
  var selStart = 0;
  var selEnd = 0;
  var currentId =  "" // Cached textarea id
  var currentResult=false;
  
  return {init:init}; // Hoisting!
  
  function init(){
    StackExchange.using("editor",function(){
	addButtons();
      },true);
  }

  // Adds a generic button to all available toolbars  
  function addGenericButton(text,callback,identify,pic,tooltip){
    // Callback must take id of textarea as argument.
    $('.wmd-container').not(".hasbutton-"+identify).each(function(){
    try{
      var tid=$(this).find(".wmd-input")[0].id;
      row=$(this).find(".wmd-button-row")[0];
      lastel=$(row).find(".wmd-button").not(".wmd-help-button").filter(":last");
      if(lastel.length>0){
        px=parseInt(lastel[0].style.left.replace("px",""))+25;
        btn='<li class="wmd-button wmd-button-'+identify+'" style="left: '+px+'px; "><span class=citebuttonspan style="background-image:url('+pic+');text-align:center;">'+text+'</span></li>';
        $(btn).attr("title",tooltip).insertAfter(lastel)
	      .on("click",function(e){if(e.target.tagName.toLowerCase() == "li" || e.target.tagName.toLowerCase() == "span"){callback(tid);}})
	      .children('span').hover(function(){$(this).css('background','#DEEDFF')},function(){$(this).css('background','none')});
	$(this).addClass(" hasbutton-"+identify);
      }
    }catch(e){console.log(e)}
    })
  }
  
  // Add the buttons to all available wmd windows, and also to those which are created in the future
  function addButtons(){
    // Add a hook for whenever new editors are created
    StackExchange.MarkdownEditor.creationCallbacks.add(creationCallback)
    // Add the button to editors which already exist
    creationCallback();
    // Clear the cached id when popups are closed
    $(document).on('popupClose',function(){currentId="";});
    // Listen for incoming messages
    if (window.addEventListener) {
	window.addEventListener("message", listenMessage, false);
    } else {
	window.attachEvent("onmessage", listenMessage);
    }
    $('#content').on('keydown','textarea.wmd-input',keyHandler)
  }
  
  // Called when the markdown editor loads
  function creationCallback(obj,prefix){
	setTimeout(function(){
  	addGenericButton('<span style="font-size:9px">\\cite</span>',searchCallback,'cite','','Insert Citation (Alt-C)')
        },0)
  }
  // Called when the button is pressed
  function searchCallback(tid){
    currentId=tid;
    var selectedText=getSelection(tid);
    searchDialog(tid, selectedText);
  }
  // Extract and cache the selection from the textarea
  function getSelection(tid){
    try { // We're not sure if there is a selection
      ta=$('#'+tid)[0];
      // Cache selection values, they have a habit of clearing themselves
      selStart=ta.selectionStart;
      selEnd=ta.selectionEnd;
      return ta.value.slice(ta.selectionStart,ta.selectionEnd)    
    }catch(e){
      return "";
    }
  }

  // TODO: Keyboard shortcuts
  function keyHandler(zEvent) {
        if (zEvent.altKey  && ( zEvent.which == "c".charCodeAt(0)||zEvent.which == "c".toUpperCase().charCodeAt(0))) {
            zEvent.stopPropagation();
            zEvent.preventDefault()
            searchCallback(this.id);
            
            return false;
        }
        return true;
}
  // Prepare the search dialog
  function searchDialog(id,selectedText){
    
    if($('.popup-cite').length>0){return;} // Abort if dialog already exists
    
    // Tweaked version of SE close popup code. See popup.html for unminified HTML, genblob.sh can easily generate the below line from popup.html
var popupHTML = '<div id="popup-cite" class="popup"><div class="popup-close"><a title="close this popup (or hit Esc)" href="javascript:void(0)">&times;</a></div><h2 class="popup-title-container handle"> <span class="popup-breadcrumbs"></span><span class="popup-title">Insert citation</span></h2><div id="pane-main" class="popup-pane popup-active-pane close-as-duplicate-pane" data-title="Insert Citation" data-breadcrumb="Cite"><input id="search-text" type="text" style="width: 740px; z-index: 1; position: relative;"><div class="search-errors search-spinner"></div> <div class="original-display" style="width:712px"> <div id="previewbox" style="display:none"><div><a href="javascript:void(0)" id=backlink>&lt; Back to results</a></div><div class="preview" ></div></div> <div class="list-container"> <div class="list-originals" id="results"> </div> </div> </div></div><div class="popup-actions"><input type="submit" id="cite-submit" class="popup-submit disabled-button" value="Insert Citation" disabled="disabled" style="cursor: default;"></div></div>';

    /*
    // Data URIs give CORS issues, but blobs are fine
    var blob=new Blob([popupHTML]);
    // jQuery AJAX cache prevention (the addition of an _ param to the query string) breaks blob URLs.
    $.ajaxSetup({cache:true});
    CitationSearch.currentId=id; // The id is cached since I'm using a global message listener rather than turning a local listener on and off again
    $('#'+id).parents('.post-editor').find('.citebuttonspan')
	     .loadPopup({url:URL.createObjectURL(blob),loaded:CitationSearch.callback})
    // Put things back where they were
    $.ajaxSetup({cache:false});
    */
    loadPopup(popupHTML,selectedText);
  }
  // The event handler for the message
  function listenMessage(msg) {
      if(StackExchange.currentId ==""){
      	return;
      }
      updateEditor(msg,currentId);
      StackExchange.MarkdownEditor.refreshAllPreviews();
      StackExchange.helpers.closePopups();
  }

  // Load the popup and bind events
  function loadPopup(html,selectedText){
    // Stack Exchange's loadPopup isn't giving perfect results, let's mimic the behavior used by the image dialog
    citeDialog = $(html);
    citeDialog.appendTo('#header');
    StackExchange.helpers.bindMovablePopups();
    $('.popup-close').click(function(){StackExchange.helpers.closePopups('.popup');})
    citeDialog.center().fadeIn('fast')
    $('#search-text').on('blur',runSearch).on('keyup',runSearch).val(selectedText); //TODO: only on enter key
    $('#backlink').on('click',goBack);
    currentResult=false;
    $('#popup-cite .popup-submit').on('click',function(){if(currentResult){listenMessage(currentResult)}})
    if(selectedText){

      runSearch();
    }
  }

  function runSearch(){
    $('#popup-cite .search-spinner').removeSpinner().addSpinner();
    goBack();
    $.getJSON("http://polar-dawn-1849.herokuapp.com/?callback=?&q=" + $('#search-text').val(), fetchCallback);
  } 
  function fetchCallback(response) {
  // response = { 
  //	 query: "jones index for subfactors",
  //   results: [
  //    { citation: {
  //	    	MRNumber: 696688, title: "Index for subfactors", authors: "Jones, V. F. R.", cite: "Invent. Math. 72 (1983), no. 1, 1–25", url: "http://dx.doi.org/10.1007/BF01389127"
  //      },
  //      score: 1.0 } 
  //   ]
  // }
	  if($('#search-text').val() == response.query) {
		  var html = $('<div class="list">');
		  for (var i = 0; i < response.results.length; i++) {
		  var result = response.results[i].citation;
			  var mr = 'http://www.ams.org/mathscinet-getitem?mr=' + result.MRNumber;
			  var journal = (result.url == mr) ? "" : result.url;
			  html.append(
				  $('<div class="item" style="float:none;padding:5px">')
					  .append($('<div class = "summary post-link" style="float:none;width:auto"></div>').append(result.title))
					  .append('<br/>').append($('<span class="body-summary" style="float:none"></span>')
						  .append(result.authors + '<br/>' + result.cite  + '<br/> Preview: ')
						  .append(renderOptionalLink(mr, 'mathscinet',result)).append(" ")
						  .append(renderOptionalLink(journal, 'journal',result)).append(" ")
						  .append(renderOptionalLink(result.pdf, 'pdf',result)).append(" ")
						  .append(renderOptionalLink(result.free, 'free',result))
					  )
					  .click(loadInFrameCallback(result.best,result)).hover(function(){$(this).css('background-color','#e6e6e6')},function(){$(this).css('background-color','#fff')})
			  );
		  }
		  $("#results").html('')
		  $("#results").append(html);
		  MathJax.Hub.Queue(["Typeset",MathJax.Hub,"results"]);
		  $('#popup-cite .search-spinner').removeSpinner();
	  }	
  }
  function renderOptionalLink(href, text,result) {
	  if(href) {
		  return $('<a href="'+href+'">' + text + '</a>').click(loadInFrameCallback(href,result))
	  } else {
		  return "" //return '<span class="inactive">' + text + '</span> ';
	  }
  }
  function loadInFrameCallback(href,result){
    return function(e) {e.preventDefault();e.stopPropagation();loadInFrame(href,result);return false;}
  }
  function loadInFrame(href, result){
    $('#popup-cite .popup-submit').enable();
    currentResult=result;
    $('.list-container').hide()
    $('#popup-cite #previewbox').show()
    $('#popup-cite .preview').html("<iframe style='width:100%;height:100%' src='"+href+"'></iframe>")
  }
  function goBack(){
    $('.list-container').show()
    $('#popup-cite #previewbox').hide()    
    $('#popup-cite .popup-submit').disable();
  }
  // Build <cite> tags from the JSON and insert it in the right place on the page
  function updateEditor(msg, id){
    // More or less copied from https://github.com/semorrison/citation-search/blob/gh-pages/frame-test.html
    var json = msg//JSON.parse(msg.data);
    var cite = $('<cite>').attr('authors', json.authors)
			  .attr('MRNumber', json.MRNumber)
			  .attr('cite', json.cite)
			  .append($('<a>')
			  .attr('href', json.url).append(json.title))
			  .append(", ")
			  .append($('<i></i>').append(json.authors)).append(", "+json.cite);
			  
    var citeHTML=$('<span></span>').append(cite).html();
    var val=document.getElementById(id).value;
    document.getElementById(id).value = val.slice(0,selStart) + citeHTML + val.slice(selEnd);
  }

})()//end function call

StackExchange.citationhelper.init();
}; // end injected()


with_jquery(injected);
