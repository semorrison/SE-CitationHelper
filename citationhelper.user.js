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

with_jquery(function($){
//Inject code here

});

// Most code for CitationButton taken from https://github.com/Manishearth/Manish-Codes/blob/master/StackExchange/MathJaxButtonsScript.js

CitationButton={
  addButton: function(text,callback,identify,pic,tooltip,force){
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
        btn='<li class="wmd-button" style="left: '+px+'px; "><span style="background-image:url('+pic+');text-align:center;">'+text+'</span></li>';
        $(btn).on("click",function(){callback(tid)}).attr("title",tooltip).insertAfter(lastel);
        btn=$(row).find(".wmd-button").not(".wmd-help-button").filter(":last");
        if(pic==""){
          $(btn).children('span').hover(function(){$(this).css('background','#DEEDFF')},function(){$(this).css('background','none')});
        }
      }
    }catch(e){console.log(e)}
    })
  }
 // TODO: Keyboard shortcuts
}

//TODO: CitationSearch.searchDialog(selectedText)

//TODO: InsertCitation.updateEditor
