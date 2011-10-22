/**
 * User: anch
 * Date: 10/14/11
 * Time: 7:59 PM
 */

(function(){
    function initialize(){

        $('#c1').text('<script src="http://code.jquery.com/jquery-1.6.4.js" type="text/javascript"></script>\n<script src="{path_to_the_plugin}/easytype.js" type="text/javascript"></script>');
        $('#c2').text('<label for="ISBN">ISBN:</label> <input id="ISBN" type="text" size="25" value=""/>');
        $('#c3').text('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pharetra, urna vitae rhoncus\nluctus, elit <input id="Date" type="text" size="15" value="" />tortor aliquam erat, ...');
        $('#c4').text('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec pharetra, urna vitae rhoncus\nluctus, elit <input id="Time" type="text" size="15" value="" style="display: block; \npadding: 1em 2em 3em 4em;"/> tortor aliquam erat, tincidunt placerat lorem magna non quam. \nNam at felis eget sapien gravida tristique. Pellentesque non lacus ligula, quis sagittis \nmauris. Suspendisse ante.');


        resize();
        phoneNumber2ValueMaintain();
    }

    function resize(){
        adjustSideBarShadow();
        //redraw font shadow
        fontShadow();
    }

    function fontShadow(){
        $('#writings p, h2, h3, #sidebar .content').textShadow();
    }

    function phoneNumber2ValueMaintain(){
        window.setInterval(function(){
            $('#phone_number2').val($('#phone_number').val())
        }, 200)
    }

    function adjustSideBarShadow(){
        var height = $('body').height();
        var $sidebar = $('#sidebar');
        $sidebar.height(height).css('height', height);
        $sidebar.find('.shadow').height( $sidebar.height());
    }

    $(document).ready(function(){

        setTimeout(initialize, 201);

        $(window).resize(resize);
    });
})();
