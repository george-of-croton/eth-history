# ETHEREUM HISTORY DOWNLOADER
## download an ETHEREUM account's balance history

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)]

### Requirments
- docker (https://docs.docker.com/engine/install/)
- nodejs (https://nodejs.org/en/download/)
- yarn (`npm install yarn`)

### Usage

- To start the download first create a file in the backend directory called address.csv that looks like this:

```
address,created_at
0x178b91ea3088264c2eebb7f91b3a8425b0a34ee5,2018-10-11 15:40:48.19
etc... 
```
then run `yarn start` and the script will begin querying the balance for each account in addresses file on dec 31 of each year since 2018.
