var OL3APP = OL3APP || {}
OL3APP.namespace = function(ns_string) {
    var parts = ns_string.split('.'),
        parent = OL3APP,
        i;

    //剥离最前面的冗余全局变量
    if (parts[0] === "OL3APP") {
        parts = parts.slice(1);
    }

    for (i = 0; i < parts.length; i++) {
        //如果不存在，就创建一个属性
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
}

OL3APP.namespace('map');
OL3APP.namespace('view');

//地图定位控件，还存在问题
ol.control.CustomZoomTo = function(opt_options) {
    var options = opt_options || {};

    var button = document.createElement('button');
    button.innerHTML = 'o';

    var this_ = this;

    button.onclick = function(e) {
        e = e || window.event;
        if ($.OL3Toolkit.options.enalblePosition) {
            $.OL3Toolkit.getLocation.activate();
        } else {
            this_.getMap().getView().setCenter($.OL3Toolkit.options.viewCenter);
            this_.getMap().getView().setZoom($.OL3Toolkit.options.zoomLevel);
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



ol.control.CustomZoomTo.prototype.getLocation = function(map, viewCenter) {
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
        OL3APP.map.getView().setCenter(ol.proj.transform(coordinates, "EPSG:4326", "EPSG:3857"));
        OL3APP.map.getView().setZoom($.OL3Toolkit.options.zoomLevel);
    });

    new ol.layer.Vector({
        map: OL3APP.map,
        source: new ol.source.Vector({
            features: [accuracyFeature, positionFeature]
        })
    });
}
/**
 * Created by zzq on 2016/4/26.
 */


// 确保jQuery在ol3toolkit.js前加载
if (typeof jQuery === "undefined") {
    throw new Error("使用ol3toolkit需要先加载jQuery");
}

// 确保OL3在ol3toolkit.js前加载
// Openlayers编写时的版本为V3.15.1
if (typeof ol === "undefined") {
    throw new Error("使用ol3toolkit需要先加载openlayers3");
}

// 确保第三方包LayerSwitcher在ol3toolkit.js前加载
if (typeof ol.control.LayerSwitcher === "undefined") {
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
    viewCenter: [120.63, 30.05],
    //初始地图缩放等级
    zoomLevel: 7,
    minZoomLevel: 9,
    maxZoomLevel: 16,
    //底图数据源
    baseMapSources: ["SkymapRas", 'Skymap', 'OSM', 'SATELLITE', 'QQ', 'BAIDU'],
    //自定义数据源
    customSources: {},
    //自动把输入的'EPSG:4326'转换到'EPSG:3857/900913'
    autoLatLngTransform: true,
    //地图大小自适应
    mapSizeSelfAdaption: true,
    //影响地图高度的外包组件
    mapWrapper: [],
    //影响地图高度的边距总和
    mapMargining:7,
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
    enalblePosition: false,
    //回到初始视角
    backOriginView: true,
    //绑定透明度调整
    //参数为图层组的title名
    //input控件的id必须和内含图层的title对应
    bindOpacityTarget: null,

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
        //设置底图显示，默认全显示
        if (OL3ToolkitOptions.baseMapSources !== "undefined") {
            $.OL3Toolkit.options.baseMapSources = OL3ToolkitOptions.baseMapSources;
        }
        $.extend(true,
            $.OL3Toolkit.options,
            OL3ToolkitOptions);
    }

    //方便调用参数
    var o = $.OL3Toolkit.options;

    //如果要包含进度条的话，在map下方添加一个#progress的div
    if (o.hasProgress) {
        $("#" + o.targetID).after('<div id="progress"></div>');
    }

    //初始化对象
    ol3ToolkitInit_();

    //快速生成地图
    if (o.quickCreation) {
        $.OL3Toolkit.createMap.activate();
    }
    //如果包含百度地图则需动态调整
    OL3APP.map.getLayers().getArray()[0].getLayers().getArray().forEach(function(layer) {
        if (layer.get("title") == "百度地图") {
            OL3APP.view.on('change:center', function(event) {
                layer.getSource().tileGrid = $.OL3Toolkit.Translate.BDtilegrid();
            })
        }
        if (layer.get("title") == "腾讯地图") {
            OL3APP.view.on('change:center', function(event) {
                layer.getSource().tileGrid = $.OL3Toolkit.Translate.QQtilegrid();
            })
        }
    })

    //由于采用的模板是almasaeed2010/AdminLTE
    //https://github.com/almasaeed2010/AdminLTE
    //所以需要自适应的内容填写'.content-wrapper'
    if(o.mapSizeSelfAdaption){
        $.OL3Toolkit.sizeSelfAdaption.activate(o.mapWrapper,o.mapMargining);
    }

    //根据参数判断是否是否允许切换地图功能
    if (o.enableSwitchMultiMapSources) {
        OL3APP.map.addControl(new ol.control.LayerSwitcher());
    }

    //根据参数判断是否添加鸟瞰功能
    if (o.showBirdsEye) {
        OL3APP.map.addControl(new ol.control.OverviewMap({
            tipLabel: '鸟瞰图'
        }));
        //设置样式
        $('.ol-overviewmap').css({
            "right": ".5em",
            "top": ".5em",
            "left": "inherit",
            "bottom": "inherit"
        });
    }

    //根据参数判断是否添加比例尺
    if (o.showScaleLine) {
        OL3APP.map.addControl(new ol.control.ScaleLine());
    }

    //根据参数判断是否添加定位功能
    //to-do：改为根据当前位置
    if (o.enalblePosition || o.backOriginView) {
        ol.inherits(ol.control.CustomZoomTo, ol.control.Control);
        OL3APP.map.addControl(new ol.control.CustomZoomTo());
    }

    if (o.bindOpacityTarget != null) {
        $.OL3Toolkit.controlOpacity.activate(o.bindOpacityTarget)
    }

    if (o.bindOpacityTarget != null) {
        $.OL3Toolkit.controlOpacity.activate(o.bindOpacityTarget)
    }

})

