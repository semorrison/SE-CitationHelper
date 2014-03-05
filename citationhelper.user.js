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
  addGenericButton: function(text,callback,identify,pic,tooltip,force){
    //Callback must take id of textarea as argument.
    force = typeof force !== 'undefined' ? force : false;
    var tas=force?$('.wmd-container'):$('.wmd-container').not(".canhasbutton"+identify);
    $.each(tas,function(){
    try{
      if($(this).find("[id^=wmd-button-row]").length==0){
      	setTimeout(function(){CitationButton.addButton(text,callback,identify,pic,true)},100);
      	return;
      }else{
      	this.className+=" canhasbutton"+identify
      }
      tid=$(this).find("[id^=wmd-input]")[0].id;
      row=$(this).find("[id^=wmd-button-row]")[0];
      lastel=$(row).find(".wmd-button").not(".wmd-help-button").filter(":last");
      if(lastel.length>0){
        px=parseInt(lastel[0].style.left.replace("px",""))+25;
        //add code for background-position of span as well later
        btn='<li class="wmd-button" style="left: '+px+'px; "><span id=hello style="background-image:url('+pic+');text-align:center;">'+text+'</span></li>';
        $(btn).on("click",function(){callback(tid)}).attr("title",tooltip).insertAfter(lastel);
        btn=$(row).find(".wmd-button").not(".wmd-help-button").filter(":last");
        if(pic==""){
          $(btn).children('span').hover(function(){$(this).css('background','#DEEDFF')},function(){$(this).css('background','none')});
        }
      }
    }catch(e){console.log(e)}
    })
  },
  addButton: function(){
    CitationButton.addGenericButton('C',CitationButton.searchCallback,'cite','','hey',false)
  },
  searchCallback: function(tid){
    var selectedText=CitationButton.getSelection(tid);
    CitationSearch.searchDialog(tid, selectedText)
  },
  getSelection: function(tid){
    try{
      ta=$('#'+tid)[0];
      console.log(ta.value,ta.selectionStart,ta.selectionEnd)
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
    // Tweaked version of SE close popup code
    var popupHTML = '<div id="popup-close-question" class="popup"><div class="popup-close"><a title="close this popup (or hit Esc)">&times;</a></div><h2 class="popup-title-container handle"> <span class="popup-breadcrumbs"></span><span class="popup-title">Insert citation</span></h2><div id="pane-main" class="popup-pane popup-active-pane" data-title="Insert Citation" data-breadcrumb="Cite"><iframe width=640 height=480 src=\'http://semorrison.github.io/citation-search/?q=$question\'/></div></div>';
    popupHTML=popupHTML.replace("$question",encodeURIComponent(selectedText));
    var blob=new Blob([popupHTML]);
    $.ajaxSetup({cache:true});
    $('#hello').loadPopup({url:URL.createObjectURL(blob),loaded:CitationSearch.callback});
    $.ajaxSetup({cache:false});
  },
  callback:function(){
    // More or less copied from https://github.com/semorrison/citation-search/blob/gh-pages/frame-test.html
    function listenMessage(msg) {
			StackExchange.helpers.closePopups();
      var json = JSON.parse(msg.data);
      var cite = $('<cite>').attr('authors', json.authors)
								  .attr('MRNumber', json.MRNumber)
								  .attr('cite', json.cite)
								  .append($('<a>')
								  	.attr('href', json.url)
								  	.append(json.title));
      // TODO: Move this over to InsertCitation
			$('#wmd-input').val($('<span></span>').append(cite).html());
      StackExchange.MarkdownEditor.refreshAllPreviews()
		}

		if (window.addEventListener) {
		    window.addEventListener("message", listenMessage, false);
        // TODO: Have the listener clean itself up, or have a persistent one that isn't added multiple times and knows the current textarea id / etc
		} else {
		    window.attachEvent("onmessage", listenMessage);
		}
  }
}

//TODO: InsertCitation.updateEditor


with_jquery(function($){
//Inject code here

CitationButton.addButton('wmd-input')
});
