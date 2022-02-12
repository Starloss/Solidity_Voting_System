/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("dotenv").config();
require('@nomiclabs/hardhat-waffle');
require('@openzeppelin/hardhat-upgrades');

module.exports = {
    solidity: {
        version: "0.8.11",
        settings: {
            optimizer: {
            enabled: true,
            runs: 200,
            },
        },
    },
    networks: {
        rinkeby: {
        url: process.env.INFURA_URL,
        accounts: [`0x${process.env.PRIVATE_KEY}`]
        }
    }
};