//定义基本点
function point(lng, lat) {
    if (isStr(lng)) {
        lng = parseFloat(lng)
    }
    if (isStr(lat)) {
        lat = parseFloat(lat)
    }
    this.lng = lng;
    this.lat = lat
}
//判断是否是字符串
function isStr(T) {
    return typeof T == "string"
}
/**
 * ----------------------
 * - 初始化OL3Toolkit对象 -
 * ----------------------
 * 所有OL3Toolkit功能在其执行
 * @private
 */
function ol3ToolkitInit_() {
    /**
     * ----------------------
     * - 基础工具部分 -
     * ----------------------
     * 提供以下常用基础工具
     *  1 坐标转换
     *  2 常用地图源
     *  3 选取指定title的layer
     */

    //坐标转换工具
    $.OL3Toolkit.Translate = {
        BDtilegrid: function() {
            var Convertor = $.OL3Toolkit.Translate;
            // 自定义分辨率和瓦片坐标系
            var resolutions = [];
            var maxZoom = 18;
            // 计算百度使用的分辨率
            for (var i = 0; i <= maxZoom; i++) {
                resolutions[i] = Math.pow(2, maxZoom - i);
            }
            return new ol.tilegrid.TileGrid({
                origin: (function() {
                    var epsg3857Center = OL3APP.view.getCenter();
                    var epsg4326Center = ol.proj.transform(epsg3857Center, 'EPSG:3857', 'EPSG:4326');
                    var baiduCoord = Convertor.ll_Mercator.convertLL2MC(epsg4326Center);
                    var baiduCoord2 = ol.proj.transform(Convertor.latlng.mars_baidu(Convertor.latlng.nor_mars(epsg4326Center)), 'EPSG:4326', 'EPSG:3857');
                    return [2 * epsg3857Center[0] - baiduCoord[0] - baiduCoord2[0], 2 * epsg3857Center[1] - baiduCoord[1] - baiduCoord2[1]]
                })(), // 设置原点坐标
                resolutions: resolutions // 设置分辨率
            })
        },
        QQtilegrid: function() {
            var Convertor = $.OL3Toolkit.Translate;
            // 自定义分辨率和瓦片坐标系
            var resolutions = [];
            var projection = ol.proj.get('EPSG:3857');
            var projectionExtent = projection.getExtent();

            var tileSize = 256;

            var maxResolution = ol.extent.getWidth(projectionExtent) / tileSize;
            var z;
            for (z = 0; z < 22; ++z) {
                resolutions[z] = maxResolution / Math.pow(2, z);
            }
            return new ol.tilegrid.TileGrid({
                origin: (function() {
                    var qqOrigin = ol.extent.getBottomLeft(projectionExtent);
                    var epsg3857Center = OL3APP.view.getCenter();
                    var epsg4326Center = ol.proj.transform(epsg3857Center, 'EPSG:3857', 'EPSG:4326');
                    var qqCoord = ol.proj.transform(Convertor.latlng.nor_mars(epsg4326Center), 'EPSG:4326', 'EPSG:3857');
                    return [qqOrigin[0] + epsg3857Center[0] - qqCoord[0], qqOrigin[1] + epsg3857Center[1] - qqCoord[1]]
                })(), // 设置原点坐标
                resolutions: resolutions // 设置分辨率
            })
        }
    };
    $.OL3Toolkit.Translate.latlng = {
        pi: 3.14159265358979324,
        x_pi: 52.35987755982988, //pi * 3000.0 / 180.0,
        a: 6378245.0,
        ee: 0.00669342162296594323,
        nor_mars: function(arg) {
            var wgLon = arg[0];
            var wgLat = arg[1];
            var radLat = wgLat / 180.0 * this.pi;
            var magic = Math.sin(radLat);
            magic = 1 - this.ee * magic * magic;
            var sqrtMagic = Math.sqrt(magic);
            var dLon = this.transformLon(wgLon - 105.0, wgLat - 35.0);
            var dLat = this.transformLat(wgLon - 105.0, wgLat - 35.0);
            dLon = (dLon * 180.0) / (this.a / sqrtMagic * Math.cos(radLat) * this.pi);
            dLat = (dLat * 180.0) / ((this.a * (1 - this.ee)) / (magic * sqrtMagic) * this.pi);
            mLon = wgLon + dLon;
            mLat = wgLat + dLat;
            return [mLon, mLat];
        },
        mars_baidu: function(arg) {
            var x = arg[0],
                y = arg[1];
            var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.x_pi);
            var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.x_pi);
            bdLon = z * Math.cos(theta) + 0.0065;
            bdLat = z * Math.sin(theta) + 0.006;
            return [bdLon, bdLat];
        },
        baidu_mars: function(arg) {
            var x = arg[0] - 0.0065,
                y = arg[1] - 0.006;
            var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_pi);
            var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_pi);
            mgLon = z * Math.cos(theta);
            mgLat = z * Math.sin(theta);
            return [mgLon, mgLat];
        },
        transformLat: function(x, y) {
            var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * this.pi) + 20.0 * Math.sin(2.0 * x * this.pi)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(y * this.pi) + 40.0 * Math.sin(y / 3.0 * this.pi)) * 2.0 / 3.0;
            ret += (160.0 * Math.sin(y / 12.0 * this.pi) + 320 * Math.sin(y * this.pi / 30.0)) * 2.0 / 3.0;
            return ret;
        },
        transformLon: function(x, y) {
            var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * this.pi) + 20.0 * Math.sin(2.0 * x * this.pi)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(x * this.pi) + 40.0 * Math.sin(x / 3.0 * this.pi)) * 2.0 / 3.0;
            ret += (150.0 * Math.sin(x / 12.0 * this.pi) + 300.0 * Math.sin(x / 30.0 * this.pi)) * 2.0 / 3.0;
            return ret;
        }
    };

    $.OL3Toolkit.Translate.ll_Mercator = {
        EARTHRADIUS: 6370996.81,
        MCBAND: [12890594.86, 8362377.87, 5591021, 3481989.83, 1678043.12, 0],
        LLBAND: [75, 60, 45, 30, 15, 0],
        MC2LL: [
            [1.410526172116255e-8, 0.00000898305509648872, -1.9939833816331, 200.9824383106796, -187.2403703815547, 91.6087516669843, -23.38765649603339, 2.57121317296198, -0.03801003308653, 17337981.2],
            [-7.435856389565537e-9, 0.000008983055097726239, -0.78625201886289, 96.32687599759846, -1.85204757529826, -59.36935905485877, 47.40033549296737, -16.50741931063887, 2.28786674699375, 10260144.86],
            [-3.030883460898826e-8, 0.00000898305509983578, 0.30071316287616, 59.74293618442277, 7.357984074871, -25.38371002664745, 13.45380521110908, -3.29883767235584, 0.32710905363475, 6856817.37],
            [-1.981981304930552e-8, 0.000008983055099779535, 0.03278182852591, 40.31678527705744, 0.65659298677277, -4.44255534477492, 0.85341911805263, 0.12923347998204, -0.04625736007561, 4482777.06],
            [3.09191371068437e-9, 0.000008983055096812155, 0.00006995724062, 23.10934304144901, -0.00023663490511, -0.6321817810242, -0.00663494467273, 0.03430082397953, -0.00466043876332, 2555164.4],
            [2.890871144776878e-9, 0.000008983055095805407, -3.068298e-8, 7.47137025468032, -0.00000353937994, -0.02145144861037, -0.00001234426596, 0.00010322952773, -0.00000323890364, 826088.5]
        ],
        LL2MC: [
            [-0.0015702102444, 111320.7020616939, 1704480524535203, -10338987376042340, 26112667856603880, -35149669176653700, 26595700718403920, -10725012454188240, 1800819912950474, 82.5],
            [0.0008277824516172526, 111320.7020463578, 647795574.6671607, -4082003173.641316, 10774905663.51142, -15171875531.51559, 12053065338.62167, -5124939663.577472, 913311935.9512032, 67.5],
            [0.00337398766765, 111320.7020202162, 4481351.045890365, -23393751.19931662, 79682215.47186455, -115964993.2797253, 97236711.15602145, -43661946.33752821, 8477230.501135234, 52.5],
            [0.00220636496208, 111320.7020209128, 51751.86112841131, 3796837.749470245, 992013.7397791013, -1221952.21711287, 1340652.697009075, -620943.6990984312, 144416.9293806241, 37.5],
            [-0.0003441963504368392, 111320.7020576856, 278.2353980772752, 2485758.690035394, 6070.750963243378, 54821.18345352118, 9540.606633304236, -2710.55326746645, 1405.483844121726, 22.5],
            [-0.0003218135878613132, 111320.7020701615, 0.00369383431289, 823725.6402795718, 0.46104986909093, 2351.343141331292, 1.58060784298199, 8.77738589078284, 0.37238884252424, 7.45]
        ],
        convertMC2LL: function(cL) {
            var cL = new point(cL[0], cL[1]);
            var cM, cO;
            cM = new point(Math.abs(cL.lng), Math.abs(cL.lat));
            for (var cN = 0; cN < this.MCBAND.length; cN++) {
                if (cM.lat >= this.MCBAND[cN]) {
                    cO = this.MC2LL[cN];
                    break;
                }
            }
            var T = this.convertor(cL, cO);
            var cL = [T.lng, T.lat];
            return cL
        },
        convertLL2MC: function(T) {
            var T = new point(T[0], T[1]);
            var cL, cN;
            T.lng = this.getLoop(T.lng, -180, 180);
            T.lat = this.getRange(T.lat, -74, 74);
            cL = new point(T.lng, T.lat);
            for (var cM = 0; cM < this.LLBAND.length; cM++) {
                if (cL.lat >= this.LLBAND[cM]) {
                    cN = this.LL2MC[cM];
                    break;
                }
            }
            if (!cN) {
                for (var cM = this.LLBAND.length - 1; cM >= 0; cM--) {
                    if (cL.lat <= -this.LLBAND[cM]) {
                        cN = this.LL2MC[cM];
                        break;
                    }
                }
            }
            var cO = this.convertor(T, cN);
            var T = [cO.lng, cO.lat];
            return T
        },
        convertor: function(cM, cN) {
            if (!cM || !cN) {
                return
            }
            var T = cN[0] + cN[1] * Math.abs(cM.lng);
            var cL = Math.abs(cM.lat) / cN[9];
            var cO = cN[2] + cN[3] * cL + cN[4] * cL * cL + cN[5] * cL * cL * cL + cN[6] * cL * cL * cL * cL + cN[7] * cL * cL * cL * cL * cL + cN[8] * cL * cL * cL * cL * cL * cL;
            T *= (cM.lng < 0 ? -1 : 1);
            cO *= (cM.lat < 0 ? -1 : 1);
            return new point(T, cO)
        },
        getRange: function(cM, cL, T) {
            if (cL != null) {
                cM = Math.max(cM, cL)
            }
            if (T != null) {
                cM = Math.min(cM, T)
            }
            return cM
        },
        getLoop: function(cM, cL, T) {
            while (cM > T) {
                cM -= T - cL
            }
            while (cM < cL) {
                cM += T - cL
            }
            return cM;
        }
    }


    $.OL3Toolkit.mapSources = {
        SkymapRas: function() {
            return new ol.layer.Tile({
                title: '天地图卫星',
                type: 'base',
                visible: true,
                source: new ol.source.XYZ({
                    attributions: [
                        new ol.Attribution({
                            html: 'Tiles &Copy; <a href="http://http://map.tianditu.com/">' +
                                '天地图</a>'
                        })
                    ],
                    url: "http://t3.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}"
                })
            });
        },
        Skymap: function() {
            return new ol.layer.Tile({
                title: '天地图矢量',
                type: 'base',
                visible: false,
                source: new ol.source.XYZ({
                    attributions: [
                        new ol.Attribution({
                            html: 'Tiles &Copy; <a href="http://http://map.tianditu.com/">' +
                                '天地图</a>'
                        })
                    ],
                    url: "http://t6.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}"
                })
            });
        },
        OSM: function() {
            return new ol.layer.Tile({
                title: 'OSM',
                type: 'base',
                visible: false,
                source: new ol.source.OSM()
            });
        },
        QQ: function() {
            var attribution = new ol.Attribution({
                html: 'Copyright:&copy; 2015 腾讯地图'
            });

            var urlTemplate = 'http://p3.map.gtimg.com/maptilesv3/{z}/{qqx}/{qqy}/{x}_{y}.png?version=20150501';
            var tilesource = new ol.source.TileImage({
                attributions: [attribution],
                // projection: ol.proj.get('EPSG:3857'),
                tileGrid: $.OL3Toolkit.Translate.QQtilegrid(),
                tileUrlFunction: function(xyz, pixelRatio, projection) {
                    if (!xyz) {
                        return "";
                    }
                    var z = xyz[0];
                    var x = xyz[1];
                    var y = xyz[2];
                    if (x < 0) {
                        x = "M" + (-x);
                    }
                    if (y < 0) {
                        y = "M" + (-y);
                    }
                    var qqx = Math.floor(x / 16.0);
                    var qqy = Math.floor(y / 16.0);
                    return urlTemplate.replace('{z}', z.toString())
                        .replace('{y}', y.toString())
                        .replace('{x}', x.toString())
                        .replace('{qqx}', qqx.toString())
                        .replace('{qqy}', qqy.toString());
                }
            });
            return new ol.layer.Tile({
                title: '腾讯地图',
                type: 'base',
                visible: true,
                source: tilesource
            });
        },
        BAIDU: function() {

            var attribution = new ol.Attribution({
                html: 'Copyright:&copy; 2015 百度地图'
            });
            // 创建百度地图的数据源
            var baiduSource = new ol.source.TileImage({
                attributions: [attribution],
                projection: 'EPSG:3857',
                tileGrid: $.OL3Toolkit.Translate.BDtilegrid(),
                tileUrlFunction: function(tileCoord, pixelRatio, proj) {
                    var z = tileCoord[0];
                    var x = tileCoord[1];
                    var y = tileCoord[2];
                    // 百度瓦片服务url将负数使用M前缀来标识
                    if (x < 0) {
                        x = 'M' + (-x);
                    }
                    if (y < 0) {
                        y = 'M' + (-y);
                    }

                    return "http://online0.map.bdimg.com/onlinelabel/?qt=tile&x=" + x + "&y=" + y + "&z=" + z + "&styles=pl&udt=20160426&scaler=1&p=0";
                }
            });

            // 百度地图层
            return new ol.layer.Tile({
                title: '百度地图',
                type: 'base',
                visible: true,
                source: baiduSource
            });
        },
        SATELLITE: function() {
            return new ol.layer.Tile({
                title: '高分卫星',
                type: 'base',
                visible: false,
                source: new ol.source.TileWMS({
                    ratio: 1,
                    // extent: bounds,
                    url: 'http://120.26.39.24/geoserver/sx/wms',
                    params: {
                        'VERSION': '1.1.1',
                        STYLES: '',
                        LAYERS: 'sx:sx_city_GF',
                    }
                })
            });
        },
        TIAN: function() {
            return new ol.layer.Tile({
                title: '天地图',
                type: 'base',
                visible: false,
                source: new ol.source.XYZ({
                    attributions: [
                        new ol.Attribution({
                            html: 'Tiles &Copy; <a href="http://http://map.tianditu.com/">' +
                                '天地图</a>'
                        })
                    ],
                    url: "http://t6.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}"
                })
            });
        },
    };

    /**
     * 创建简单地图
     * ==========
     * 只需输入绑定ID
     *
     * @type {{activate: $.OL3Toolkit.createMap.activate}}
     */
    $.OL3Toolkit.createMap = {
        activate: function() {
            var this_ = this;
            //方便调用参数
            var o = $.OL3Toolkit.options;
            //如果开启自动转换经纬度，且参数正确，则把经纬度转换成标准坐标参考系
            if ($.OL3Toolkit.options.autoLatLngTransform && o.viewCenter[0] <= 180 && o.viewCenter[0] >= -180 && o.viewCenter[1] <= 90 && o.viewCenter[1] >= -90) {
                o.viewCenter = ol.proj.transform(o.viewCenter, 'EPSG:4326', 'EPSG:3857')
            }
            OL3APP.view = new ol.View({
                center: o.viewCenter,
                zoom: o.zoomLevel,
                minZoom: o.minZoomLevel,
                maxZoom: o.maxZoomLevel
            });
            OL3APP.map = new ol.Map({
                view: OL3APP.view,
                layers: this_.createLayers(o.baseMapSources),
                target: o.targetID
            });
        },
        // 组装成最终的图层
        createLayers: function(baseSource) {
            var this_ = this;

            var baseMaps = new ol.layer.Group({
                'title': '底图数据',
                layers: this_.traverseMapSources($.OL3Toolkit.mapSources, baseSource)
            });
            var overlays = new ol.layer.Group({
                title: '叠加图层',
                layers: this_.traverseMapSources($.OL3Toolkit.options.customSources)
            });
            return [baseMaps, overlays];
        },
        // 遍历参数，组装成底图图层
        traverseMapSources: function(exitMapSources, neededMapSources) {
            var finalBaselayers = [];
            //如果exitMapSources中有需要的底图，则组装成底图图层组
            for (var item in exitMapSources) {
                if (neededMapSources == undefined) {
                    finalBaselayers.push(exitMapSources[item]());
                } else {
                    for (var i = 0; i < neededMapSources.length; i++) {
                        if (neededMapSources[i] == item) {
                            var source = exitMapSources[item]();
                            //添加进度条
                            if ($.OL3Toolkit.options.hasProgress) {
                                $.OL3Toolkit.progress.activate(source);
                            }
                            finalBaselayers.push(source);
                        }
                    }
                }
            }
            return finalBaselayers;
        }
    };


    $.OL3Toolkit.sizeSelfAdaption = {
        activate: function (mapWrapper,mapMargining) {
            //初始时调整
            var this_ = this;
            this_.fix(mapWrapper,mapMargining);
            //改变窗口大小时再次调整
            $('#map').resize(function () {
                this_.fix(mapWrapper,mapMargining);
            });
        },
        fix: function (mapWrapper,mapMargining) {
        	var wrapheights=0;
        	for(var i=0;i<mapWrapper.length;i++){
        		wrapheights+=$(mapWrapper[i]).outerHeight();
        	}
            OL3APP.map.setSize([$('#map').width(),$(window).height() - wrapheights - mapMargining])
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
                /*var this_ = this;
              setTimeout(function() {
                this_.hide();
              }, 500);*/
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
            }
        }
    };

    //还存在问题
    $.OL3Toolkit.getLocation = {
        activate: function() {
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
                OL3APP.map.getView().centerOn(ol.proj.transform(coordinates, "EPSG:4326", "EPSG:3857"), map.getSize(), [570, 500]);
            });

            new ol.layer.Vector({
                map: OL3APP.map,
                source: new ol.source.Vector({
                    features: [accuracyFeature, positionFeature]
                })
            });
        }
    }

    //绑定透明度
    $.OL3Toolkit.controlOpacity = {
        activate: function(targetLayerGroup) {
            var this_ = this;
            this_.findTargetLayerGroup(targetLayerGroup);
        },
        findTargetLayerGroup: function(targetName) {
            var this_ = this;
            map.getLayers().forEach(function(layerGroup, j) {
                if (layerGroup.values_.title == targetName) {
                    layerGroup.getLayers().forEach(function(layerTile, j) {
                        this_.bindOpacity('#' + layerTile.values_.title, layerTile);
                    })
                }
            })
        },
        bindOpacity: function(targetID, layer) {
            var opacityInput = $(targetID);
            opacityInput.on('input change', function() {
                layer.setOpacity(parseFloat(this.value));
            });
            opacityInput.val(String(layer.getOpacity()));
        }
    }
	
	//组装GeoJSON features，以便调用readFeatures，最终显示图层
    //geomModels 1.包含属性为geomAtbName，值为ST_AsGeoJSON查询格式的对象list
    //           2.ST_AsGeoJSON查询格式的对象list(geomAtbName=null
    $.OL3Toolkit.makefeatures = {
        makeGeoJSONfeatures: function(geomModels, geomAtbName) {
            var features = [];
            console.log("makeFeature");
            for (var i = 0; i < geomModels.length; i++) {
                //console.log(JSON.parse(geomModels[i].geom));
                if (geomAtbName != null) {
                    features.push($.extend({
                        'type': 'Feature'
                    }, {
                        'geometry': JSON.parse(geomModels[i][geomAtbName])
                    }));
                } else {
                    features.push($.extend({
                        'type': 'Feature'
                    }, {
                        'geometry': JSON.parse(geomModels[i])
                    }));
                }
            }
            //console.log("makeFeatureCollection");
            return $.extend({}, {
                'type': 'FeatureCollection'
            }, {
                'crs': {
                    'type': 'name',
                    'properties': {
                        'name': 'EPSG:3857'
                    }
                }
            }, {
                'features': features
            });
        }
    }

}




