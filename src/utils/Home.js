// map.js
import {Feature, Map} from 'ol';
import Tile from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { View } from 'ol';
import { defaults, ScaleLine, MousePosition } from 'ol/control';
import VectorSource from "ol/source/Vector.js";
import { Icon, Stroke, Style} from "ol/style.js";
import {LineString, Point, Polygon} from "ol/geom.js";
import VectorLayer from "ol/layer/Vector.js";
import Papa from 'papaparse';
import { Heatmap } from "ol/layer.js";
import { ref } from 'vue';
import { createStringXY } from "ol/coordinate.js";
import { easeOut } from "ol/easing.js";
import { extend, getCenter} from "ol/extent.js";


let main_map = null;
let home_coordinate = null
let currentHeatmapLayer = null;  // 热力图图层
export let totalConvenience = ref(0);
const categoryPOIs = {};

export function initMap(mapRef) {
    //实例化比例尺控件（ScaleLine）
    var scaleLine = new ScaleLine({
        // 设置比例尺单位，degrees、imperial、us、nautical、metric（度量单位）
        units: "metric"
    });
    var mousePosition = new MousePosition({
        projection: 'EPSG:4326',
        coordinateFormat: createStringXY(4)
    });

    // 地图实例化
    main_map = new Map({
        target: mapRef,
        layers: [
            new Tile({
                source: new XYZ({
                    url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
                }),
            }),
        ],
        view: new View({
            projection: 'EPSG:4326',
            center: [114.29, 30.55],
            zoom: 12,
        }),
        controls: defaults({
            zoom: false,
            rotate: false,
            attribution: false
        }).extend([
            scaleLine,
            mousePosition
        ])
    });

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: function (feature) {
            return new Style({
                image: new Icon({
                    src: 'src/assets/home.svg', // 图标
                    scale: 0.2,
                }),
            });
        },
    });
    main_map.addLayer(vectorLayer);  // 中心点图层
    main_map.addLayer(vectorLayer_bus);  // 公交站点图层
    main_map.addLayer(vectorLayer_busline);  // 公交线路图层

    // 监听点击事件
    main_map.on('click', (event) => {
        home_coordinate = event.coordinate; // 获取点击的坐标

        // 清空当前矢量源中的所有要素
        vectorSource.clear();

        // 创建点标签
        const pointFeature = new Feature({
            geometry: new Point(home_coordinate),
        });
        //设置要素样式
        vectorSource.addFeature(pointFeature);

        const nearestCity = findNearestCity(home_coordinate)
        // 计算生活便利
        loadCityCSV(nearestCity, categories, 1);  // 根据城市加载对应的CSV文件
        readSHPAndCSV(nearestCity, home_coordinate)
    });
}

export function switchMapLayer(layerId) {
    if (main_map) {
        const mapLayer = main_map.getLayers().item(0);
        switch (layerId) {
            case 'GaoDe矢量':
                mapLayer.setSource(new XYZ({
                    url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
                }));
                break;
            case 'GaoDe影像':
                mapLayer.setSource(new XYZ({
                    url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=6',
                }));
                break;
            case 'GaoDe影像注记':
                mapLayer.setSource(new XYZ({
                    url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8',
                }));
                break;
            default:
                mapLayer.setSource(new XYZ({
                    url: 'http://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
                }));
        }
    }
}

//
// 生活便利
//
const cities = {
    "武汉市": { lat: 30.592, lon: 114.305 },
    "北京市": { lat: 39.904, lon: 116.407 },
    "上海市": { lat: 31.2304, lon: 121.4737 },
    // 其他城市...
};

// Haversine公式计算两点之间的距离（单位：公里）
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径，单位为公里
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // 返回距离，单位为公里
}

// 加载对应城市的 CSV 文件
const categories = [
    {
        category: '商业',
        subcategories: ['餐饮美食', '购物消费']
    },
    {
        category: '交通',
        subcategories: ['交通设施', '汽车相关']
    },
    {
        category: '休闲',
        subcategories: ['休闲娱乐', '旅游景点']
    },    {
        category: '公共服务',
        subcategories: ['医疗保健', '生活服务', '运动健身', '科教文化']
    },
];

// 根据点击位置找到离哪个城市最近，并加载对应城市的 CSV 文件
function findNearestCity(home_coordinate) {
    const targetLat = home_coordinate[1]; // 获取点击的纬度
    const targetLon = home_coordinate[0]; // 获取点击的经度

    // 计算到每个城市的距离
    let nearestCity = null;
    let minDistance = Infinity;

    for (const city in cities) {
        const { lat, lon } = cities[city];
        const distance = haversine(targetLat, targetLon, lat, lon);
        if (distance < minDistance) {
            minDistance = distance;
            nearestCity = city;
        }
    }

    // 输出最近的城市
    console.log(`最近的城市是: ${nearestCity}，距离: ${minDistance.toFixed(2)}公里`);

    return nearestCity
}

