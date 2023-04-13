import * as htmlparser2 from 'htmlparser2';
import * as domutils from 'domutils';

export interface Env {
  SOUVENIR_DATA: KVNamespace;
}

type Souvenir = {
  name: string;
  description?: string;
  startTimestamp: number;
  startDateStr: string;
  endTimestamp?: number;
  endDateStr?: string;
}

const FILTERS: {[key: string]: (souvenir: Souvenir, date: Date) => boolean} = {
  'onlyStartingOnDate': (souvenir, date) => (date.setUTCHours(0, 0, 0, 0) === new Date(souvenir.startTimestamp).setUTCHours(0, 0, 0, 0)),
  'onlyEndingOnDate': (souvenir, date) => (souvenir.endTimestamp ? (date.setUTCHours(0, 0, 0, 0) === new Date(souvenir.endTimestamp).setUTCHours(0, 0, 0, 0)) : false),
};

export default {
  async fetchAllSouvenirs(cacheBinding: KVNamespace): Promise<Souvenir[]> {
    const allSouvenirs: Souvenir[] = [];

    const {
      value: cachedSouvenirs,
      metadata,
    } = await cacheBinding.getWithMetadata<Souvenir[]>('allSouvenirs', {type: 'json'});

    if(cachedSouvenirs && (Date.now() - (metadata as {timestamp: number}).timestamp < (1000*60*60))) {
      return cachedSouvenirs;
    }

    console.debug('no cached and up-to-date data, re-fetching...');
    const dom = htmlparser2.parseDocument(await (await fetch('https://thea-team.net/souvenirs/date-based')).text());
    const table = domutils.getElementsByTagName('table', dom)[0];
    domutils.getElementsByTagName('tr', table).forEach(tableRow => {
      const cols = domutils.getElementsByTagName('td', tableRow);

      const [souvenirName, souvenirDescription, souvenirStartDate, souvenirEndDate] = cols.map(col => domutils.innerText(col));
      const souvenir = {
        name: souvenirName,
        description: souvenirDescription,
        startDateStr: souvenirStartDate,
        startTimestamp: Date.parse(souvenirStartDate + ' GMT'),
        endDateStr: souvenirEndDate,
        endTimestamp: Date.parse(souvenirEndDate + ' GMT'),
      };

      allSouvenirs.push(souvenir);
    });

    await cacheBinding.put('allSouvenirs', JSON.stringify(allSouvenirs), {
      expirationTtl: 60*60,
      metadata: {
        timestamp: Date.now(),
      },
    });

    return allSouvenirs;
  },

  async findTimeBasedSouvenirsForDay(allSouvenirs: Souvenir[], date: Date, filter?: (souvenir: Souvenir, date: Date) => boolean): Promise<Souvenir[]> {
    const filteredSouvenirs: Souvenir[] = [];
    const dateStartTimestamp = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);

    allSouvenirs.forEach(souvenir => {
      if (dateStartTimestamp >= souvenir.startTimestamp && (!souvenir.endTimestamp || dateStartTimestamp <= souvenir.endTimestamp)) {
        if(!!filter && !filter(souvenir, date)) {
          return;
        }

        filteredSouvenirs.push(souvenir);
      }
    });

    return filteredSouvenirs;
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const requestUrl = new URL(request.url);
    const isoDate = requestUrl.searchParams.get('date');
    const timestamp = requestUrl.searchParams.get('timestamp');
    const filter = requestUrl.searchParams.get('filter');

    if(isoDate !== null && timestamp !== null) {
      return new Response(JSON.stringify({error: 'please only provide isoDate OR timestamp'}), {status: 400});
    }

    if(filter !== null && !FILTERS[filter]) {
      return new Response(JSON.stringify({error: 'unknown filter'}), {status: 400});
    }

    let dateToShowSouvenirsFor;
    if(isoDate === null && timestamp === null) {
      dateToShowSouvenirsFor = new Date();
    }

    if(isoDate !== null) {
      dateToShowSouvenirsFor = new Date(Date.parse(isoDate));
    } else if(timestamp !== null) {
      dateToShowSouvenirsFor = new Date(timestamp);
    }

    if(!dateToShowSouvenirsFor) {
      return new Response(JSON.stringify({error: 'failed parsing provided date or timestamp'}), {status: 500});
    }

    const filteredSouvenirs = await this.findTimeBasedSouvenirsForDay(await this.fetchAllSouvenirs(env.SOUVENIR_DATA), dateToShowSouvenirsFor, filter ? FILTERS[filter] : undefined);
    return new Response(JSON.stringify({souvenirs: filteredSouvenirs}), {status: 200});
  },
};
