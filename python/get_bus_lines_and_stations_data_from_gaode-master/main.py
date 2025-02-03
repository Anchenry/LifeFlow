# -*- coding: utf-8 -*-
# @Author: Bardbo
# @Date:   2020-11-09 22:02:58
# @Last Modified by:   Bardbo
# @Last Modified time: 2020-11-09 22:04:34
from get_bus_line_station_data_by_gaode import *
from line_station_data_to_shp import *
import time

if __name__ == '__main__':
    # 此处参数需更改
    city = '武汉'
    city_phonetic = 'wuhan'
    ak = '2c664e69cf8b5f8dff7bff7a34392a82'  # 这里建议更改为自己的key

    # start_time = time.time()
    # print(f'==========正在获取 {city} 线路名称==========')
    # line_names = get_bus_line_name(city_phonetic)
    # print(f'{city}在公交网上显示共有{len(line_names)}条线路')
    #
    # # 获取已爬取的进度
    # last_line, total_rows = check_data_progress(f'{city_phonetic}_lines.csv')
    #
    # # 从 start_index 开始爬取剩余的线路
    # for line_name in tqdm(line_names[total_rows:]):  # 从进度处开始爬取
    #     get_line_station_data(city, line_name, ak, city_phonetic)
    # end_time = time.time()
    # print(f'我爬完啦, 耗时{end_time - start_time}秒')

    print('正在创建shp文件')
    dts = DataToShp(city_phonetic + '_lines.csv')
    dts.get_station_data()
    dts.get_line_data()
    dts.create_station_shp(city_phonetic)
    dts.create_lines_shp(city_phonetic)
    print('shp文件创建完成')
