import pymysql

def get_connection():
    return pymysql.connect(
        host='192.168.56.1',
        user='root',
        password='0000',
        db='emotion_db',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
