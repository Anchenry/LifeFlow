# -*- coding: utf-8 -*-
# @Author: Bardbo
# @Date:   2020-11-09 20:11:24
# @Last Modified by:   Bardbo
# @Last Modified time: 2020-11-09 20:51:38
import requests
import json
import pandas as pd
from lxml import etree
import time
from tqdm import tqdm


def get_bus_line_name(city_phonetic):
    """[从公交网获取某一个城市的公交线路的名字]

    Args:
        city_phonetic ([str]): [城市名字的拼音，如changsha]

    Returns:
        [list]: [公交网该城市所有线路的完整线路名称]
    """
    url = 'http://{}.gongjiao.com/lines_all.html'.format(city_phonetic)
    r = requests.get(url).text
    et = etree.HTML(r)
    line_name = et.xpath('//div[@class="list"]//a/text()')
    return line_name


def check_data_progress(file_path):
    """检查数据爬取进度，输出最后一条爬取的公交线路或站点信息（基于第一列），并返回数据的行数。

    Args:
        file_path (str): 存储数据的 .csv 或 .xlsx 文件路径
    """
    try:
        # 读取 Excel 文件
        if file_path.endswith('.xlsx'):
            df = pd.read_excel(file_path)
        # 读取 CSV 文件（没有表头）
        elif file_path.endswith('.csv'):
            df = pd.read_csv(file_path, header=None)
        else:
            print("不支持的文件格式，请提供 .csv 或 .xlsx 文件。")
            return

        # 判断数据框是否为空
        if df.empty:
            print("数据文件为空。")
            return

        # 输出第一列的最后一条数据的索引和内容
        last_index = df.index[-1]  # 获取最后一条数据的索引
        last_entry = df.iloc[-1, 0]  # 获取最后一行的第一列数据
        print(f"最后一条爬取的数据（索引 {last_index}）是：{last_entry}")

        # 获取总行数
        total_rows = df.shape[0]  # 获取数据框的行数
        print(f"数据总行数为：{total_rows}")

        return last_entry, total_rows  # 返回最后一条数据和行数
    except Exception as e:
        print(f"读取文件时出错: {e}")

def get_line_station_data(city, line_name, ak, city_phonetic):
    """[传入城市名称，线路名称，通过高德接口获取公交线路数据，保存在同目录的csv中]

    Args:
        city ([str]): [需获取城市的名称，如 长沙]
        line_name ([str]): [线路名称，前面函数所获取得到的线路名称，当然也可以自己输入]
        ak ([str]): [高德开放平台的APIKey]
        city_phonetic ([str]): [需获取城市的拼音，如changsha]
    """
    print(f'正在获取-->{line_name}')
    time.sleep(1)
    url = f'https://restapi.amap.com/v3/bus/linename?extensions=all&key={ak}&output=json&city={city}&offset=1&keywords={line_name}'
    r = requests.get(url).text
    rt = json.loads(r)
    try:
        if rt['buslines']:
            if len(rt['buslines']) == 0:
                print('no data in list..')
            else:
                dt = {}
                dt['line_name'] = rt['buslines'][0]['name']
                dt['polyline'] = rt['buslines'][0]['polyline']
                dt['total_price'] = rt['buslines'][0]['total_price']

                station_name = []
                station_coords = []
                for st in rt['buslines'][0]['busstops']:
                    station_name.append(st['name'])
                    station_coords.append(st['location'])

                dt['station_name'] = station_name
                dt['station_corrds'] = station_coords

                dm = pd.DataFrame([dt])
                # 此时使用的追加的写入
                dm.to_csv(f'{city_phonetic}_lines.csv',
                          mode='a',
                          header=False,
                          index=False,
                          encoding='utf_8_sig')
        else:
            print('data not avaliable..')
            with open('data not avaliable.log', 'a') as f:
                f.write(line_name + '\n')
    except:
        print('error.. try it again..')
        time.sleep(2)
        get_line_station_data(city, line_name, ak, city_phonetic)


if __name__ == '__main__':
    # 此处参数需更改
    city = '益阳'
    city_phonetic = 'yiyang'
    ak = '5c97181290522e9fea1ff5d32208634f'  # 这里建议更改为自己的key

    start_time = time.time()
    print(f'==========正在获取 {city} 线路名称==========')
    line_names = get_bus_line_name(city_phonetic)
    print(f'{city}在公交网上显示共有{len(line_names)}条线路')
    for line_name in tqdm(line_names):
        get_line_station_data(city, line_name, ak, city_phonetic)
    end_time = time.time()
    print(f'我爬完啦, 耗时{end_time - start_time}秒')
