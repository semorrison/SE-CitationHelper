// ==UserScript==
// @name Citation Helper
// @version 2.2.2
// @author Manish Goregaokar (http://stackapps.com/users/10098/manishearth)
// @description Adds a cite button to the toolbar that allows for easy insertions of citations
// @license CC-BY-SA
// @include http://mathoverflow.net/*
// @include http://physics.stackexchange.com/*
// @exclude http://chat.stackexchange.com/*
// ==/UserScript==


// Necessary for userscript to work, but not for plugin
function with_jquery(f) {
     var script = document.createElement("script");
     script.type = "text/javascript";
     script.textContent = "(" + f.toString() + ")(jQuery)";
     document.body.appendChild(script);
};

// TODO: Make (almost) everything a private method

function injected($){
window.CitationButton={
  addGenericButton: function(text,callback,identify,pic,tooltip){
    // Adds a generic button to all available toolbars
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
  },
  addButton: function(){
    // Add a hook for whenever new editors are created
    StackExchange.MarkdownEditor.creationCallbacks.add(CitationButton.creationCallback)
    // Add the button to editors which already exist
    CitationButton.creationCallback();
    // Clear the cached id when popups are closed
    $(document).on('popupClose',function(){CitationSearch.currentId="";});
    // Listen for incoming messages
    if (window.addEventListener) {
	window.addEventListener("message", CitationSearch.listenMessage, false);
    } else {
	window.attachEvent("onmessage", CitationSearch.listenMessage);
    }
  },
  creationCallback: function(obj,prefix){
	setTimeout(function(){
  	CitationButton.addGenericButton('C',CitationButton.searchCallback,'cite','','Insert Citation')
        },0)
  },
  searchCallback: function(tid){
    var selectedText=CitationButton.getSelection(tid);
    CitationSearch.searchDialog(tid, selectedText);
  },
  getSelection: function(tid){
    try{
      ta=$('#'+tid)[0];
      // Cache selection values, they have a habit of clearing themselves
      CitationButton.selStart=ta.selectionStart;
      CitationButton.selEnd=ta.selectionEnd;
      return ta.value.slice(ta.selectionStart,ta.selectionEnd)    
    }catch(e){
      return "";
    }
  },
  selStart: 0,
  selEnd: 0
 // TODO: Keyboard shortcuts
}


window.CitationSearch = {
  searchDialog: function(id,selectedText){
    if($('.popup-cite').length<0){return;}
    // Tweaked version of SE close popup code. See popup.html for unminified HTML, genblob.sh can easily generate the below line from popup.html
    var popupHTML = '<div id="popup-cite" class="popup"><div class="popup-close"><a title="close this popup (or hit Esc)" href="javascript:void(0)">&times;</a></div><h2 class="popup-title-container handle"> <span class="popup-breadcrumbs"></span><span class="popup-title">Insert citation</span></h2><div id="pane-main" class="popup-pane popup-active-pane" data-title="Insert Citation" data-breadcrumb="Cite"><iframe width=640 height=480 src=\'http://semorrison.github.io/citation-search/?q=$question\'/></div></div>';
    popupHTML=popupHTML.replace("$question",encodeURIComponent(selectedText));
    // Data URIs give CORS issues, but blobs are fine
    var blob=new Blob([popupHTML]);
    // jQuery AJAX cache prevention (the addition of an _ param to the query string) breaks blob URLs.
    $.ajaxSetup({cache:true});
    CitationSearch.currentId=id; // The id is cached since I'm using a global message listener rather than turning a local listener on and off again
    $('#'+id).parents('.post-editor').find('.citebuttonspan')
	     .loadPopup({url:URL.createObjectURL(blob),loaded:CitationSearch.callback})
    // Put things back where they were
    $.ajaxSetup({cache:false});
  },
  callback:function(){
    // Stuff to run once the popup loads. Add post-popup customization here
    StackExchange.helpers.bindMovablePopups(); // Not totally necessary. Also doesn't work perfectly
  },
  listenMessage: function(msg) {
      // The event handler for the message
      if(StackExchange.currentId ==""){
      	return;
      }
      InsertCitation.updateEditor(msg,CitationSearch.currentId);
      StackExchange.MarkdownEditor.refreshAllPreviews();
      StackExchange.helpers.closePopups();
  },
  currentId: ""
}

//TODO: InsertCitation.updateEditor

window.InsertCitation = {
  updateEditor: function(msg, id){
    // More or less copied from https://github.com/semorrison/citation-search/blob/gh-pages/frame-test.html
    var json = JSON.parse(msg.data);
    var cite = $('<cite>').attr('authors', json.authors)
			  .attr('MRNumber', json.MRNumber)
			  .attr('cite', json.cite)
			  .append($('<a>')
			  .attr('href', json.url)
			  .append(json.title));
    var citeHTML=$('<span></span>').append(cite).html();
    var val=document.getElementById(id).value;
    document.getElementById(id).value = val.slice(0,CitationButton.selStart) + citeHTML + val.slice(CitationButton.selEnd);
  }
}

CitationButton.addButton('wmd-input');

}; // end injected()

with_jquery(injected);
