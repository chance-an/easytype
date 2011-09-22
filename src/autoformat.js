/**
 * User: anch
 * Date: 9/22/11
 * Time: 2:32 AM
 */

(function(){
//    http://docs.jquery.com/Plugins/Authoring
//    var

    var globalCache = {};

    (function( $ ){

      var methods = {
         init : function( options ) {

           return this.each(function(){
             $(window).bind('resize.tooltip', methods.reposition);
           });

         },
         destroy : function( ) {

           return this.each(function(){
             $(window).unbind('.tooltip');
           })

         }
      };

      $.fn.tooltip = function( method ) {

        if ( methods[method] ) {
          return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
          return methods.init.apply( this, arguments );
        } else {
          $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
        }

      };

    })( jQuery );

    function initialize(){


        alert('ok');
    }

    $(document).ready(initialize);

})();