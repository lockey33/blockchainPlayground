import ethers from "ethers";
import SwapFactory from "./factory/swapFactory";
import config from "./config";
import PANCAKE from "./factory/abis/pancake";
import ERC20 from "./factory/abis/erc20";

const tokenIn = "0xDfa7948C91133F1e0cfC03cb2d88C1b0a7E7887C"
const swapFactory = new SwapFactory("ganache", config.dragmoon.ganacheAccount,  config.dragmoon.ganacheKey) //dragmoon
const tokenInContractInstance =  await this.getFreeContractInstance(tokenIn, ERC20)
const routerContractInstance = await swapFactory.getPaidContractInstance(this.router, PANCAKE, this.signer)
let abi = ["function approve(address _spender, uint256 _value) public returns (bool success)"]
let contract = new ethers.Contract(tokenInContractInstance.address, abi, this.signer)
const tx = await contract.approve(this.router, this.approveMaxValue, {gasLimit: gasLimit, gasPrice: gasPrice})
