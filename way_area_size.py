import json

def analyze_toilet_areas(json_file_path):
    """
    Analyze toilet data to find the largest area for 'way' type objects
    and identify any 'way' objects without bounds.
    """
    
    try:
        # Read the JSON file
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'elements' not in data:
            print("Error: 'elements' key not found in JSON")
            return
        
        elements = data['elements']
        print(f"Total elements: {len(elements)}")
        
        # Initialize variables
        largest_area = 0
        largest_area_object = None
        way_objects_count = 0
        way_without_bounds = []
        
        # Process each element
        for element in elements:
            if element.get('type') == 'way':
                way_objects_count += 1
                
                # Check if bounds exist
                if 'bounds' not in element:
                    way_without_bounds.append(element)
                    continue
                
                bounds = element['bounds']
                
                # Check if all required bound keys exist
                required_keys = ['minlat', 'maxlat', 'minlon', 'maxlon']
                if not all(key in bounds for key in required_keys):
                    way_without_bounds.append(element)
                    continue
                
                # Calculate area (approximate, in degrees squared)
                lat_diff = bounds['maxlat'] - bounds['minlat']
                lon_diff = bounds['maxlon'] - bounds['minlon']
                area = lat_diff * lon_diff
                
                # Update largest area if this one is bigger
                if area > largest_area:
                    largest_area = area
                    largest_area_object = element
        
        # Print results
        print(f"\nWay objects found: {way_objects_count}")
        print(f"Way objects without bounds: {len(way_without_bounds)}")
        
        if largest_area_object:
            print(f"\nLargest area found: {largest_area:.10f} square degrees")
            print(f"Largest area object ID: {largest_area_object['id']}")
            print(f"Largest area object bounds:")
            bounds = largest_area_object['bounds']
            print(f"  Min lat: {bounds['minlat']}")
            print(f"  Max lat: {bounds['maxlat']}")
            print(f"  Min lon: {bounds['minlon']}")
            print(f"  Max lon: {bounds['maxlon']}")
            print(f"  Lat difference: {bounds['maxlat'] - bounds['minlat']:.10f}")
            print(f"  Lon difference: {bounds['maxlon'] - bounds['minlon']:.10f}")
            
            # Show tags if available
            if 'tags' in largest_area_object:
                print(f"  Tags: {largest_area_object['tags']}")
        else:
            print("\nNo way objects with valid bounds found.")
        
        # Print objects without bounds
        if way_without_bounds:
            print(f"\n{'='*60}")
            print("WAY OBJECTS WITHOUT BOUNDS:")
            print(f"{'='*60}")
            for i, obj in enumerate(way_without_bounds, 1):
                print(f"\nObject {i}:")
                print(f"  ID: {obj['id']}")
                print(f"  Type: {obj['type']}")
                if 'tags' in obj:
                    print(f"  Tags: {obj['tags']}")
                if 'nodes' in obj:
                    print(f"  Nodes count: {len(obj['nodes'])}")
                if 'geometry' in obj:
                    print(f"  Geometry points: {len(obj['geometry'])}")
                # Print the entire object for debugging
                print(f"  Full object: {json.dumps(obj, indent=2)}")
        
    except FileNotFoundError:
        print(f"Error: File '{json_file_path}' not found.")
    except json.JSONDecodeError:
        print("Error: Invalid JSON format.")
    except Exception as e:
        print(f"Error: {e}")

# Run the analysis
if __name__ == "__main__":
    # Replace with your actual file path
    file_path = "toilets_norway_20250623_151225.json"
    
    print("Toilet Area Analyzer")
    print("=" * 30)
    
    analyze_toilet_areas(file_path)