export const maxDistance = 1
function loadCityCSV(city, categories, maxDistance = maxDistance) {
    const filePath = `src/assets/poi/${city}POI数据.csv`; // 假设 CSV 文件按城市命名

    // 读取CSV文件
    fetch(filePath)
        .then(response => response.text())
        .then(csvText => {
            // 使用PapaParse解析CSV
            Papa.parse(csvText, {
                complete: function (result) {
                    const data = result.data;

                    // 按大类和子类筛选POI数据
                    categories.forEach(group => {
                        const filteredPOIs = data.filter(row => {
                            const category = row[1];  // 假设大类在CSV的第二列
                            return group.subcategories.includes(category);
                        });

                        // 过滤出距离 home_coordinate 1公里以内的POI点
                        const nearbyPOIs = filteredPOIs.filter(poi => {
                            const poiLat = parseFloat(poi[4]);  // 假设纬度在CSV的第5列
                            const poiLon = parseFloat(poi[3]);  // 假设经度在CSV的第4列
                            const distance = haversine(home_coordinate[1], home_coordinate[0], poiLat, poiLon);
                            return distance <= maxDistance;  // 只保留距离1公里以内的POI
                        });

                        // 将筛选后的POI数据存入 categoryPOIs 对象中
                        categoryPOIs[group.category] = nearbyPOIs;
                    });

                    // 打印每个大类的POI数据
                    console.log(categoryPOIs);
                    calculateOverallConvenience(categoryPOIs, home_coordinate, userPreferences)
                    addHeatmapLayer(heatmapStates);
                },
                error: function (error) {
                    console.error("CSV解析失败", error);
                }
            });
        })
        .catch(error => {
            console.error("加载CSV文件失败", error);
        });
}

// 热力图显示状态
export const heatmapStates = {
    '商业': true,
    '交通': false,
    '休闲': false,
    '公共服务': false,
};
// 热力图色带
const gradients = [
    ['#ADD8E6', '#4682B4', '#00008B', '#000080'], // 蓝色渐变（浅蓝到深蓝）
    ['#FFCCCB', '#FF6347', '#FF4500', '#8B0000'], // 红色渐变（浅红到深红）
    ['#98FB98', '#32CD32', '#006400', '#004d00'], // 绿色渐变（浅绿到深绿）
    ['#FFFFE0', '#FFD700', '#FF8C00', '#FF4500'], // 黄色渐变（浅黄到深黄）
    ['#0000FF', '#00FFFF', '#FFFF00', '#FF0000'],   // 蓝到红色渐变
    ['#00FF00', '#FFFF00', '#FF8000', '#FF0000'],   // 绿色到红色渐变
    ['#0000FF', '#00FFFF', '#FFFF00', '#FF7F00', '#FF0000'],   // 冷色到热色
    ['#FF6347', '#FF7F50', '#FF8C00', '#FF0000']   // 暖色调
];
export function addHeatmapLayer(SelectheatmapStates) {
    // 更新 heatmapStates 为传入的选择状态
    for (const category in SelectheatmapStates) {
        if (heatmapStates.hasOwnProperty(category)) {
            heatmapStates[category] = SelectheatmapStates[category];
        }
    }

    // 如果已经存在热力图层，先清除它
    if (currentHeatmapLayer) {
        main_map.removeLayer(currentHeatmapLayer);
    }

    // 创建一个新的矢量源，用于热力图的数据
    const heatmapSource = new VectorSource();

    // 遍历 SelectheatmapStates，判断每个类别的可见性
    Object.entries(SelectheatmapStates).forEach(([category, visible]) => {
        if (visible && Array.isArray(categoryPOIs[category])) {
            categoryPOIs[category].forEach(poi => {
                const poiLat = parseFloat(poi[4]);
                const poiLon = parseFloat(poi[3]);
                const feature = new Feature({
                    geometry: new Point([poiLon, poiLat]),
                });
                // 为POI设置权重（可以根据实际情况调整）
                feature.set('weight', 0.6);
                heatmapSource.addFeature(feature);
            });
        } else if (!visible) {
            console.log(`Heatmap for ${category} is not visible`);
        }
    });

    // 创建热力图层
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    const heatmapLayer = new Heatmap({
        source: heatmapSource,
        blur: 10,  // 模糊度
        radius: 5,  // 点的半径
        weight: function (feature) {
            return feature.get('weight');  // 获取点的权重
        },
        gradient: randomGradient,
    });

    // 将新创建的热力图层添加到地图中
    main_map.addLayer(heatmapLayer);
    currentHeatmapLayer = heatmapLayer;

    // // 飞行动画
    // if (home_coordinate) {
    //     main_map.getView().animate({
    //         center: home_coordinate, // 设置中心为 home 坐标
    //         zoom: 15,                // 设置缩放级别
    //         duration: 1000           // 动画持续时间为1秒
    //     });
    // }
}

