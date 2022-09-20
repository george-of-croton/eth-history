import { parseCsv } from "./utils";

describe("parseCsv", () => {
  test("returns expected values", async () => {
    const str = `address,created_at
0x178b91ea3088264c2eebb7f91b3a8425b0a34ee5,2018-10-11 15:40:48.19
0xac3e419c23e9ac0a5f39d0053808b862800df403,2018-11-01 19:44:00.24`;
    const res = parseCsv(str);
    expect(res).toEqual([
      ["0x178b91ea3088264c2eebb7f91b3a8425b0a34ee5", "2018-10-11 15:40:48.19"],
      ["0xac3e419c23e9ac0a5f39d0053808b862800df403", "2018-11-01 19:44:00.24"],
    ]);
  });
});
