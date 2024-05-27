import requests
import json
url = 'http://localhost:5000/update'
data = ["slogan my bye"]
response = requests.post(url, json=data)
if response.status_code == 200:
    print ("Data sent successfully")
else:
    print("Failed to send data")

