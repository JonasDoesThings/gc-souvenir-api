# gc-souvenir-api
A serverless API running on cloudflare workers platform for getting information about current-ish date-based Geocaching souvenirs.  
  
Data is scraped from https://thea-team.net/souvenirs/date-based.  

## Setup
1. Copy the `wrangler.toml.example` to `wrangler.toml`
2. Run `wrangler kv:namespace create SOUVENIR_DATA`
3. Insert the outputted binding into your `wrongler.toml` `kv_namespaces` section.

## Dev
1. Run the steps described in #Setup
2. Create a development KV binding using `wrangler kv:namespace create SOUVENIR_DATA --preview`
3. Insert the outputted binding's preview_id into your existing `wrongler.toml` `kv_namespaces` binding created before.
4. Run the project locally using `yarn dev --local`  

Now you can manually trigger the worker by sending a HTTP GET Request to `http://localhost:8787/`

## License
Geocaching and Signal the Frog are trademarks of Groundspeak. This project is not supported, endorsed, or in any other relation with Groundspeak Inc. It's a fan project.

This work is licensed under the [MIT License](https://opensource.org/license/mit/).  
Full License Text: [LICENSE.md](./LICENSE.md)
