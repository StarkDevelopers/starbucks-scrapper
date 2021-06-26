import * as fs from 'fs';

import * as request from 'superagent';
import cheerio from 'cheerio';

import { zipCodes } from './zipCodes';
import { Payload } from './payload';

const stores = {};

(async () => {
  try {
    for (const zipCode of zipCodes) {
      console.log(`Looking for stores in ZipCode: ${zipCode}`);

      const response = await request.get(`https://www.starbucks.com/store-locator?place=${zipCode}`);
      const $ = cheerio.load(response.text);

      $('script').each((_, element) => {
        // Loop through each Script tag to check if it contains data
        const elementHtml = $(element).html();
        const isDataScript = elementHtml.includes('window.__BOOTSTRAP');

        if (isDataScript) {
          parseStores(elementHtml, zipCode);
        }
      });
    }

    console.log(`Total ${Object.keys(stores).length} Stores found`);

    if (!fs.existsSync('./stores')) {
      fs.mkdirSync('./stores');
    }

    fs.writeFileSync(`./stores/store_${new Date().getTime()}.json`, JSON.stringify(stores, null, 2));
  } catch (error) {
    console.error(error);
  }
})();

const parseStores = (elementHtml: string, zipCode: string) => {
  try {
    // Replace unnecessary data
    let data = elementHtml.replace('window.__BOOTSTRAP =', '').trim();
    data = data.replace(/window.__INTL_MESSAGES.*/, '').trim();
    data = data.replace(/window.__INTL_FORMATS.*/, '').trim();

    // Parse stores data
    const payload: Payload = JSON.parse(data);
    const storesData = payload.previousAction.payload.data.stores;

    console.log(`${storesData.length} stores found in ZipCode: ${zipCode}`);

    storesData.forEach(store => {
      if (stores.hasOwnProperty(store.id)) {
        return;
      }

      stores[store.id] = {
        id: store.id,
        name: store.name,
        city: store.address.city,
        zipCode: store.address.postalCode,
      };
    });
  } catch (error) {
    console.error(`Error while parsing stores for ZipCode ${zipCode}: ${error.message}`);
  }
};
