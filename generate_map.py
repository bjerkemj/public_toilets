import json
import os
from datetime import datetime

def generate_toilet_map(json_file_path, output_file=None):
    """
    Generate an HTML map from toilet JSON data
    
    Args:
        json_file_path: Path to the JSON file with toilet data
        output_file: Output HTML filename (optional, will auto-generate if not provided)
    """
    
    # Check if JSON file exists
    if not os.path.exists(json_file_path):
        print(f"❌ Error: File '{json_file_path}' not found!")
        return None
    
    # Read the JSON data
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            toilet_data = json.load(f)
        print(f"✅ Successfully loaded data from {json_file_path}")
    except json.JSONDecodeError as e:
        print(f"❌ Error reading JSON file: {e}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None
    
    # Generate output filename if not provided
    if not output_file:
        base_name = os.path.splitext(os.path.basename(json_file_path))[0]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"{base_name}_map_{timestamp}.html"
    
    # Get stats from the data
    elements = toilet_data.get('elements', [])
    total_toilets = len(elements)
    
    # Filter only Oslo area toilets (roughly)
    oslo_toilets = [
        toilet for toilet in elements 
        if toilet.get('type') == 'node' and 
        59.7 <= toilet.get('lat', 0) <= 60.0 and 
        10.6 <= toilet.get('lon', 0) <= 11.0
    ]
    
    print(f"📊 Found {total_toilets} total toilets, {len(oslo_toilets)} in Oslo area")
    
    # Get data timestamp from JSON
    data_timestamp = toilet_data.get('osm3s', {}).get('timestamp_osm_base', 'Unknown')
    if data_timestamp != 'Unknown':
        # Convert to readable format
        try:
            dt = datetime.fromisoformat(data_timestamp.replace('Z', '+00:00'))
            data_timestamp = dt.strftime('%Y-%m-%d %H:%M UTC')
        except:
            pass
    
    # Create the complete HTML content
    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oslo Public Toilets Map</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        
        .header h1 {{
            margin: 0;
            font-size: 1.8rem;
        }}
        
        .header p {{
            margin: 0.5rem 0 0 0;
            opacity: 0.9;
        }}
        
        .container {{
            display: flex;
            height: calc(100vh - 120px);
        }}
        
        .sidebar {{
            width: 300px;
            background: white;
            border-right: 1px solid #ddd;
            overflow-y: auto;
            box-shadow: 2px 0 5px rgba(0,0,0,0.1);
        }}
        
        .sidebar-header {{
            padding: 1rem;
            background: #f8f9fa;
            border-bottom: 1px solid #ddd;
            position: sticky;
            top: 0;
            z-index: 100;
        }}
        
        .stats {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }}
        
        .stat-card {{
            background: #e3f2fd;
            padding: 0.5rem;
            border-radius: 8px;
            text-align: center;
        }}
        
        .stat-number {{
            font-size: 1.5rem;
            font-weight: bold;
            color: #1976d2;
        }}
        
        .stat-label {{
            font-size: 0.8rem;
            color: #555;
        }}
        
        .filters {{
            margin-bottom: 1rem;
        }}
        
        .filter-group {{
            margin-bottom: 0.5rem;
        }}
        
        .filter-group label {{
            display: block;
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
            color: #333;
        }}
        
        .filter-group select {{
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.9rem;
        }}
        
        .toilet-list {{
            padding: 0 1rem 1rem 1rem;
        }}
        
        .toilet-item {{
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }}
        
        .toilet-item:hover {{
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-color: #667eea;
        }}
        
        .toilet-item.selected {{
            border-color: #667eea;
            background: #f8f9ff;
        }}
        
        .toilet-id {{
            font-size: 0.8rem;
            color: #666;
            margin-bottom: 0.25rem;
        }}
        
        .toilet-features {{
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            margin-top: 0.5rem;
        }}
        
        .feature-tag {{
            background: #e8f5e8;
            color: #2e7d32;
            padding: 0.1rem 0.3rem;
            border-radius: 12px;
            font-size: 0.7rem;
        }}
        
        .feature-tag.fee {{
            background: #ffebee;
            color: #c62828;
        }}
        
        .feature-tag.wheelchair {{
            background: #e3f2fd;
            color: #1976d2;
        }}
        
        #map {{
            flex: 1;
            height: 100%;
        }}
        
        .leaflet-popup-content {{
            max-width: 250px;
        }}
        
        .popup-header {{
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #333;
        }}
        
        .popup-feature {{
            display: flex;
            justify-content: space-between;
            margin: 0.25rem 0;
            font-size: 0.9rem;
        }}
        
        .popup-feature strong {{
            color: #555;
        }}
        
        .data-info {{
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 0.5rem;
            margin-bottom: 1rem;
            font-size: 0.8rem;
        }}
        
        @media (max-width: 768px) {{
            .container {{
                flex-direction: column;
            }}
            
            .sidebar {{
                width: 100%;
                height: 200px;
            }}
            
            #map {{
                height: calc(100vh - 320px);
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🚽 Oslo Public Toilets</h1>
        <p>Interactive map of public toilet facilities in Oslo</p>
    </div>
    
    <div class="container">
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="data-info">
                    📅 Data from: {data_timestamp}<br>
                    📁 Source: {os.path.basename(json_file_path)}
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number" id="totalCount">0</div>
                        <div class="stat-label">Total Toilets</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="wheelchairCount">0</div>
                        <div class="stat-label">Wheelchair Accessible</div>
                    </div>
                </div>
                
                <div class="filters">
                    <div class="filter-group">
                        <label for="wheelchairFilter">Wheelchair Access:</label>
                        <select id="wheelchairFilter">
                            <option value="all">All toilets</option>
                            <option value="yes">Wheelchair accessible</option>
                            <option value="no">Not wheelchair accessible</option>
                            <option value="limited">Limited access</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="feeFilter">Fee:</label>
                        <select id="feeFilter">
                            <option value="all">All toilets</option>
                            <option value="free">Free</option>
                            <option value="paid">Requires payment</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="accessFilter">Access:</label>
                        <select id="accessFilter">
                            <option value="all">All access types</option>
                            <option value="yes">Public access</option>
                            <option value="customers">Customers only</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="toilet-list" id="toiletList">
                <!-- Toilet items will be populated here -->
            </div>
        </div>
        
        <div id="map"></div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
    <script>
        // Toilet data from JSON file
        const toiletData = {json.dumps(toilet_data, ensure_ascii=False)};

        // Initialize map
        const map = L.map('map').setView([59.9139, 10.7522], 12);
        
        // Add tile layer
        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
            attribution: '© OpenStreetMap contributors'
        }}).addTo(map);

        // Store markers and data
        let markers = [];
        let filteredToilets = [];
        let selectedToiletId = null;

        // Create custom icons
        const toiletIcon = L.divIcon({{
            html: '🚽',
            iconSize: [20, 20],
            className: 'toilet-marker'
        }});

        const wheelchairToiletIcon = L.divIcon({{
            html: '♿',
            iconSize: [20, 20],
            className: 'toilet-marker wheelchair'
        }});

        const feeToiletIcon = L.divIcon({{
            html: '💰',
            iconSize: [20, 20],
            className: 'toilet-marker fee'
        }});

        // Function to get appropriate icon
        function getToiletIcon(toilet) {{
            const tags = toilet.tags;
            if (tags.wheelchair === 'yes') return wheelchairToiletIcon;
            if (tags.fee === 'yes') return feeToiletIcon;
            return toiletIcon;
        }}

        // Function to create popup content
        function createPopupContent(toilet) {{
            const tags = toilet.tags;
            let content = `<div class="popup-header">Toilet #${{toilet.id}}</div>`;
            
            // Add features
            if (tags.wheelchair) {{
                content += `<div class="popup-feature"><strong>Wheelchair:</strong> ${{tags.wheelchair}}</div>`;
            }}
            if (tags.fee !== undefined) {{
                const feeText = tags.fee === 'yes' ? 'Paid' : 'Free';
                content += `<div class="popup-feature"><strong>Fee:</strong> ${{feeText}}</div>`;
            }}
            if (tags.access) {{
                content += `<div class="popup-feature"><strong>Access:</strong> ${{tags.access}}</div>`;
            }}
            if (tags.opening_hours) {{
                content += `<div class="popup-feature"><strong>Hours:</strong> ${{tags.opening_hours}}</div>`;
            }}
            if (tags['toilets:disposal']) {{
                content += `<div class="popup-feature"><strong>Type:</strong> ${{tags['toilets:disposal']}}</div>`;
            }}
            if (tags.changing_table) {{
                content += `<div class="popup-feature"><strong>Changing table:</strong> ${{tags.changing_table}}</div>`;
            }}
            if (tags.unisex) {{
                content += `<div class="popup-feature"><strong>Unisex:</strong> ${{tags.unisex}}</div>`;
            }}
            
            content += `<div class="popup-feature"><strong>Coordinates:</strong> ${{toilet.lat.toFixed(4)}}, ${{toilet.lon.toFixed(4)}}</div>`;
            
            return content;
        }}

        // Function to create sidebar item
        function createSidebarItem(toilet) {{
            const tags = toilet.tags;
            const item = document.createElement('div');
            item.className = 'toilet-item';
            item.dataset.toiletId = toilet.id;
            
            let features = [];
            if (tags.wheelchair === 'yes') features.push('<span class="feature-tag wheelchair">♿ Wheelchair</span>');
            if (tags.wheelchair === 'limited') features.push('<span class="feature-tag wheelchair">♿ Limited</span>');
            if (tags.fee === 'no') features.push('<span class="feature-tag">Free</span>');
            if (tags.fee === 'yes') features.push('<span class="feature-tag fee">Paid</span>');
            if (tags.changing_table === 'yes') features.push('<span class="feature-tag">Baby change</span>');
            if (tags.access === 'customers') features.push('<span class="feature-tag">Customers</span>');
            if (tags.unisex === 'yes') features.push('<span class="feature-tag">Unisex</span>');
            
            item.innerHTML = `
                <div class="toilet-id">ID: ${{toilet.id}}</div>
                <div>📍 ${{toilet.lat.toFixed(4)}}, ${{toilet.lon.toFixed(4)}}</div>
                <div class="toilet-features">${{features.join('')}}</div>
            `;
            
            item.addEventListener('click', () => {{
                selectToilet(toilet.id);
                map.setView([toilet.lat, toilet.lon], 16);
            }});
            
            return item;
        }}

        // Function to select a toilet
        function selectToilet(toiletId) {{
            // Remove previous selection
            document.querySelectorAll('.toilet-item').forEach(item => {{
                item.classList.remove('selected');
            }});
            
            // Add selection to new item
            const selectedItem = document.querySelector(`[data-toilet-id="${{toiletId}}"]`);
            if (selectedItem) {{
                selectedItem.classList.add('selected');
            }}
            
            selectedToiletId = toiletId;
        }}

        // Function to filter toilets
        function filterToilets() {{
            const wheelchairFilter = document.getElementById('wheelchairFilter').value;
            const feeFilter = document.getElementById('feeFilter').value;
            const accessFilter = document.getElementById('accessFilter').value;
            
            filteredToilets = toiletData.elements.filter(toilet => {{
                // Wheelchair filter
                if (wheelchairFilter === 'yes' && toilet.tags.wheelchair !== 'yes') return false;
                if (wheelchairFilter === 'no' && toilet.tags.wheelchair === 'yes') return false;
                if (wheelchairFilter === 'limited' && toilet.tags.wheelchair !== 'limited') return false;
                
                // Fee filter
                if (feeFilter === 'free' && toilet.tags.fee === 'yes') return false;
                if (feeFilter === 'paid' && toilet.tags.fee !== 'yes') return false;
                
                // Access filter
                if (accessFilter !== 'all' && toilet.tags.access !== accessFilter) return false;
                
                return true;
            }});
            
            updateMap();
            updateSidebar();
            updateStats();
        }}

        // Function to update map markers
        function updateMap() {{
            // Clear existing markers
            markers.forEach(marker => map.removeLayer(marker));
            markers = [];
            
            // Add filtered markers
            filteredToilets.forEach(toilet => {{
                const marker = L.marker([toilet.lat, toilet.lon], {{
                    icon: getToiletIcon(toilet)
                }}).addTo(map);
                
                marker.bindPopup(createPopupContent(toilet));
                marker.on('click', () => selectToilet(toilet.id));
                
                markers.push(marker);
            }});
        }}

        // Function to update sidebar
        function updateSidebar() {{
            const toiletList = document.getElementById('toiletList');
            toiletList.innerHTML = '';
            
            filteredToilets.forEach(toilet => {{
                toiletList.appendChild(createSidebarItem(toilet));
            }});
        }}

        // Function to update statistics
        function updateStats() {{
            const totalCount = filteredToilets.length;
            const wheelchairCount = filteredToilets.filter(t => t.tags.wheelchair === 'yes').length;
            
            document.getElementById('totalCount').textContent = totalCount;
            document.getElementById('wheelchairCount').textContent = wheelchairCount;
        }}

        // Add event listeners for filters
        document.getElementById('wheelchairFilter').addEventListener('change', filterToilets);
        document.getElementById('feeFilter').addEventListener('change', filterToilets);
        document.getElementById('accessFilter').addEventListener('change', filterToilets);

        // Initialize the map
        filteredToilets = toiletData.elements;
        updateMap();
        updateSidebar();
        updateStats();

        // Fit map to show all toilets
        if (filteredToilets.length > 0) {{
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }}
    </script>
