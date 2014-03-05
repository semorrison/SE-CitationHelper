// ==UserScript==
// @name Citation Helper
// @version 2.2.2
// @author Manish Goregaokar (http://stackapps.com/users/10098/manishearth)
// @description Adds a cite button to the toolbar that allows for easy insertions of citations
// @license CC-BY-SA
// @include http://mathoverflow.net/*
// @exclude http://chat.stackexchange.com/*
// ==/UserScript==


// Necessary for userscript to work, but not for plugin
function with_jquery(f) {
     var script = document.createElement("script");
     script.type = "text/javascript";
     script.textContent = "(" + f.toString() + ")(jQuery)";
     document.body.appendChild(script);
};



// Most code for CitationButton taken from https://github.com/Manishearth/Manish-Codes/blob/master/StackExchange/MathJaxButtonsScript.js

CitationButton={
  addGenericButton: function(text,callback,identify,pic,tooltip){
    //Callback must take id of textarea as argument.
    $('.wmd-container').not(".hasbutton-"+identify).each(function(){
    try{
      var tid=$(this).find("[id^=wmd-input]")[0].id;
      row=$(this).find("[id^=wmd-button-row]")[0];
      lastel=$(row).find(".wmd-button").not(".wmd-help-button").filter(":last");
      if(lastel.length>0){
        px=parseInt(lastel[0].style.left.replace("px",""))+25;
        //add code for background-position of span as well later
        btn='<li class="wmd-button wmd-button-'+identify+'" style="left: '+px+'px; "><span class=citebuttonspan style="background-image:url('+pic+');text-align:center;">'+text+'</span></li>';
        $(btn).attr("title",tooltip).insertAfter(lastel).on("click",function(e){if(e.target.tagName.toLowerCase() == "li" || e.target.tagName.toLowerCase() == "span"){callback(tid);}});
	$(this).addClass(" hasbutton-"+identify);
	btn=$(row).find(".wmd-button").not(".wmd-help-button").filter(":last");
        if(pic==""){
          $(btn).children('span').hover(function(){$(this).css('background','#DEEDFF')},function(){$(this).css('background','none')});
        }
      }
    }catch(e){console.log(e)}
    })
  },
  addButton: function(){
    StackExchange.MarkdownEditor.creationCallbacks.add(CitationButton.creationCallback)
    CitationButton.creationCallback();
    $(document).on('popupClose',function(){CitationSearch.currentId="";});
    if (window.addEventListener) {
	window.addEventListener("message", CitationSearch.listenMessage, false);
    // TODO: Have the listener clean itself up, or have a persistent one that isn't added multiple times and knows the current textarea id / etc
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
      return ta.value.slice(ta.selectionStart,ta.selectionEnd)    
    }catch(e){
      return "";
    }
  }
 // TODO: Keyboard shortcuts
}

//TODO: CitationSearch.searchDialog(selectedText)

CitationSearch = {
  searchDialog: function(id,selectedText){
    if($('.popup-cite').length<0){return;}
    // Tweaked version of SE close popup code
    var popupHTML = '<div id="popup-cite" class="popup"><div class="popup-close"><a title="close this popup (or hit Esc)" href="javascript:void(0)">&times;</a></div><h2 class="popup-title-container handle"> <span class="popup-breadcrumbs"></span><span class="popup-title">Insert citation</span></h2><div id="pane-main" class="popup-pane popup-active-pane" data-title="Insert Citation" data-breadcrumb="Cite"><iframe width=640 height=480 src=\'http://semorrison.github.io/citation-search/?q=$question\'/></div></div>';
    popupHTML=popupHTML.replace("$question",encodeURIComponent(selectedText));
    var blob=new Blob([popupHTML]);
    $.ajaxSetup({cache:true});
    CitationSearch.currentId=id;
    
    $('#'+id).parents('.post-editor').find('.citebuttonspan')
	     .loadPopup({url:URL.createObjectURL(blob),loaded:CitationSearch.callback})

    $.ajaxSetup({cache:false});
  },
  callback:function(){
    StackExchange.helpers.bindMovablePopups();

  },
  listenMessage: function(msg) {
      if(StackExchange.currentId ==""){
      	return;
      }
      // More or less copied from https://github.com/semorrison/citation-search/blob/gh-pages/frame-test.html
      var json = JSON.parse(msg.data);
      var cite = $('<cite>').attr('authors', json.authors)
			    .attr('MRNumber', json.MRNumber)
			    .attr('cite', json.cite)
			    .append($('<a>')
			    .attr('href', json.url)
			    .append(json.title));
      // TODO: Move this over to InsertCitation
      $('#'+CitationSearch.currentId).val($('<span></span>').append(cite).html());
      StackExchange.MarkdownEditor.refreshAllPreviews;
      StackExchange.helpers.closePopups();
    },
    currentId: ""
}

//TODO: InsertCitation.updateEditor


with_jquery(function($){
//Inject code here

CitationButton.addButton('wmd-input')
});
