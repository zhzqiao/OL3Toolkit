
ol.control.CustomZoomTo = function(opt_options){
    var options = opt_options || {};

    var button = document.createElement('button');
    button.innerHTML = 'o';

    var this_ = this;

    button.onclick = function(e) {
        e = e || window.event;
        if($.OL3Toolkit.options.enalblePosition){
            $.OL3Toolkit.getLocation.activate();
        }else {
            this_.getMap().getView().centerOn($.OL3Toolkit.options.viewCenter, this_.getMap().getSize(), [570,500]);
        }
        e.preventDefault();
    };

    var element = document.createElement('div');
    element.className = 'ol3toolkit-location ol-unselectable ol-control';
    element.appendChild(button);

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });

}



ol.control.CustomZoomTo.prototype.getLocation = function (map, viewCenter) {
    var geolocation = new ol.Geolocation();
    geolocation.setTracking(true);
    geolocation.on('error', function(error) {
        alert(error.message);
        return false;
    });

    var accuracyFeature = new ol.Feature();
    geolocation.on('change:accuracyGeometry', function() {
        accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
    });

    var positionFeature = new ol.Feature();
    positionFeature.setStyle(new ol.style.Style({
        image: new ol.style.Circle({
            radius: 6,
            fill: new ol.style.Fill({
                color: '#3399CC'
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 2
            })
        })
    }));

    geolocation.on('change:position', function(map) {
        var coordinates = geolocation.getPosition();
        positionFeature.setGeometry(coordinates ?
            new ol.geom.Point(coordinates) : null);
        map.getView().centerOn(ol.proj.transform(coordinates,"EPSG:4326","EPSG:3857"));
    });

    new ol.layer.Vector({
        map: map,
        source: new ol.source.Vector({
            features: [accuracyFeature, positionFeature]
        })
    });
}
/**
 * Created by zzq on 2016/4/26.
 */


// 确保jQuery在ol3toolkit.js前加载
if(typeof jQuery === "undefined"){
    throw new Error("使用ol3toolkit需要先加载jQuery");
}

// 确保OL3在ol3toolkit.js前加载
// Openlayers编写时的版本为V3.15.1
if(typeof ol === "undefined"){
    throw new Error("使用ol3toolkit需要先加载openlayers3");
}

// 确保第三方包LayerSwitcher在ol3toolkit.js前加载
if(typeof ol.control.LayerSwitcher === "undefined"){
    throw new Error("为了切换地图，请先加载LayerSwitcher");
}

/* OL3Toolkit
 *
 * @type Object
 * @description $.OL3Toolkit是OL3工具包的主类,用来打包执行常用功能
 *
 */
$.OL3Toolkit = {};

/**
 *
 * @type {{}}
 */
$.OL3Toolkit.options = {
    //快速初始化
    quickCreation: true,
    //绑定的<div>Id
    targetID: "map",
    //地图起始中心坐标
    viewCenter: [120.63,30.05],
    //初始地图缩放等级
    zoomLevel: 7,
    //底图数据源
    baseMapSource: ["OSM",'SATELLITE'],
    //自动把输入的'EPSG:4326'转换到'EPSG:3857/900913'
    autoLatLngTransform: true,
    //地图大小自适应
    mapSizeSelfAdaption: true,
    //多地图源切换
    enableSwitchMultiMapSources: true,
    //包含瓦片加载进度条
    hasProgress: true,
    //显示点线面数据
    drawBasicElements: true,
    //鸟瞰功能
    showBirdsEye: true,
    //显示比例尺
    showScaleLine: true,
    //一个定位控件，优先当前位置，若不支持则回到初始视角
    //定位
    enalblePosition: true,
    //回到初始视角
    backOriginView: true,
    //测量功能
    basicMeasure: true,
    //地图上弹出窗
    basicPopup: true,
    //预定点线面样式
    sld: {
        lightBlue: "#3c8dbc",
        red: "#f56954",
        green: "#00a65a",
        aqua: "#00c0ef",
        yellow: "#f39c12",
        blue: "#0073b7",
        navy: "#001F3F",
        teal: "#39CCCC",
        olive: "#3D9970",
        lime: "#01FF70",
        orange: "#FF851B",
        fuchsia: "#F012BE",
        purple: "#8E24AA",
        maroon: "#D81B60",
        black: "#222222",
        gray: "#d2d6de"
    }
}

