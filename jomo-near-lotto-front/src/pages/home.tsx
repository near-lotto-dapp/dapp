import { useState, useEffect } from 'react';
import { useNearWallet } from 'near-connect-hooks';
import { translations, Language } from './translations';

const CONTRACT_ID = 'pool-dapp-jomo.near';

interface useNearHook {
    signedAccountId: string | null;
    signIn: () => void;
    callFunction: (params: { contractId: string; method: string; args?: Record<string, unknown>; deposit?: string }) => Promise<any>;
    viewFunction: (params: { contractId: string; method: string; args?: Record<string, unknown> }) => Promise<any>;
}

interface DrawRecord {
    winner_id: string;
    amount: string;
    timestamp_ms: number;
}

export default function Home() {
    const [lang, setLang] = useState<Language>(
        (localStorage.getItem('lang') as Language) || 'en'
    );
    const t = translations[lang];

    const [ticketsCount, setTicketsCount] = useState<number>(0);
    const [poolSizeNear, setPoolSizeNear] = useState<string>("0");
    const [buyCount, setBuyCount] = useState<number>(1);
    const [lastWinner, setLastWinner] = useState<{account_id: string, amount: string} | null>(null);

    const [globalStats, setGlobalStats] = useState({ totalWon: "0.0000", totalFee: "0.0000" });
    const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);

    const [nextDrawTime, setNextDrawTime] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<string>("00:00:00");

    const { signedAccountId, signIn, callFunction, viewFunction } = useNearWallet() as unknown as useNearHook;

    useEffect(() => {
        localStorage.setItem('lang', lang);

        if (!viewFunction) return;

        const fetchPoolData = async () => {
            try {
                const poolInfo = await viewFunction({
                    contractId: CONTRACT_ID,
                    method: 'get_pool_info'
                });
                if (poolInfo) {
                    setTicketsCount(poolInfo[0]);
                    setPoolSizeNear((Number(poolInfo[1]) / 1e24).toFixed(2));
                }

                const winnerInfoStr = await viewFunction({
                    contractId: CONTRACT_ID,
                    method: 'get_last_winner'
                });
                if (winnerInfoStr && winnerInfoStr !== "") {
                    const winnerObj = JSON.parse(winnerInfoStr);
                    setLastWinner({
                        account_id: winnerObj.account_id,
                        amount: (Number(winnerObj.amount) / 1e24).toFixed(4)
                    });
                }

                const statsInfo = await viewFunction({
                    contractId: CONTRACT_ID,
                    method: 'get_global_stats'
                });
                if (statsInfo) {
                    setGlobalStats({
                        totalWon: (Number(statsInfo[0]) / 1e24).toFixed(4),
                        totalFee: (Number(statsInfo[1]) / 1e24).toFixed(4)
                    });
                }

                const historyInfoStr = await viewFunction({
                    contractId: CONTRACT_ID,
                    method: 'get_draw_history'
                });
                if (historyInfoStr && historyInfoStr !== "") {
                    const parsedHistory: DrawRecord[] = JSON.parse(historyInfoStr);
                    setDrawHistory(parsedHistory.reverse());
                }

                const nextDrawStr = await viewFunction({
                    contractId: CONTRACT_ID,
                    method: 'get_next_draw_time'
                });
                if (nextDrawStr) {
                    setNextDrawTime(Number(nextDrawStr));
                }

            } catch (error) {
                console.log("Waiting for data from the contract...", error);
            }
        };

        fetchPoolData();
        const interval = setInterval(fetchPoolData, 5000);
        return () => clearInterval(interval);
    }, [viewFunction, lang]);


    useEffect(() => {
        if (!nextDrawTime) return;

        const timerInterval = setInterval(() => {
            const now = Date.now();
            const diff = nextDrawTime - now;

            if (diff <= 0) {
                setTimeLeft(lang === 'ua' ? "Час розіграшу! 🎲" : "Draw time! 🎲");
            } else {
                const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
                const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
                const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
                setTimeLeft(`${h}:${m}:${s}`);
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [nextDrawTime, lang]);


    const handleBuyTickets = async () => {
        if (!signedAccountId) {
            if (signIn) signIn();
            return;
        }
        const depositYocto = (BigInt(buyCount) * BigInt("100000000000000000000000")).toString();
        try {
            await callFunction({
                contractId: CONTRACT_ID,
                method: 'buy_tickets',
                args: {},
                deposit: depositYocto
            });
        } catch (error) {
            console.error("Error during the transaction: ", error);
        }
    };

    const formatDate = (timestampMs: number) => {
        const date = new Date(timestampMs);
        return date.toLocaleString(lang === 'ua' ? 'uk-UA' : 'en-US', {
            timeZone: 'UTC',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }) + ' UTC';
    };

    return (
        <main className="container mt-4 mb-5">
            <div className="d-flex justify-content-end gap-2 mb-2 pt-2">
                <button
                    className={`btn btn-sm ${lang === 'en' ? 'btn-dark' : 'btn-outline-dark'}`}
                    onClick={() => setLang('en')}
                    style={{ borderRadius: '8px' }}
                >EN</button>
                <button
                    className={`btn btn-sm ${lang === 'ua' ? 'btn-dark' : 'btn-outline-dark'}`}
                    onClick={() => setLang('ua')}
                    style={{ borderRadius: '8px' }}
                >UA</button>
            </div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>

            {lastWinner && (
                <div className="alert alert-success border-0 shadow-sm mb-4 d-flex align-items-center" style={{ borderRadius: '15px' }}>
                    <div className="fs-1 me-3">🏆</div>
                    <div>
                        <h5 className="mb-1 fw-bold">{t.lastJackpot}</h5>
                        <p className="mb-0">
                            {t.winnerPrefix} <strong>{lastWinner.account_id}</strong> {t.winnerSuffix} <strong>{lastWinner.amount} NEAR</strong>
                        </p>
                    </div>
                </div>
            )}

            <div className="row">
                <div className="col-md-7 mb-4">
                    {nextDrawTime > 0 && (
                        <div className="alert alert-warning text-center shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <h5 className="mb-1 text-dark">{t.nextDraw} </h5>
                            <h2 className="mb-0 fw-bold font-monospace text-danger">{timeLeft}</h2>
                        </div>
                    )}

                    <div className="card p-4 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                        <h2>{t.prizePool} <strong>{poolSizeNear} NEAR</strong></h2>
                        <h3>{t.tickets} {ticketsCount}</h3>
                        <p className="text-muted">{t.price} 0.10 NEAR</p>

                        <hr className="my-4" />

                        <div className="buy-section">
                            <label className="form-label fw-bold">{lang === 'ua' ? "Скільки квитків ви хочете купити?" : "How many tickets do you want to buy?"}</label>
                            <div className="input-group mb-2" style={{ maxWidth: '400px' }}>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={buyCount}
                                    min="1"
                                    onChange={(e) => setBuyCount(Number(e.target.value))}
                                />
                                <button
                                    className={`btn ${signedAccountId ? 'btn-success' : 'btn-primary'}`}
                                    onClick={handleBuyTickets}
                                >
                                    {signedAccountId ? `${t.buyBtn} ${(buyCount * 0.10).toFixed(2)} NEAR` : t.connectBtn}
                                </button>
                            </div>

                            {signedAccountId && (
                                <p className="text-success small mt-2">
                                    {t.connected} <strong>{signedAccountId}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-5 mb-4">
                    <div className="card p-4 shadow-sm h-100 bg-light" style={{ borderRadius: '15px' }}>
                        <h4 className="mb-4">{t.stats}</h4>
                        <div className="mb-3">
                            <span className="text-muted d-block">{t.totalWon} </span>
                            <span className="fs-3 fw-bold text-success">{globalStats.totalWon} NEAR</span>
                        </div>
                        <div>
                            <span className="text-muted d-block">{t.totalFee} </span>
                            <span className="fs-4 fw-bold text-primary">{globalStats.totalFee} NEAR</span>
                        </div>
                    </div>
                </div>
            </div>

            {drawHistory.length > 0 && (
                <div className="card p-4 shadow-sm mb-5" style={{ borderRadius: '15px' }}>
                    <h4 className="mb-4">{t.history}</h4>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                            <tr>
                                <th>{t.historyDate}</th>
                                <th>{t.historyWallet}</th>
                                <th className="text-end">{t.historyAmount}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {drawHistory.map((draw, index) => (
                                <tr key={index}>
                                    <td className="text-muted">{formatDate(draw.timestamp_ms)}</td>
                                    <td><strong>{draw.winner_id}</strong></td>
                                    <td className="text-end text-success fw-bold">
                                        +{(Number(draw.amount) / 1e24).toFixed(4)} NEAR
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- About Section Start --- */}
            <section className="about-section mt-5 p-4 bg-light rounded shadow-sm" style={{ borderRadius: '15px' }}>
                <h3 className="mb-4 text-center" style={{ color: '#212529' }}>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <div className="card h-100 border-0 shadow-none bg-white p-3" style={{ borderRadius: '12px' }}>
                            <h5>{t.transparency}</h5>
                            <p className="text-muted small">
                                {t.transparencyDesc}
                            </p>
                            <a
                                href="https://nearblocks.io/address/pool-dapp-jomo.near"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fw-bold text-decoration-none"
                                style={{ color: '#0072ce' }}
                            >
                                {t.verifyExplorer}
                            </a>
                        </div>
                    </div>
                    <div className="col-md-6 mb-3">
                        <div className="card h-100 border-0 shadow-none bg-white p-3" style={{ borderRadius: '12px' }}>
                            <h5>{t.automation}</h5>
                            <p className="text-muted small">
                                {t.automationDesc}
                            </p>
                            <a
                                href="https://github.com/near-lotto-dapp/dapp/actions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fw-bold text-decoration-none"
                                style={{ color: '#0072ce' }}
                            >
                                {t.viewRunner}
                            </a>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-3 text-muted" style={{ fontSize: '0.85rem' }}>
                    <p className="mb-0">{t.status}</p>
                    <p>{lang === 'ua' ? "Адреса контракту" : "Contract Address"}: <code>pool-dapp-jomo.near</code></p>
                </div>
            </section>
            {/* --- About Section End --- */}
        </main>
    );
}