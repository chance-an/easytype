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
    }

    function adjustSideBarShadow(){
        $sidebar = $('#sidebar');
        $sidebar.find('.shadow').height( $sidebar.height());
    }


    $(document).ready(function(){

        setTimeout(initialize, 201);
    });
})();
