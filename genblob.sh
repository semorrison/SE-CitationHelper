echo "var popupHTML = '"$(tr -d '\n' <popup.html | sed "s/'/\\\\'/g")"';"
