echo "📁 All Student Pages (with nested routes):"
echo "=========================================="
echo ""

find src/app/\(student\) -name "page.tsx" -type f | sort | while read file; do
  size=$(wc -c < "$file")
  # Check if file is a placeholder
  if [ "$size" -lt 200 ] || grep -q "Coming Soon\|under development\|placeholder" "$file" 2>/dev/null; then
    status="⚠️  PLACEHOLDER"
  else
    status="✅ IMPLEMENTED"
  fi
  
  # Extract URL path
  url=$(echo "$file" | sed 's|src/app/(student)/student/||' | sed 's|/page.tsx||' | sed 's|\[|:|g' | sed 's|\]||g')
  if [ "$url" = "" ]; then
    url="/student"
  else
    url="/student/$url"
  fi
  
  printf "  %-16s | %4sB | %s\n" "$status" "$size" "$url"
done

echo ""
echo "=========================================="

# Count placeholders
placeholder_count=$(find src/app/\(student\) -name "page.tsx" -type f | while read f; do
  size=$(wc -c < "$f")
  [ "$size" -lt 200 ] && echo "$f"
done | wc -l)

echo "Placeholder pages: $placeholder_count"

echo ""
echo "📋 Pages needing implementation:"
find src/app/\(student\) -name "page.tsx" -type f | sort | while read file; do
  size=$(wc -c < "$file")
  if [ "$size" -lt 200 ] || grep -q "Coming Soon\|under development\|placeholder" "$file" 2>/dev/null; then
    url=$(echo "$file" | sed 's|src/app/(student)/student/||' | sed 's|/page.tsx||' | sed 's|\[|:|g' | sed 's|\]||g')
    echo "  ❌ $url ($size bytes)"
  fi
done