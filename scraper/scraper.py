import requests
import time
import random
import json

response = requests.get("https://oursggrants.gov.sg/api/v1/grant_metadata/explore_grants")
grantsData = response.json()
grants = grantsData["grant_metadata"]


for grant in grants:
    if grant["status"] == "green":
        time.sleep(random.uniform(0.5, 2))
        grant["grants_details"] = requests.get("https://oursggrants.gov.sg/api/v1/grant_instruction/" + grant["value"] + "/?page_type=instruction&user_type=").json()
        print("Retrieved grant details:" + grant["name"])
    
# Output to json
with open("grants.json", "w") as f:
    json.dump(grants, f, indent=4)