</body>
</html>'''
    
    # Write HTML file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"🗺️  Map generated successfully: {output_file}")
        print(f"📱 Open {output_file} in your browser to view the map")
        return output_file
    except Exception as e:
        print(f"❌ Error writing HTML file: {e}")
        return None

def find_json_files():
    """Find JSON files in current directory that might contain toilet data"""
    json_files = []
    for file in os.listdir('.'):
        if file.endswith('.json'):
            try:
                with open(file, 'r') as f:
                    data = json.load(f)
                    # Check if it looks like toilet data
                    if ('elements' in data and 
                        isinstance(data['elements'], list) and 
                        len(data['elements']) > 0 and
                        any('amenity' in elem.get('tags', {}) for elem in data['elements'][:5])):
                        json_files.append(file)
            except:
                continue
    return json_files

if __name__ == "__main__":
    print("🚽 Toilet Map Generator")
    print("=" * 40)
    
    # Look for JSON files
    json_files = find_json_files()
    
    if not json_files:
        print("❌ No toilet JSON files found in current directory.")
        print("Please make sure you have run the fetch_toilets.py script first.")
        json_file = input("Enter path to JSON file (or press Enter to exit): ").strip()
        if not json_file:
            exit()
    elif len(json_files) == 1:
        json_file = json_files[0]
        print(f"📁 Found toilet data file: {json_file}")
    else:
        print("📁 Found multiple JSON files:")
        for i, file in enumerate(json_files, 1):
            print(f"   {i}. {file}")
        
        try:
            choice = int(input("Select file number: ")) - 1
            json_file = json_files[choice]
        except:
            print("❌ Invalid selection")
            exit()
    
    # Generate the map
    output_file = generate_toilet_map(json_file)
    
    if output_file:
        print(f"\n🎉 Success! Your toilet map is ready!")
        print(f"🌐 File: {output_file}")
        print("💡 Tips:")
        print("   - Click markers to see toilet details")
        print("   - Use filters in the sidebar")
        print("   - Click items in the list to zoom to location")
        
        # Ask if user wants to open the file
        try:
            import webbrowser
            open_browser = input("\nOpen in browser now? (y/n): ").lower().strip()
            if open_browser in ['y', 'yes']:
                webbrowser.open(f'file://{os.path.abspath(output_file)}')
        except:
            pass