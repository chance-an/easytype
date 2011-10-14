/**
 * Date: 10/12/11
 * Time: 5:16 PM
 */
"use strict";

(function(){
    var backgroundRatio = null;
    var canvasRatio = null;
    var canvasScale = null;
    var canvasOriginalWidth = null;
    var canvasOriginalHeight = null;
    var MIN_WIDTGH = 800;

    var canvas = {
        width: 0,
        height: 0
    };

    function adjustBackground(){
        var $bg = $('div#background');
        var $img = $bg.find('img');
        if(!backgroundRatio){
            backgroundRatio = $img.height() / $img.width();
        }

        var width = $(window).width();

        if(width < MIN_WIDTGH){
            width = 800;
        }
        var height = backgroundRatio * width;
        $img.width(width).height(height);

        $bg.height($('body').height());

        $('#sidebar').height(height).css('opacity', 0.6).css('height', height + 'px');
        adjustCanvas();
    }

    function adjustCanvas(){
        var $canvas = $('canvas');
        if(!canvasRatio){
            canvasOriginalWidth = $canvas.width();
            canvasOriginalHeight = $canvas.height();
            canvasRatio = $canvas.height() / canvasOriginalWidth;
        }

        var width = $('#main').width();
        var height = canvasRatio * width;

        $canvas.attr('width', width).attr('height', height);

        //register
        canvas.width = width;
        canvas.height = height;

        canvasScale = width / canvasOriginalWidth;

    }

    function Point(x, y){
        this.x = x;
        this.y = y;

        this.getX = function(){
            return this.x * canvasScale;
        };

        this.getY = function(){
            return this.y * canvasScale;
        };
    }

    function Curve(points){
        this.points = [];
        $.each(points, (function(instance){
            return function(){
                return (function(i, v){
                    this.points.push(new Point(v[0], v[1]));
                }).apply(instance, arguments);
            }
        })(this));

    }

    $.extend( Curve.prototype, {
        getPoint: function(index){
            return this.points[index];
        }
    });

    function XMS(){
        this.canvas = $('canvas')[0];
        this.curves = [];
//        this.curves.push(new Curve([0, 50], [150,60], [290, 50]));
        for(var i = 0; i < 2; i++){
            var points = sampleCurvePoints(10);
            this.curves.push(new Curve(points));
        }

        this.draw();
    }

    (function initialize(){
        $(document).ready(function(){
            window.setTimeout(function(){
                adjustBackground();

                //test canvas availability
                if($('canvas')[0].getContext){
                    new XMS();
                }else{
                    //todo;
                }
            }, 100);
        });

        $(window).resize(adjustBackground);
    })();



    $.extend( XMS.prototype, {
        draw: function(){
            var context = this.canvas.getContext('2d');
            var curve = this.curves[0], point;
            context.beginPath();
            context.moveTo( (point = curve.getPoint(0)).getX(), point.getY() );
            context.quadraticCurveTo( curve.getPoint(1).getX(), curve.getPoint(1).getY(), curve.getPoint(2).getX(), curve.getPoint(2).getY() );
            context.quadraticCurveTo( curve.getPoint(3).getX(), curve.getPoint(3).getY(), curve.getPoint(4).getX(), curve.getPoint(4).getY() );
            context.stroke();
            context.closePath();

        },
        evolveCurves : function(){

        }
    });

    function sampleCurvePoints(ctrPoints){
        var stdevx = canvasOriginalWidth * .01;
        var stdevy = canvasOriginalHeight * .3;
        var ymean = canvasOriginalHeight * .5;

        var sec = canvasOriginalWidth / (ctrPoints - 1);

        var points = [], xmean = 0;

        for(var i = 0; i < ctrPoints; i++){
            var x = (new NormalDistribution(stdevx, xmean)).sample();
            xmean+= sec;
            var y = (new NormalDistribution(stdevy, ymean)).sample();
            points.push([x, y]);
        }

        return points;
    }
})();
