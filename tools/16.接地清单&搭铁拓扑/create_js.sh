#!/bin/bash
cd "C:\Users\HP\Desktop\tools\接地清单&搭铁拓扑"

echo "const TEMPLATE_FILES = {" > template_data.js
echo "    WIRELIST: {" >> template_data.js
echo "        filename: 'WIRELIST.xlsx'," >> template_data.js
echo -n "        data: '" >> template_data.js
cat wirelist_full_b64.txt >> template_data.js
echo "'" >> template_data.js
echo "    }," >> template_data.js

echo "    CONNLIST: {" >> template_data.js
echo "        filename: 'T28-Connlist_20260113.xlsx'," >> template_data.js
echo -n "        data: '" >> template_data.js
cat connlist_full_b64.txt >> template_data.js
echo "'" >> template_data.js
echo "    }," >> template_data.js

echo "    INLINE: {" >> template_data.js
echo "        filename: 'inline.xlsx'," >> template_data.js
echo -n "        data: '" >> template_data.js
cat inline_full_b64.txt >> template_data.js
echo "'" >> template_data.js
echo "    }" >> template_data.js

echo "};" >> template_data.js

echo "Created template_data.js"
wc -c template_data.js
