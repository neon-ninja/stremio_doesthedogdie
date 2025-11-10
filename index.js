const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

require('dotenv').config();
const API_KEY = process.env.API_KEY;
const BASE_URL = "https://www.doesthedogdie.com";

const manifest = {
  id: "org.stremio.doesTheDogDie",
  version: "1.0.1",
  name: "DoesTheDogDie (Jump Scares)",
  description: "Adds jump scare information from DoesTheDogDie.com, with link to full page. Open source at <a href='https://github.com/neon-ninja/stremio_doesthedogdie'>https://github.com/neon-ninja/stremio_doesthedogdie</a>",
  resources: ["stream"],
  types: ["movie", "series"],
  idPrefixes: ["tt"], // IMDb IDs
  catalogs: [] 
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  id = id.split(":")[0]
  const url = `${BASE_URL}/dddsearch?imdb=${id}`;
  let res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "X-API-KEY": API_KEY
    }
  });
  let data = await res.json();
  if (!data.items.length) {
    throw new Error(`DDD doesn't know ${id}`);
  }
  const dddId = data.items[0].id
  res = await fetch(`${BASE_URL}/media/${dddId}`, {
    headers: {
      "Accept": "application/json",
      "X-API-KEY": API_KEY
    }
  });
  data = await res.json();

  // Find jump scare topic
  const jumpScares = data.topicItemStats?.find(
    (topic) => topic.topic?.name?.toLowerCase().indexOf("jump scares") !== -1
  );

  let jumpScareInfo = "No jump scare data available";
  if (jumpScares) {
    jumpScareInfo = `${jumpScares.yesSum} yes ${jumpScares.noSum} no\n${jumpScares.comment}`;
  }

  return {
    streams: [{
      name: "DoesTheDogDie jump scare info",
      description: jumpScareInfo,
      externalUrl: `https://www.doesthedogdie.com/media/${dddId}`
    }],
  };
});

serveHTTP(builder.getInterface(), { port: process.env.PORT || 7032 })
