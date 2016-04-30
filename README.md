# OpenLayers3 Toolkit
针对Openlayers3写的一套工具包，基于v3.15.1版本。

## 开发计划
目前主要计划完成的功能模块：
* 快速构建地图
* 地图大小自适应
* 常用功能集成
* 简便画点线面

## 使用说明
在加载ol3toolkit.js前先加载js文件夹里的其他引用包和css，然后在script中简单设置OL3ToolkitOptions对象即可。如
> var OL3ToolkitOptions = {zoomLevel: 10, viewCenter:[120,30]};
具体实例请参照example.html

##常用参数
OL3ToolkitOptions中常用参数包括
* targetID: 绑定的<div>Id,
* viewCenter: 地图起始中心坐标,
* zoomLevel: 初始地图缩放等级,    
* baseMapSource: 底图数据源，暂时只有["OSM",'SATELLITE']两种
其他参数请详见ol3toolkit.js