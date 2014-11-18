 window.Jser = window.Jser || {};
 /**
  * 场景适配
  */
 $.extend(Jser, {
   scrollTop: function() {
     window.setTimeout(function() {
       window.scrollTo(0, 1);
     }, 100);
   },
   scene: function() {
     var supportOrientation = (typeof window.orientation == "number" && typeof window.onorientationchange == "object");
     var updateOrientation = function() {
       if (supportOrientation) {
         updateOrientation = function() {
           var orientation = window.orientation;
           switch (orientation) {
             case 90:
             case -90:
               orientation = "landscape";
               break;
             default:
               orientation = "portrait";
           }
           getScreenSize(orientation);
           Jser.scrollTop();
         };
       } else {
         updateOrientation = function() {
           var orientation = (window.innerWidth > window.innerHeight) ? "landscape" : "portrait";
           getScreenSize(orientation);
           Jser.scrollTop();
         };
       }
       updateOrientation();
     };
     updateOrientation();
     if (supportOrientation) {
       window.addEventListener("orientationchange", updateOrientation, false);
     } else {
       window.addEventListener("resize", updateOrientation, false);
     }

     function getScreenSize(ori) {
       var innerWidth = window.innerWidth;
       var innerHeight = window.innerHeight;
       var w, h, scale;
       if (innerWidth < 640) {
         w = innerWidth;
         h = innerHeight;
       } else {
         w = 640;
         h = innerHeight;
       }
       Jser.scale = scale = w / 640;
       $(".page_viewport").css({
         "width": w + "px",
         "height": h + "px"
       });
       $(".page_wrapper").css({
         'transform': 'scale(' + scale + ',' + scale + ')',
         '-webkit-transform': 'scale(' + scale + ',' + scale + ')',
         'transform-origin': '0 0',
         '-webkit-transform-origin': '0 0'
       });
     }
     setTimeout(function() {
        getScreenSize();    
        $(".page_wrapper").css({
           opacity: 1
        });   
     }, 200);
   }
 });
 $(function() {
   // 适配场景
   Jser.scene();
 });