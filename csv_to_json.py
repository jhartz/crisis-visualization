
import csv
import os.path
from datetime import date, datetime
import json
import sys

# pip install 'requests'
import requests
# pip install 'geopy'
import geopy.geocoders

# Get the secrets from the secrets file
SECRETS = open('secrets.txt', 'r').read().splitlines()
GEO_USERNAME = SECRETS[0]
GOOGLE_API_KEY = SECRETS[1]

GEO_URL = 'http://api.geonames.org/postalCodeLookupJSON'
GEO_CACHE_FILE = 'geo_cache.json'

class SocialToJson:
    def __init__(self):
        self.geolocator = geopy.geocoders.GoogleV3(api_key=GOOGLE_API_KEY)

    def process_file(self, filename):
        # Load the Geo-coordinate cache from the file
        if os.path.exists(GEO_CACHE_FILE):
            self.geo_cache = json.loads(open(GEO_CACHE_FILE, 'r').read())
        else:
            self.geo_cache = {}

        # The actual processing code
        yeah = [] # Output list is now named yeah
        csv_lines = open(filename, 'r', encoding='utf-8').read().splitlines()
        socialreader = csv.reader(csv_lines, delimiter=',', quotechar='"')
        for row in socialreader:
            date = row[1]
            # Name in it's native language
            orig_name = row[2]
            # English translation of the name
            en_name = row[3]
            # (hopefully) English description of the organization
            description = row[4]
            # What languages does this org use?
            langs = row[5]
            # Country it's based in
            country = row[6]
            # Specific location
            location = row[7]
            # What media type does this org use? Facebook, Website, Twitter?
            media = (row[8] or "unknown").lower()
            link = row[9] or ""
            members = row[10] or ""
            try:
                # Remove spaces and commas
                members = members.replace(' ', '').replace(',', '')
                members = int(members)
            except ValueError:
                pass

            # Normalize status
            status = (row[11] or "unknown").lower()
            status = self.parse_status(status)

            # Normalize langs
            lang_list = [x.strip() for x in langs.split(',/')]

            # Normalize media
            if 'fb' in media or 'facebook' in media:
                media = 'facebook'
            elif 'twitter' in media:
                media = 'twitter'
            elif 'web' in media:
                media = 'website'
            # Otherwise leave it alone

            # First try a more specific location
            lat_lng = self.get_latlng(location)
            # If that fails fall back to the country
            if lat_lng is None:
                lat_lng = self.get_latlng(country)
            # If that fails then oh well

            data = {
                'date': str(date),
                'name': orig_name,
                'en_name': en_name,
                'description': description,
                'lang': lang_list,
                'country': country,
                'coverage': location,
                'media': media,
                'url': link,
                'members': members,
                'status': status,
                'location': lat_lng,
            }
            yeah.append(data)

        # Store current geo_cache back to file
        with open(GEO_CACHE_FILE,'w') as fido:
            fido.write(json.dumps(self.geo_cache, indent=2, sort_keys=True))
        return yeah


    def get_latlng(self, placename, country=None):
        placename = placename.strip()
        if placename == '':
            return None
        # First check the cache    
        if placename in self.geo_cache:
            coords = self.geo_cache[placename]
            if coords is None:
                return None
            else:
                return coords['location']
        else:
            try:
                print('Geo-locating', placename)
            except UnicodeEncodeError:
                # safe_text = str(bytearray(placename), encoding='ascii')
                # print('Geo-locating', safe_text)
                print('Failed to print placename')
            try:
                location = self.geolocator.geocode(placename)
            except:
                location = None
            if location is None:
                geodata = self.get_geonames(placename)
            else:
                geodata = {
                    'name': location.address,
                    'location': {
                        'lat': location.latitude,
                        'lng': location.longitude
                    }
                }
            if geodata is not None:
                self.geo_cache[placename] = geodata
                return geodata['location']
            else:
                print('Unable to geolocate', placename)
                return None
        
    def get_geonames(self, placename):
        # If it wasn't in the cache then get from the server
        params = {'placename': placename, 'maxRows': 1, 'username': GEO_USERNAME}
        r = requests.get(GEO_URL, params=params)
        postalData = json.loads(r.text) 
        dataList = postalData.get('postalcodes') or []
        if len(dataList) > 0:
            # Add the data to the geo cache
            postal = dataList[0]
            coords = {'lat': postal['lat'], 'lng': postal['lng']}
            return {'name': postal['placeName'], 'location': coords}
        else:
            return None

    def parse_status(self, text):
        date_format_list = [
            '%b %d %Y',
            '%b %d, %Y',
            '%d.%m.%Y',
            '%d %b %Y',
        ]
        if text is 'active' or text is 'not active' or text is 'closed group':
            return text
        valid_date = None
        for fmt in date_format_list:
            try:
                valid_date = datetime.strptime(text, fmt)
                break
            except ValueError:
                pass
        if valid_date:
            return str(valid_date)
        # Well we have no idea so just return the string
        return text


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("usage: python csv_to_json.py <in-file> <out-file>")
        exit()

    stj = SocialToJson()
    result = stj.process_file(sys.argv[1])
    with open(sys.argv[2], 'w') as fido:
        fido.write(json.dumps(result))    