$(function() {
    
    //如果有其他参数定义，则扩展参数
    if (typeof OL3ToolkitOptions !== "undefined") {
        $.extend(true,
            $.OL3Toolkit.options,
            OL3ToolkitOptions);
    }

    //方便调用参数
    var o = $.OL3Toolkit.options;
    
    //如果要包含进度条的话，在map下方添加一个#progress的div
    if(o.hasProgress){
        $("#"+o.targetID).after('<div id="progress"></div>');
    }

    //初始化对象
    ol3ToolkitInit_();

    //快速生成地图
    if(o.quickCreation){
        $.OL3Toolkit.createMap.activate();
    }

    //由于采用的模板是almasaeed2010/AdminLTE
    //https://github.com/almasaeed2010/AdminLTE
    //所以需要自适应的内容填写'.content-wrapper'
    if(o.mapSizeSelfAdaption){
        $.OL3Toolkit.sizeSelfAdaption.activate('.content-wrapper');
    }

    //根据参数判断是否是否允许切换地图功能
    if(o.enableSwitchMultiMapSources){
        map.addControl(new ol.control.LayerSwitcher());
    }

    //根据参数判断是否添加鸟瞰功能
    if(o.showBirdsEye){
        map.addControl(new ol.control.OverviewMap({
            tipLabel: '鸟瞰图'
        }));
        //设置样式
        $('.ol-overviewmap').css({"right": ".5em","top": ".5em", "left": "inherit","bottom": "inherit"});
    }
    
    //根据参数判断是否添加比例尺
    if(o.showScaleLine){
        map.addControl(new ol.control.ScaleLine());
    }

    //根据参数判断是否添加定位功能
    //to-do：改为根据当前位置
    if(o.enalblePosition||o.backOriginView){
        ol.inherits(ol.control.CustomZoomTo, ol.control.Control);
        map.addControl(new ol.control.CustomZoomTo());
    }

})



/**
 * ----------------------
 * - 初始化OL3Toolkit对象 -
 * ----------------------
 * 所有OL3Toolkit功能在其执行
 * @private
 */
function ol3ToolkitInit_() {


    $.OL3Toolkit.mapSources = {
        SATELLITE: function () {
            return new ol.layer.Tile({
                title: '卫星数据',
                type: 'base',
                visible: false,
                source: new ol.source.MapQuest({
                    layer: 'sat'
                })
            });
        },
        OSM: function () {
            return new ol.layer.Tile({
                title: 'OSM',
                type: 'base',
                visible: true,
                source: new ol.source.OSM()
            });
        }
    };

    /**
     * 创建简单地图
     * ==========
     * 只需输入绑定ID
     * 
     * @type {{activate: $.OL3Toolkit.createMap.activate}}
     */
    $.OL3Toolkit.createMap = {
        activate: function(){
            var this_ = this;
            //方便调用参数
            var o = $.OL3Toolkit.options;
            //如果开启自动转换经纬度，且参数正确，则把经纬度转换成标准坐标参考系
            if($.OL3Toolkit.options.autoLatLngTransform && o.viewCenter[0] <= 180 && o.viewCenter[0] >= -180 && o.viewCenter[1] <= 90 && o.viewCenter[1] >= -90){
                o.viewCenter = ol.proj.transform(o.viewCenter, 'EPSG:4326', 'EPSG:3857')
            }
            map = new ol.Map({
                layers: this_.createLayers(o.baseMapSource),
                target: o.targetID,
                view: new ol.View({
                    center:o.viewCenter,
                    zoom: o.zoomLevel
                })
            });
        },
        // 组装成最终的图层
        createLayers: function(baseSource){
            var this_ = this;
            
            var baseMaps = new ol.layer.Group({
                'title': '底图数据',
                layers: this_.traverseMapSources(baseSource)
            });
            var overlays = new ol.layer.Group({
                title: '叠加图层',
                layers: [
                    new ol.layer.Tile({
                        title: '国界',
                        source: new ol.source.TileWMS({
                            url: 'http://demo.opengeo.org/geoserver/wms',
                            params: {'LAYERS': 'ne:ne_10m_admin_1_states_provinces_lines_shp'},
                            serverType: 'geoserver'
                        })
                    })
                ]
            });
            return [baseMaps,overlays];
        },
        // 遍历参数，组装成底图图层
        traverseMapSources: function (neededMapSources) {
            var finalBaselayers = [];
            //如果$.OL3Toolkit.mapSources中有需要的底图，则组装成底图图层组
            for(var item in $.OL3Toolkit.mapSources){
                if(neededMapSources.includes(item)){
                    var source = $.OL3Toolkit.mapSources[item]();
                    //添加进度条
                    if($.OL3Toolkit.options.hasProgress){
                        $.OL3Toolkit.progress.activate(source);
                    }                    
                    finalBaselayers.push(source);
                }
            }
            return finalBaselayers;
        }
    };


    $.OL3Toolkit.sizeSelfAdaption = {
        activate: function (outerClass) {
            var outerElem;
            //当没有传入外部类参数，或所传入的外部类不存在时，自动寻找外部类
            if(outerClass==undefined||$(outerClass).length==0){
                outerElem = $('#map').parent();
            }else{
                outerElem = $(outerClass);
            }
            //初始时调整
            var this_ = this;
            this_.fix(outerElem);
            //改变窗口大小时再次调整
            outerElem.resize(function () {
                this_.fix(outerElem);
            });
        },
        fix: function (outerElem) {
            map.setSize([outerElem.width(),$(window).height() - $('.main-footer').outerHeight() - $('.main-header').outerHeight() - 8])
        }
    };

    //瓦片加载进度条工具
    $.OL3Toolkit.progress = {
        //输入要生成进度条的ol.source
        activate: function(linkedSource) {
            var this_ = this;
            this_.el = document.getElementById('progress');
            this_.loading = 0;
            this_.loaded = 0;
            linkedSource.getSource().on('tileloadstart', function() {
                this_.addLoading();
            });

            linkedSource.getSource().on('tileloadend', function() {
                this_.addLoaded();
            });
            linkedSource.getSource().on('tileloaderror', function() {
                this_.addLoaded();
            });
        },
        //统计要开始下载的数量
        addLoading: function() {
            if (this.loading === 0) {
              this.show();
            }
            ++this.loading;
            this.update();
        },
        // 统计下载完的数量
        addLoaded: function() {
            var this_ = this;
            setTimeout(function() {
              ++this_.loaded;
              this_.update();
            }, 100);
        },
        //更新进度条的长度
        update: function() {
            var width = (this.loaded / this.loading * 100).toFixed(1) + '%';
            this.el.style.width = width;
            if (this.loading === this.loaded) {
              this.loading = 0;
              this.loaded = 0;
              var this_ = this;
              setTimeout(function() {
                this_.hide();
              }, 500);
            }
        },
        //显示进度条
        show: function() {
            this.el.style.visibility = 'visible';
        },
        // 隐藏进度条
        hide: function() {
            if (this.loading === this.loaded) {
              this.el.style.visibility = 'hidden';
              this.el.style.width = 0;
            }
        }
    };

    $.OL3Toolkit.getLocation = {
        activate: function () {
            var geolocation = new ol.Geolocation();
            geolocation.setTracking(true);
            geolocation.on('error', function(error) {
                alert(error.message);
            });

            var accuracyFeature = new ol.Feature();
            geolocation.on('change:accuracyGeometry', function() {
                accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
            });

            var positionFeature = new ol.Feature();
            positionFeature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({
                        color: '#3399CC'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#fff',
                        width: 2
                    })
                })
            }));

            geolocation.on('change:position', function() {
                var coordinates = geolocation.getPosition();
                positionFeature.setGeometry(coordinates ?
                    new ol.geom.Point(coordinates) : null);
                map.getView().centerOn(ol.proj.transform(coordinates, "EPSG:4326", "EPSG:3857"), map.getSize(), [570, 500]);
            });

            new ol.layer.Vector({
                map: map,
                source: new ol.source.Vector({
                    features: [accuracyFeature, positionFeature]
                })
            });
        }
    }

}




