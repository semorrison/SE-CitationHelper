// ==UserScript==
// @name Citation Helper
// @version 2.2.2
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

// TODO: Make (almost) everything a private method

function injected($){
  
StackExchange.citations = (function(){
  
  return {init:init};
  function init(){
    StackExchange.using("editor",function(){
	addButtons();
      },true);
  }
  
  function addGenericButton(text,callback,identify,pic,tooltip){
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
  }
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
  }
  function creationCallback(obj,prefix){
	setTimeout(function(){
  	addGenericButton('<span style="font-size:9px">\\cite</span>',searchCallback,'cite','','Insert Citation')
        },0)
  }
  function searchCallback(tid){
    var selectedText=getSelection(tid);
    searchDialog(tid, selectedText);
  }
  function getSelection(tid){
    try{
      ta=$('#'+tid)[0];
      // Cache selection values, they have a habit of clearing themselves
      selStart=ta.selectionStart;
      selEnd=ta.selectionEnd;
      return ta.value.slice(ta.selectionStart,ta.selectionEnd)    
    }catch(e){
      return "";
    }
  }
  var selStart= 0;
  var selEnd= 0;
 // TODO: Keyboard shortcuts


  function searchDialog(id,selectedText){
    if($('.popup-cite').length<0){return;}
    
    // Tweaked version of SE close popup code. See popup.html for unminified HTML, genblob.sh can easily generate the below line from popup.html
    var popupHTML = '<div id="popup-cite" class="popup"><div class="popup-close"><a title="close this popup (or hit Esc)" href="javascript:void(0)">&times;</a></div><h2 class="popup-title-container handle"> <span class="popup-breadcrumbs"></span><span class="popup-title">Insert citation</span></h2><div id="pane-main" class="popup-pane popup-active-pane" data-title="Insert Citation" data-breadcrumb="Cite"><iframe width=640 height=480 src=\'http://$username.github.io/citation-search/?q=$question\'/></div></div>';
    popupHTML=popupHTML.replace("$question",encodeURIComponent(selectedText)).replace("$username","manishearth");
    
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
    loadPopup(popupHTML);
  }
  function listenMessage(msg) {
      // The event handler for the message
      if(StackExchange.currentId ==""){
      	return;
      }
      updateEditor(msg,currentId);
      StackExchange.MarkdownEditor.refreshAllPreviews();
      StackExchange.helpers.closePopups();
  }
  var currentId =  ""
  function loadPopup(html){
    // Stack Exchange's loadPopup isn't giving perfect results, let's mimic the behavior used by the image dialog
    citeDialog = $(html);
    citeDialog.appendTo('#header');
    StackExchange.helpers.bindMovablePopups();
    $('.popup-close').click(function(){StackExchange.helpers.closePopups('.popup');})
    citeDialog.center().fadeIn('fast')
  }



  function updateEditor(msg, id){
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
    document.getElementById(id).value = val.slice(0,selStart) + citeHTML + val.slice(selEnd);
  }

})()//end function
}; // end injected()


with_jquery(injected);
