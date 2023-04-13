# gc-souvenir-api
A serverless API running on cloudflare workers platform for getting information about current-ish date-based Geocaching souvenirs.  
  
Data is scraped from https://thea-team.net/souvenirs/date-based.  

### Dev
Run the project locally using `yarn dev --local`  
Now you can manually trigger the worker by sending a HTTP GET Request to `http://localhost:8787/`

## License
Geocaching and Signal the Frog are trademarks of Groundspeak. This project is not supported, endorsed, or in any other relation with Groundspeak Inc. It's a fan project.

This work is licensed under the [MIT License](https://opensource.org/license/mit/).  
Full License Text: [LICENSE.md](./LICENSE.md)
