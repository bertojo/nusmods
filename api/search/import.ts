import { Client } from '@elastic/elasticsearch';
import { flatMap } from 'lodash';

// Be sure to download this file.
// `wget https://api.nusmods.com/v2/2018-2019/moduleInformation.json`
import data from './moduleInformation.json';

// Source: https://github.com/lodash/lodash/issues/2339#issuecomment-319536784
const intersperse = <T>(arr: Array<T>, inter: T) => flatMap(arr, (a) => [inter, a]);

const client = new Client({ node: 'http://localhost:9200' });

const bulkBody = intersperse(data, { index: {} });

async function setup() {
  try {
    await client.indices.delete({
      index: 'modules',
    });
  } catch (e) {
    // ignore deletion failure
  }

  await client.indices.create({
    index: 'modules',
    body: {
      mappings: {
        properties: {
          workload: { type: 'text' },
        },
      },
    },
  });

  client.bulk(
    {
      index: 'modules',
      body: bulkBody,
    },
    (err, res) => {
      const { items } = res.body;
      const erroredItems = items.filter((i: any) => i.index.status != 201);
      console.log(`${erroredItems.length} insertion errors of ${res.body.items.length} items.`);
      for (let item of erroredItems) {
        console.log('ERROR importing item', item.index.error);
      }
    },
  );
}

setup();