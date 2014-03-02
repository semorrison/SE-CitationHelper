echo "var blob=new Blob(['"$(tr -d '\n' <popup.html | sed "s/'/\\\\'/g")"']);"