export const userPreferences = {
    '商业': 10,
    '交通': 10,
    '休闲': 10,
    '公共服务': 10
};

export function updateMacDistance(valuedistance) {
    Object.assign(maxDistance, valuedistance);
    console.log('Updated maxdistance:', maxDistance);
}
export function updateUserPreferences(updatedPreferences) {
    Object.assign(userPreferences, updatedPreferences);
    console.log('Updated preferences:', userPreferences);
}

// 计算用户偏好的总权重
function calculateUserWeight(userPreferences) {
    const totalScore = Object.values(userPreferences).reduce((acc, score) => acc + score, 0); // 计算总分
    return totalScore; // 计算平均权重
}

// 计算距离的倒数来作为便利度得分
function calculateDistanceScore(poiLat, poiLon, homeLat, homeLon) {
    const distance = haversine(homeLat, homeLon, poiLat, poiLon); // 使用haversine计算距离
    if (distance === 0) return 1; // 如果POI和家在同一点，返回满分
    return 1 - (distance / maxDistance); // 距离越小，分数越高
}

// 计算POI的便利度分数
function calculatePOIScore(poi, category, home_coordinate, userPreferences, maxDistance) {
    const poiLat = parseFloat(poi[4]); // 假设纬度在CSV的第5列
    const poiLon = parseFloat(poi[3]); // 假设经度在CSV的第4列
    // 计算距离得分，取值范围 0-1
    const distanceScore = calculateDistanceScore(poiLat, poiLon, home_coordinate[1], home_coordinate[0]);
    // 获取用户对该类别的偏好分数
    const userRating = userPreferences[category] || 0; // 如果没有评分，默认为0
    // 计算总权重
    const totalScore = calculateUserWeight(userPreferences);
    // 返回加权后的便利度得分
    return distanceScore * userRating / totalScore;
}

// 计算所有POI的综合便利度分数
function calculateOverallConvenience(categoryPOIs, home_coordinate, userPreferences) {
    totalConvenience.value = 0;  // 修改为响应式的 totalConvenience
    let totalPOIs = 0;

    Object.keys(categoryPOIs).forEach(category => {
        const pois = categoryPOIs[category];

        pois.forEach(poi => {
            // 计算每个POI的便利度得分
            const poiScore = calculatePOIScore(poi, category, home_coordinate, userPreferences);
            totalConvenience.value += poiScore;
            totalPOIs += 1;
        });
    });

    // 计算最终的平均便利度分数
    return totalPOIs === 0 ? 0 : totalConvenience.value / totalPOIs;
}

//
// 公共交通便利
//
const vectorSource_bus = new VectorSource();
const vectorLayer_bus = new VectorLayer({
    source: vectorSource_bus,
    style: function (feature) {
        return new Style({
            image: new Icon({
                src: 'src/assets/bustation.svg', // 图标
                scale: 0.2,
            }),
        });
    },
});

function readSHPAndCSV(city, coordinate) {
    vectorSource_bus.clear();
    // 根据城市名称决定 SHP 和 CSV 文件路径
    const geojsonPath = `src/assets/busdata/${city}/stations.geojson`;
    const csvPath = `src/assets/busdata/${city}/lines.csv`;

    // 读取 GeoJSON 文件
    fetch(geojsonPath)
        .then(response => response.json())
        .then(geojson => {
            const { nearestPoint, nearestName } = findNearestPoint(geojson, coordinate);
            console.log('最近的站点名称:', nearestName);

            // 创建点标签
            const pointFeature = new Feature({
                geometry: new Point(nearestPoint),
            });
            //设置要素样式
            vectorSource_bus.addFeature(pointFeature);

            // 读取 CSV 文件并查找经过该站点的线路
            fetch(csvPath)
                .then(response => response.text())
                .then(csvText => {
                    const routes = findRoutesPassingThroughStation(csvText, nearestName);
                    console.log('经过该站点的线路:', routes);
                    visualizeRoutes(routes);
                })
                .catch(error => console.error('读取 CSV 文件失败:', error));
        })
        .catch(error => console.error('读取 GeoJSON 文件失败:', error));
}

