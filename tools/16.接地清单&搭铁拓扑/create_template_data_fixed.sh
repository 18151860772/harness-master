#!/bin/bash
cd "C:\Users\HP\Desktop\tools\接地清单&搭铁拓扑"

echo "const TEMPLATE_FILES = {" > template_data.js

# WIRELIST
echo -n "    WIRELIST: {" >> template_data.js
echo -n "        filename: 'WIRELIST.xlsx'," >> template_data.js
echo -n "        data: '" >> template_data.js
tr -d '\n\r' < wirelist_full_b64.txt >> template_data.js
echo "'" >> template_data.js
echo "    }," >> template_data.js

# CONNLIST
echo -n "    CONNLIST: {" >> template_data.js
echo -n "        filename: 'T28-Connlist_20260113.xlsx'," >> template_data.js
echo -n "        data: '" >> template_data.js
tr -d '\n\r' < connlist_full_b64.txt >> template_data.js
echo "'" >> template_data.js
echo "    }," >> template_data.js

# INLINE
echo -n "    INLINE: {" >> template_data.js
echo -n "        filename: 'inline.xlsx'," >> template_data.js
echo -n "        data: '" >> template_data.js
tr -d '\n\r' < inline_full_b64.txt >> template_data.js
echo "'" >> template_data.js
echo "    }" >> template_data.js

echo "};" >> template_data.js

echo "Created template_data.js"
wc -c template_data.js
