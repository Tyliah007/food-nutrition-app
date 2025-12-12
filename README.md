This app queries the USDA FoodData Central API and can persist saved queries to a local Postgres database.
The main page provides a search box that POSTs to `/api/search` (which proxies the USDA FDC search) and a `Save Results` button to persist the returned rows to Postgres via `/api/saved`.
