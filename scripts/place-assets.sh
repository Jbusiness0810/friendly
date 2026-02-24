#!/bin/bash
# place-assets.sh
# Copies Recraft-generated assets into the Xcode asset catalog structure.
#
# Usage: ./scripts/place-assets.sh [assets_dir] [xcassets_dir]
#
# Defaults:
#   assets_dir  = ./assets
#   xcassets_dir = ./ios/Friendly.xcodeproj/Assets.xcassets

set -euo pipefail

ASSETS_DIR="${1:-./assets}"
XCASSETS_DIR="${2:-./ios/Friendly.xcodeproj/Assets.xcassets}"

if [ ! -d "$ASSETS_DIR" ]; then
    echo "Error: Assets directory not found: $ASSETS_DIR"
    exit 1
fi

echo "Placing assets from $ASSETS_DIR into $XCASSETS_DIR"

# Create xcassets directory if it doesn't exist
mkdir -p "$XCASSETS_DIR"

# Function to create an imageset from a source PNG
create_imageset() {
    local src="$1"
    local name="$2"
    local dest_dir="$XCASSETS_DIR/$name.imageset"

    mkdir -p "$dest_dir"

    # Copy the image
    cp "$src" "$dest_dir/$name.png"

    # Create Contents.json
    cat > "$dest_dir/Contents.json" <<EOF
{
  "images" : [
    {
      "filename" : "$name.png",
      "idiom" : "universal",
      "scale" : "1x"
    },
    {
      "idiom" : "universal",
      "scale" : "2x"
    },
    {
      "idiom" : "universal",
      "scale" : "3x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

    echo "  Created imageset: $name"
}

# Process each asset directory
for category_dir in "$ASSETS_DIR"/*/; do
    category=$(basename "$category_dir")

    # Skip non-directories and manifest
    [ ! -d "$category_dir" ] && continue
    [ "$category" = "ASSET_MANIFEST.md" ] && continue

    echo "Processing: $category/"

    for asset in "$category_dir"*.png; do
        [ ! -f "$asset" ] && continue
        name=$(basename "$asset" .png)
        create_imageset "$asset" "$name"
    done
done

# Create root Contents.json
cat > "$XCASSETS_DIR/Contents.json" <<EOF
{
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

echo ""
echo "Done! Assets placed in $XCASSETS_DIR"
echo "Open Xcode to verify the asset catalog."
