import mysql.connector

def get_connection():
    conexion = mysql.connector.connect(
       host="localhost",
        port=3306,
        user="root",
        password="moskitos",
        database="equipo5"
    )
    return conexion
