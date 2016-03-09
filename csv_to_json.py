
import csv
import os.path
from datetime import date, datetime
import json
import sys

import requests

# geonames username
GEO_USERNAME = 'demo'
GEO_URL = 'http://api.geonames.org/postalCodeLookupJSON'
GEO_CACHE_FILE = 'geo_cache.json'
GEO_CACHE = {}


class SocialToJson:
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
            # What countries does it serve
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

            # Get the lat and lng of the location
            lat_lng = self.get_latlng(country)

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
            fido.write(json.dumps(self.geo_cache))
        return yeah


    def get_latlng(self,placename):
        # First check the cache
        coords = self.geo_cache.get(placename)
        if coords is not None:
            return coords
        params = {'placename': placename, 'maxRows': 1, 'username': GEO_USERNAME}
        r = requests.get(GEO_URL, params=params)
        postalData = json.loads(r.text)
        dataList = postalData.get('postalcodes') or []
        if len(dataList) > 0:
            postal = dataList[0]
            coords = {'lat': postal.get('lat'), 'lng': postal.get('lng')}
            self.geo_cache[placename] = coords
            return coords
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