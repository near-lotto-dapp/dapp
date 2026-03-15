# 🎲 JOMO Pool Codes

![NEAR](https://img.shields.io/badge/NEAR-Protocol-black?style=for-the-badge&logo=near)
![React](https://img.shields.io/badge/React-Vite-blue?style=for-the-badge&logo=react)
![Rust](https://img.shields.io/badge/Rust-Smart_Contract-orange?style=for-the-badge&logo=rust)

**Live DApp:** [https://pool.codes/](https://pool.codes/)

JOMO Pool Codes is a fully decentralized, transparent prize pool built on the **NEAR Protocol**. It offers a sleek Web3 experience where users can participate in automated on-chain draws with verifiable randomness.

## 📖 Overview

"Joy Of Missing Out" (JOMO) is the philosophy behind this project. We trade the stress of constant crypto trading for a simple, transparent, and community-driven prize pool. Everything from ticket purchases to winner selection and prize distribution is handled entirely by a public smart contract.

## ⚙️ How It Works (The Logic)

1. **Connect:** Users sign in securely using any NEAR-compatible wallet (MyNearWallet, Meteor, Here, etc.).
2. **Buy Codes:** Participants purchase "Pool Codes" for **0.1 NEAR** each. Every code represents a verifiable entry into the current draw.
3. **Pool Share:** A user's probability of winning scales directly with their share of the total pool.
4. **Fair Draw:** At the designated time, the smart contract triggers the draw. It uses NEAR's native `env::random_seed()` to ensure 100% on-chain randomness.
5. **Automatic Payout:** The winner automatically receives the total accumulated pool minus a transparent 3% protocol fee.

## ✨ Features

* **Sleek Web3 UI:** A modern, mobile-responsive dark-blue interface tailored for the crypto community.
* **Smart Wallet Formatting:** Clean display of long NEAR wallet addresses.
* **Multilingual:** Seamlessly switch between English and Ukrainian (EN / UA).
* **On-Chain Transparency:** All draws, history, and fees are verifiable on the NEAR Explorer.
* **Integrated Analytics:** Real-time traffic monitoring via Vercel Analytics.

## 🛠️ Tech Stack

* **Smart Contract:** Rust (compiled to WebAssembly)
* **Frontend:** React, Vite, TypeScript, Bootstrap
* **Web3 Integration:** `near-api-js`, `near-connect-hooks`
* **Deployment:** Vercel (Frontend), NEAR Mainnet (Contract)

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.


## ⚖️ Legal Disclaimer

**PLEASE READ CAREFULLY:**

* **Experimental Software:** JOMO Pool is a decentralized Web3 application. The smart contracts and frontend are provided "as is" and "as available".
* **No Financial Advice:** Nothing in this repository or on the live website constitutes financial, legal, or investment advice.
* **User Responsibility:** You are solely responsible for your funds and for complying with your local laws. By using this software, you confirm you are 18+ and not located in a prohibited jurisdiction (e.g., USA, China).
* **No Liability:** The developers shall not be liable for any damages, loss of funds, or issues arising from the use of this software, including but not limited to smart contract vulnerabilities or network congestion.
* **Staking Risks:** (For the future No-Loss version) Users must understand NEAR Protocol's staking mechanics, including the standard 50-70 hour unbonding period for withdrawals.

## 🚀 Local Development

### Prerequisites
* Node.js (v18+)
* NEAR CLI

### Run the Frontend
```bash
# Clone the repository
git clone [https://github.com/near-lotto-dapp/dapp.git](https://github.com/near-lotto-dapp/dapp.git)
cd near-lotto-dapp/jomo-near-lotto-front

# Install dependencies
npm install

# Start the development server
npm run dev