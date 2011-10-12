/**
 * Date: 10/12/11
 * Time: 5:16 PM
 */
"use strict";

(function(){
    var backgroundRatio = null;
    var MIN_WIDTGH = 800;

    function adjustBackground(){
        var $bg = $('div#background');
        var $img = $bg.find('img');
        if(!backgroundRatio){
            var $img = $bg.find('img');
            backgroundRatio = $img.height() / $img.width();
        }

        var width = $(window).width();

        if(width < MIN_WIDTGH){
            width = 800;
        }
        var height = backgroundRatio * width;
        $img.width(width).height(height);

        $bg.height($('body').height());

        $('#sidebar').height(height).css('opacity', 0.6);
    }

    $(document).ready(function(){
        adjustBackground();
    });

    $(window).resize(adjustBackground);
})();