/**
 * 以下基于代码源于cowboy/jquery-resize
 * https://github.com/cowboy/jquery-resize
 * 暂时原封不动的用着，看后期有啥改动
 */
(function($,window,undefined){
    '$:nomunge'; // YUI compressor使用参数.

    // 一个jQuery对象包含所有要用resize方法的非window元素
    var elems = $([]),

    // 如果$.resize 存在则继承, 否则创建一个.
        jq_resize = $.resize = $.extend( $.resize, {} ),

        timeout_id,

    // 重复利用的字段.
        str_setTimeout = 'setTimeout',
        str_resize = 'resize',
        str_data = str_resize + '-special-event',
        str_delay = 'delay',
        str_throttle = 'throttleWindow';

    // Property: jQuery.resize.delay
    // 
    // The numeric interval (in milliseconds) at which the resize event polling
    // loop executes. Defaults to 250.

    jq_resize[ str_delay ] = 100;

    // Property: jQuery.resize.throttleWindow
    // 
    // Throttle the native window object resize event to fire no more than once
    // every <jQuery.resize.delay> milliseconds. Defaults to true.
    // 
    // Because the window object has its own resize event, it doesn't need to be
    // provided by this plugin, and its execution can be left entirely up to the
    // browser. However, since certain browsers fire the resize event continuously
    // while others do not, enabling this will throttle the window resize event,
    // making event behavior consistent across all elements in all browsers.
    // 
    // While setting this property to false will disable window object resize
    // event throttling, please note that this property must be changed before any
    // window object resize event callbacks are bound.

    jq_resize[ str_throttle ] = true;

    // Event: resize event
    // 
    // Fired when an element's width or height changes. Because browsers only
    // provide this event for the window element, for other elements a polling
    // loop is initialized, running every <jQuery.resize.delay> milliseconds
    // to see if elements' dimensions have changed. You may bind with either
    // .resize( fn ) or .bind( "resize", fn ), and unbind with .unbind( "resize" ).
    // 
    // Usage:
    // 
    // > jQuery('selector').bind( 'resize', function(e) {
    // >   // element's width or height has changed!
    // >   ...
    // > });
    // 
    // Additional Notes:
    // 
    // * The polling loop is not created until at least one callback is actually
    //   bound to the 'resize' event, and this single polling loop is shared
    //   across all elements.
    // 
    // Double firing issue in jQuery 1.3.2:
    // 
    // While this plugin works in jQuery 1.3.2, if an element's event callbacks
    // are manually triggered via .trigger( 'resize' ) or .resize() those
    // callbacks may double-fire, due to limitations in the jQuery 1.3.2 special
    // events system. This is not an issue when using jQuery 1.4+.
    // 
    // > // While this works in jQuery 1.4+
    // > $(elem).css({ width: new_w, height: new_h }).resize();
    // > 
    // > // In jQuery 1.3.2, you need to do this:
    // > var elem = $(elem);
    // > elem.css({ width: new_w, height: new_h });
    // > elem.data( 'resize-special-event', { width: elem.width(), height: elem.height() } );
    // > elem.resize();

    $.event.special[ str_resize ] = {

        // Called only when the first 'resize' event callback is bound per element.
        setup: function() {
            // Since window has its own native 'resize' event, return false so that
            // jQuery will bind the event using DOM methods. Since only 'window'
            // objects have a .setTimeout method, this should be a sufficient test.
            // Unless, of course, we're throttling the 'resize' event for window.
            if ( !jq_resize[ str_throttle ] && this[ str_setTimeout ] ) { return false; }

            var elem = $(this);

            // Add this element to the list of internal elements to monitor.
            elems = elems.add( elem );

            // Initialize data store on the element.
            $.data( this, str_data, { w: elem.width(), h: elem.height() } );

            // If this is the first element added, start the polling loop.
            if ( elems.length === 1 ) {
                loopy();
            }
        },

        // Called only when the last 'resize' event callback is unbound per element.
        teardown: function() {
            // Since window has its own native 'resize' event, return false so that
            // jQuery will unbind the event using DOM methods. Since only 'window'
            // objects have a .setTimeout method, this should be a sufficient test.
            // Unless, of course, we're throttling the 'resize' event for window.
            if ( !jq_resize[ str_throttle ] && this[ str_setTimeout ] ) { return false; }

            var elem = $(this);

            // Remove this element from the list of internal elements to monitor.
            elems = elems.not( elem );

            // Remove any data stored on the element.
            elem.removeData( str_data );

            // If this is the last element removed, stop the polling loop.
            if ( !elems.length ) {
                clearTimeout( timeout_id );
            }
        },

        // Called every time a 'resize' event callback is bound per element (new in
        // jQuery 1.4).
        add: function( handleObj ) {
            // Since window has its own native 'resize' event, return false so that
            // jQuery doesn't modify the event object. Unless, of course, we're
            // throttling the 'resize' event for window.
            if ( !jq_resize[ str_throttle ] && this[ str_setTimeout ] ) { return false; }

            var old_handler;

            // The new_handler function is executed every time the event is triggered.
            // This is used to update the internal element data store with the width
            // and height when the event is triggered manually, to avoid double-firing
            // of the event callback. See the "Double firing issue in jQuery 1.3.2"
            // comments above for more information.

            function new_handler( e, w, h ) {
                var elem = $(this),
                    data = $.data( this, str_data );

                // If called from the polling loop, w and h will be passed in as
                // arguments. If called manually, via .trigger( 'resize' ) or .resize(),
                // those values will need to be computed.
                data.w = w !== undefined ? w : elem.width();
                data.h = h !== undefined ? h : elem.height();

                old_handler.apply( this, arguments );
            };

            // This may seem a little complicated, but it normalizes the special event
            // .add method between jQuery 1.4/1.4.1 and 1.4.2+
            if ( $.isFunction( handleObj ) ) {
                // 1.4, 1.4.1
                old_handler = handleObj;
                return new_handler;
            } else {
                // 1.4.2+
                old_handler = handleObj.handler;
                handleObj.handler = new_handler;
            }
        }

    };

    function loopy() {

        // Start the polling loop, asynchronously.
        timeout_id = window[ str_setTimeout ](function(){

            // Iterate over all elements to which the 'resize' event is bound.
            elems.each(function(){
                var elem = $(this),
                    width = elem.width(),
                    height = elem.height(),
                    data = $.data( this, str_data );

                // If element size has changed since the last time, update the element
                // data store and trigger the 'resize' event.
                if ( width !== data.w || height !== data.h ) {
                    elem.trigger( str_resize, [ data.w = width, data.h = height ] );
                }

            });

            // Loop.
            loopy();

        }, jq_resize[ str_delay ] );

    };

})(jQuery,this);
