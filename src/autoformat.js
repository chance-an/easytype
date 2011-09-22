/**
 * User: anch
 * Date: 9/22/11
 * Time: 2:32 AM
 */

(function(){
//    http://docs.jquery.com/Plugins/Authoring
//    var

    var globalCache = [];

    function AutoFormatInfoEntry($elem){
        this.$element = $elem;
//        this.template = ns.interpretRule();
        this.templateFragments = [];
//        this.buildTemplateFragmentList();
        this.promptLayer = null;
        this.inputCache = [];
        this._pasteMonitorHandler = null;
        this._cutMonitorHandler = null;

        this.mutex1 = false;
    }


     //-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
    (function( $, $$$ ){

      var methods = {
         init : function( options ) {

           return this.each(function(){
               var $this = $(this);
               var infoEntry = new $$$($this);
               globalCache.push(infoEntry);

               var aaa = 1;
           });

         },

         destroy : function( ) {

           return this.each(function(){
               //
           })

         },

         /**
           *  This method is mainly for debugging purpose in dev
           */
         cache: function(){
             return globalCache;
         }

      };

      $.fn.autoformat = function( method ) {
        if ( methods[method] ) {
          return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.autoformat' );
        }
      };

    })( jQuery, AutoFormatInfoEntry);


    AutoFormatInfoEntry.prototype.interpretRule = function(pattern){

    };


})();