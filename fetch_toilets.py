import requests
import json
from datetime import datetime
import os

def fetch_toilet_data(bbox=None, area_query=None, output_file=None):
    """
    Fetch toilet data from OpenStreetMap using Overpass API
    
    Args:
        bbox: Bounding box as tuple (south, west, north, east) for Oslo: (59.7, 10.6, 60.0, 11.0)
        area_query: Area query string like 'area["ISO3166-1"="NO"]' for Norway
        output_file: Output filename (default: toilets_YYYYMMDD_HHMMSS.json)
    """
    
    # Default to Oslo if no parameters provided
    if not bbox and not area_query:
        bbox = (59.7, 10.6, 60.0, 11.0)  # Oslo bounding box
        print("Using default Oslo bounding box")
    
    # Construct the Overpass query
    if bbox:
        south, west, north, east = bbox
        query = f"""
        [out:json][timeout:25];
        (
            node["amenity"="toilets"](bbox:{south},{west},{north},{east});
            way["amenity"="toilets"](bbox:{south},{west},{north},{east});
        );
        out geom;
        """
        location_name = "oslo" if bbox == (59.7, 10.6, 60.0, 11.0) else "custom_bbox"
    else:
        query = f"""
        [out:json][timeout:25];
        {area_query}->.searchArea;
        (
            node["amenity"="toilets"](area.searchArea);
            way["amenity"="toilets"](area.searchArea);
        );
        out geom;
        """
        location_name = "norway" if 'ISO3166-1"="NO"' in area_query else "custom_area"
    
    # Generate output filename if not provided
    if not output_file:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"toilets_{location_name}_{timestamp}.json"
    
    # Make the API request
    url = "https://overpass-api.de/api/interpreter"
    
    print(f"Fetching toilet data...")
    print(f"Query: {query.strip()}")
    
    try:
        response = requests.post(
            url,
            data={'data': query},
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=30
        )
        
        response.raise_for_status()  # Raises an HTTPError for bad responses
        
        # Parse JSON response
        data = response.json()
        
        # Save to file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Print summary
        elements = data.get('elements', [])
        nodes = sum(1 for el in elements if el['type'] == 'node')
        ways = sum(1 for el in elements if el['type'] == 'way')
        
        print(f"\n✅ Success!")
        print(f"📁 Saved to: {output_file}")
        print(f"📊 Found {len(elements)} toilet locations:")
        print(f"   - {nodes} point locations (nodes)")
        print(f"   - {ways} area locations (ways)")
        print(f"📏 File size: {os.path.getsize(output_file)} bytes")
        
        return output_file, data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None, None
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON response: {e}")
        return None, None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None, None

def preview_data(data, num_samples=3):
    """Preview some sample toilet data"""
    if not data or 'elements' not in data:
        print("No data to preview")
        return
    
    elements = data['elements']
    print(f"\n🔍 Preview of first {min(num_samples, len(elements))} locations:")
    
    for i, element in enumerate(elements[:num_samples]):
        print(f"\n--- Location {i+1} ---")
        print(f"Type: {element['type']}")
        print(f"ID: {element['id']}")
        
        if element['type'] == 'node':
            print(f"Coordinates: {element['lat']}, {element['lon']}")
        
        # Show tags/attributes
        tags = element.get('tags', {})
        if tags:
            print("Attributes:")
            for key, value in tags.items():
                if key != 'amenity':  # Skip the amenity=toilets tag
                    print(f"  {key}: {value}")

if __name__ == "__main__":
    # Example usage - fetch Oslo toilets
    print("🚽 OpenStreetMap Toilet Data Fetcher")
    print("=" * 40)
    
    # Fetch Oslo data
    filename, data = fetch_toilet_data()
    
    if data:
        preview_data(data)
        
        # Ask if user wants to fetch Norway data too
        print(f"\n{'='*40}")
        fetch_norway = input("Also fetch data for all of Norway? (y/n): ").lower().strip()
        
        if fetch_norway in ['y', 'yes']:
            print("\nFetching Norway data (this may take longer)...")
            norway_query = 'area["ISO3166-1"="NO"]'
            norway_file, norway_data = fetch_toilet_data(
                area_query=norway_query, 
                output_file=f"toilets_norway_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            )
            
            if norway_data:
                print(f"\nNorway data saved to: {norway_file}")
    
    print(f"\n{'='*40}")
    print("Next steps:")
    print("1. Use the JSON files to create a map visualization")
    print("2. Analyze the data for patterns")
    print("3. Build a web app or mobile app with the data")