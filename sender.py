import requests
import json
url = 'http://localhost:5000/update'
import plotly.graph_objects as go

# Sample data
x_data = [1, 2, 3, 4, 5]
y_data = [10, 11, 12, 13, 14]

# Create a trace
trace = go.Scatter(x=x_data, y=y_data, mode='markers+lines', name='Sample Data')

# Create layout
layout = go.Layout(title='1Sample Plot', xaxis=dict(title='X-axis'), yaxis=dict(title='Y-axis'))

# Create figure
fig = go.Figure(data=[trace], layout=layout)

# Show plot

data = {"data": fig.to_json(), "command": "setActivePlot"}
response = requests.post(url, json=data)
if response.status_code == 200:
    print ("Data sent successfully")
else:
    print("Failed to send data")

##

data = {"data":"gruvbox_light", "command": "setColorscheme"}
response = requests.post(url, json=data)
if response.status_code == 200:
    print ("Data sent successfully")
else:
    print("Failed to send data")

##
import cv2
import numpy as np
import plotly.graph_objs as go
from plotly.subplots import make_subplots

# Step 1: Create an image with OpenCV
image = np.zeros((1000, 1000, 3), dtype=np.uint8)
cv2.rectangle(image, (50, 50), (250, 250), (255, 0, 0), 2)  # Draw a blue rectangle

# Step 2: Convert image for Plotly (OpenCV uses BGR, Plotly uses RGB)
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# Step 3: Display image using Plotly
fig = make_subplots(rows=1, cols=1)
fig.add_trace(go.Image(z=image_rgb), row=1, col=1)

counter = 1
##
fig.update_layout(title=f'{counter} OpenCV Image Displayed with Plotly')
counter += 1

data = {"data": fig.to_json(), "command": "setActivePlot"}
response = requests.post(url, json=data)
if response.status_code == 200:
    print ("Data sent successfully")
else:
    print("Failed to send data")

cv2.imshow("image", image)
cv2.waitKey(0)
cv2.destroyAllWindows()
