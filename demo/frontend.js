/**
 * User: anch
 * Date: 10/14/11
 * Time: 7:59 PM
 */

(function(){
    function initialize(){
        resize();

        $('#c1').text('<script src="http://code.jquery.com/jquery-1.6.4.js" type="text/javascript"></script>\n<script src="{path_to_the_plugin}/autoformat.js" type="text/javascript"></script>');
    }

    function resize(){
        adjustSideBarShadow();
        //redraw font shadow
        fontShadow();
    }

    function fontShadow(){
        $('#writings p, h2, h3').textShadow();
    }

    function adjustSideBarShadow(){
        $sidebar = $('#sidebar');
        $sidebar.find('.shadow').height( $sidebar.height());
    }

    $(document).ready(function(){

        setTimeout(initialize, 201);

        $(window).resize(resize);
    });
})();