/**
 * 以下基于代码源于cowboy/jquery-resize
 * https://github.com/cowboy/jquery-resize
 * 暂时原封不动的用着，看后期有啥改动
 */
(function($, window, undefined) {
    '$:nomunge'; // YUI compressor使用参数.

    // 一个jQuery对象包含所有要用resize方法的非window元素
    var elems = $([]),

        // 如果$.resize 存在则继承, 否则创建一个.
        jq_resize = $.resize = $.extend($.resize, {}),

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

    jq_resize[str_delay] = 100;

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

    jq_resize[str_throttle] = true;

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

    $.event.special[str_resize] = {

        // Called only when the first 'resize' event callback is bound per element.
        setup: function() {
            // Since window has its own native 'resize' event, return false so that
            // jQuery will bind the event using DOM methods. Since only 'window'
            // objects have a .setTimeout method, this should be a sufficient test.
            // Unless, of course, we're throttling the 'resize' event for window.
            if (!jq_resize[str_throttle] && this[str_setTimeout]) {
                return false;
            }

            var elem = $(this);

            // Add this element to the list of internal elements to monitor.
            elems = elems.add(elem);

            // Initialize data store on the element.
            $.data(this, str_data, {
                w: elem.width(),
                h: elem.height()
            });

            // If this is the first element added, start the polling loop.
            if (elems.length === 1) {
                loopy();
            }
        },

        // Called only when the last 'resize' event callback is unbound per element.
        teardown: function() {
            // Since window has its own native 'resize' event, return false so that
            // jQuery will unbind the event using DOM methods. Since only 'window'
            // objects have a .setTimeout method, this should be a sufficient test.
            // Unless, of course, we're throttling the 'resize' event for window.
            if (!jq_resize[str_throttle] && this[str_setTimeout]) {
                return false;
            }

            var elem = $(this);

            // Remove this element from the list of internal elements to monitor.
            elems = elems.not(elem);

            // Remove any data stored on the element.
            elem.removeData(str_data);

            // If this is the last element removed, stop the polling loop.
            if (!elems.length) {
                clearTimeout(timeout_id);
            }
        },

        // Called every time a 'resize' event callback is bound per element (new in
        // jQuery 1.4).
        add: function(handleObj) {
            // Since window has its own native 'resize' event, return false so that
            // jQuery doesn't modify the event object. Unless, of course, we're
            // throttling the 'resize' event for window.
            if (!jq_resize[str_throttle] && this[str_setTimeout]) {
                return false;
            }

            var old_handler;

            // The new_handler function is executed every time the event is triggered.
            // This is used to update the internal element data store with the width
            // and height when the event is triggered manually, to avoid double-firing
            // of the event callback. See the "Double firing issue in jQuery 1.3.2"
            // comments above for more information.

            function new_handler(e, w, h) {
                var elem = $(this),
                    data = $.data(this, str_data);

                // If called from the polling loop, w and h will be passed in as
                // arguments. If called manually, via .trigger( 'resize' ) or .resize(),
                // those values will need to be computed.
                data.w = w !== undefined ? w : elem.width();
                data.h = h !== undefined ? h : elem.height();

                old_handler.apply(this, arguments);
            };

            // This may seem a little complicated, but it normalizes the special event
            // .add method between jQuery 1.4/1.4.1 and 1.4.2+
            if ($.isFunction(handleObj)) {
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
        timeout_id = window[str_setTimeout](function() {

            // Iterate over all elements to which the 'resize' event is bound.
            elems.each(function() {
                var elem = $(this),
                    width = elem.width(),
                    height = elem.height(),
                    data = $.data(this, str_data);

                // If element size has changed since the last time, update the element
                // data store and trigger the 'resize' event.
                if (width !== data.w || height !== data.h) {
                    elem.trigger(str_resize, [data.w = width, data.h = height]);
                }

            });

            // Loop.
            loopy();

        }, jq_resize[str_delay]);

    };

})(jQuery, this);