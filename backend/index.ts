/* eslint-disable no-underscore-dangle */
import fs from "fs";
import _ from "lodash";
import path from "path";
import { getKnex, parseCsv, post, uuid } from "./lib";

const loadConf = () => {
  const conf = JSON.parse(fs.readFileSync("./conf.json", "utf-8"));
  return conf;
};

const conf = loadConf();

const API_BASE_URL = `https://api.archivenode.io/${conf.apikey}`;

// blocks from dec 31 of each year
const _2018 = [2018, 6982693];
const _2019 = [2019, 9188278];
const _2020 = [2020, 11558516];
const _2021 = [2021, 13909787];

const years = [_2018, _2019, _2020, _2021];

const getAccountInfoAtBlock = async (account: string, block: number) => {
  console.log({ account, block });
  const accountBalalance = await post(`${API_BASE_URL()}`, {
    jsonrpc: "2.0",
    method: "eth_getBalance",
    params: [account, block],
    id: 1,
  });

  console.log({ accountBalalance });

  return Number(accountBalalance.result);
};

export const insertBalanceRow = async (accountInfo: any) => {
  const knex = await getKnex("tron");
  await knex("balance").insert({
    id: uuid(),
    date: accountInfo.date,
    account: accountInfo.account,
    block: accountInfo.block,
    balance: accountInfo.balance,
    created_at: new Date(),
  });
};

// const getNextBalance = async () => {
//   const knex = await getKnex("tron");

//   const [previousRecord] = await knex("balance")
//     .orderBy("date", "desc")
//     .limit(1);

//   if (previousRecord.date + 1000 * 60 * 60 * 24 > Date.now()) {
//     logger.info("balance records up to date");
//     await wait(1000 * 60);
//   }
//   const nextLedger = previousRecord.block + oneDayInLedgers;
//   const accountInfo = await getAccountInfoAtLedger(
//     previousRecord.account,
//     nextLedger
//   );

//   await insertBalanceRow(accountInfo);

//   // const datapoints = await knex("balance").orderBy("date", "desc").limit(50);
//   // console.clear();
//   // console.log(
//   //   plot(datapoints.map(({ balance }) => balance).reverse(), { height: 20 })
//   // );
//   await getNextBalance();
// };

const ADDRESS_FILE = "address.csv";

const loadAddresses = async () => {
  console.log("loading addresses");
  const knex = await getKnex("tron");
  const csvStr = fs.readFileSync(path.join(__dirname, ADDRESS_FILE), "utf-8");
  const csvRows = parseCsv(csvStr);
  await knex("account")
    .insert(
      csvRows.map(([address, createdAt]) => ({
        id: uuid(),
        address,
        created_at: new Date(createdAt),
      }))
    )
    .onConflict("address")
    .ignore();
};

const start = async () => {
  const knex = await getKnex("tron");
  const [, , load = true] = process.argv;

  if (load) {
    await loadAddresses();
  }

  for (const [year, block] of years) {
    let next = true;
    let page = 0;
    while (next) {
      const accounts = await knex("account")
        .whereRaw("created_at <= make_date(?, ?, ?)", [year, 12, 31])
        .whereNotIn(
          "id",
          knex("balance")
            .whereRaw("date =  make_date(?, ?, ?)", [year, 12, 31])
            .select("account_id")
        )
        .limit(1000)
        .offset(page * 1000)
        .orderBy("address", "desc");

      if (_.isEmpty(accounts)) {
        next = false;
        break;
      } else {
        // eslint-disable-next-line no-plusplus
        page++;
      }

      const [{ date }] = (
        await knex.raw("select make_date as date from make_date(?, ?, ?)", [
          year,
          12,
          31,
        ])
      ).rows;

      for (const account of accounts) {
        const balance = await getAccountInfoAtBlock(account.address, block);

        await knex("balance")
          .insert({
            id: uuid(),
            account_id: account.id,
            balance: balance * 1e-18,
            date,
            created_at: new Date(),
          })
          .onConflict(["account_id", "date"])
          .ignore();
      }
    }
  }
};

start();
