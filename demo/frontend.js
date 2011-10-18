/**
 * User: anch
 * Date: 10/14/11
 * Time: 7:59 PM
 */

(function(){
    function initialize(){
        resize();
    }

    function resize(){
        adjustSideBarShadow();
        //redraw font shadow
        fontShadow();
    }

    function fontShadow(){
        $('#writings p').textShadow();
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
