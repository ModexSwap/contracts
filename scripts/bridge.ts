async function deployBlastContract() {
    const { ethers } = require("ethers");

    const INFURA_KEY = "f677366a081043149288a2f53f7e502e";
    const PRIVATE_KEY = "41fc46b3bc6dc629dfb956a823d2fbfb6bc85c47016a28a650a58ba0ad10cf46";

    const BlastBridgeAddress = "0xc644cc19d2A9388b71dd1dEde07cFFC73237Dca8";

    // Providers for Sepolia and Blast networks
    const sepoliaProvider = new ethers.providers.JsonRpcProvider(`https://sepolia.infura.io/v3/${INFURA_KEY}`);
    const blastProvider = new ethers.providers.JsonRpcProvider("https://sepolia.blast.io");

    // Wallet setup
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const sepoliaWallet = wallet.connect(sepoliaProvider);
    const blastWallet = wallet.connect(blastProvider);

    // // Transaction to send 0.1 Sepolia ETH
    const tx = {
        to: BlastBridgeAddress,
        value: ethers.utils.parseEther("0.5")
    };

    const transaction = await sepoliaWallet.sendTransaction(tx);
    await transaction.wait();

    // Confirm the bridged balance on Blast
    const balance = await blastWallet.getBalance(wallet.address);
    console.log(`Balance on Blast: ${ethers.utils.formatEther(balance)} ETH`);
}
deployBlastContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