const vectorSource_busline = new VectorSource();
const vectorLayer_busline = new VectorLayer({
    source: vectorSource_busline,
    style: new Style({
        stroke: new Stroke({
            color: '#1E90FF',  // 使用亮蓝色
            width: 4,           // 设置较宽的线条
            lineCap: 'round',   // 线条端点样式，'round'为圆头
            lineJoin: 'round',  // 线条连接处样式，'round'为圆角连接
            dash: [10, 10]      // 设置虚线效果，10px的线段和10px的空白
        }),
    })
});
// 假设你的地图容器ID为 'map'，并且你已经初始化了一个 OpenLayers 地图实例
function visualizeRoutes(routes) {
    vectorSource_busline.clear();  // 清空之前的线路数据

    // 创建一个包含所有线路的坐标范围
    let extent = null;
    // 遍历所有线路数据
    routes.forEach(route => {
        const lineData = route.lineData;  // 获取线路的坐标数据
        const coordinates = lineData.split(';').map(coord => {
            const [lon, lat] = coord.split(',').map(Number); // 假设坐标以经度,纬度格式存储
            return [lon, lat];
        });
        // 创建 OpenLayers LineString 对象，表示一条线路
        const lineString = new LineString(coordinates);
        // 创建一个 feature 对象，并将 LineString 设置为其几何体
        const routeFeature = new Feature({
            geometry: lineString,
            name: route.routeName // 你可以在属性中保存线路名称等信息
        });
        // 将该 feature 添加到矢量图层中
        vectorLayer_busline.getSource().addFeature(routeFeature);

        // 更新包含所有线路的坐标范围
        if (!extent) {
            extent = lineString.getExtent();
        } else {
            extent = new extend(extent, lineString.getExtent());
        }
    });

    if (extent) {
        // 使用 extent 数组来创建一个矩形 polygon
        const [minX, minY, maxX, maxY] = extent;
        const polygon = new Polygon([[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]]);
        // 使视图适配新的范围，并加上边距
        main_map.getView().fit(extent, { padding: [120, 450, 120, 120] });
    }
    // // 如果有线路数据，进行飞行动画
    // if (extent) {
    //     // 获取地图视图的大小（宽和高）
    //     const size = main_map.getSize();
    //     // 计算适合的 zoom 索引（通过获取当前分辨率并调整至适合的级别）
    //     const resolution = main_map.getView().getResolutionForZoom(main_map.getView().getZoom());
    //     // 根据 extent 和地图尺寸来计算合适的 zoom
    //     const newZoom = main_map.getView().getZoomForResolution(resolution);
    //     main_map.getView().animate({
    //         center: getCenter(extent),                // 计算中心点
    //         zoom: main_map.getView().getZoomForResolution(main_map.getView().getResolutionForZoom(main_map.getView().getZoom())),                        // 使用合适的 zoom
    //         duration: 2000,                           // 飞行动画持续时间
    //         easing: easeOut                          // 动画缓动效果
    //     });
    // }
}

// 找出经过该站点的线路
function findRoutesPassingThroughStation(csvText, nearestName) {
    const routes = [];

    // 解析 CSV 文件，指定没有表头
    const parsed = Papa.parse(csvText, { header: false });
    const lines = parsed.data;  // 获取所有线路数据

    // 去除字符串中的非汉字字符的函数
    function removeNonChinese(str) {
        return str.replace(/[^\u4e00-\u9fa5]/g, ''); // 只保留汉字
    }

    // 将 nearestName 处理为只保留汉字
    const cleanNearestName = removeNonChinese(nearestName);
    // 遍历每一条线路
    lines.forEach(line => {
        // 确保 line[3] 存在并且是一个有效的字符串
        if (line[3] && typeof line[3] === 'string') {
            // 获取站点名称列（假设第4列是站点名称）
            const stationNames = line[3].split(',').map(station => removeNonChinese(station));

            // 检查是否包含目标站点名称（只保留汉字）
            if (stationNames.includes(cleanNearestName)) {
                // 如果包含，保存该线路的名称和线路信息（假设第1列为线路名称，第2列为线路信息）
                routes.push({
                    routeName: line[0],  // 线路名称（假设第1列为线路名称）
                    lineData: line[1]    // 线路信息（第2列为站点名称）
                });
            }
        } else {
            console.warn('第4列数据无效或为空:', line);
        }
    });
    return routes; // 返回包含经过该站点的线路信息
}


function findNearestPoint(geojson, targetCoordinate) {
    const targetLat = targetCoordinate[1];  // 纬度
    const targetLon = targetCoordinate[0];  // 经度
    let nearestPoint = null;
    let nearestName = null;  // 用于存储最近站点的名称
    let minDistance = Infinity;

    // 遍历 GeoJSON 文件中的所有点
    geojson.features.forEach(feature => {
        const lon = feature.geometry.coordinates[0];
        const lat = feature.geometry.coordinates[1];
        const distance = haversine(targetLat, targetLon, lat, lon);

        // 更新最近的点和站点名称
        if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = feature.geometry.coordinates;
            nearestName = feature.properties.name;  // 假设站点名称保存在 properties.name 字段
        }
    });

    // 返回最近的点和站点名称
    return { nearestPoint, nearestName };
}