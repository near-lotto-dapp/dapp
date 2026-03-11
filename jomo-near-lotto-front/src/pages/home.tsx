import {useState, useEffect, useCallback} from 'react';
import {useNearWallet} from 'near-connect-hooks';
import {translations, Language} from './translations';
import HowItWorks from "./how_it_works";
import About from './about';

const CONTRACT_ID = 'pool-dapp-jomo.near';

interface useNearHook {
    signedAccountId: string | null;
    signIn: () => void;
    callFunction: (params: {
        contractId: string;
        method: string;
        args?: Record<string, unknown>;
        deposit?: string
    }) => Promise<any>;
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
    const [allPoolCodes, setAllPoolCodes] = useState<string[]>([]);

    const [lastWinner, setLastWinner] = useState<{ account_id: string, amount: string } | null>(null);
    const [globalStats, setGlobalStats] = useState({totalWon: "0.0000", totalFee: "0.0000"});
    const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);
    const [nextDrawTime, setNextDrawTime] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<string>("00:00:00");

    const {signedAccountId, signIn, callFunction, viewFunction} = useNearWallet() as unknown as useNearHook;

    const fetchPoolCodes = useCallback(async () => {
        if (!viewFunction) return;
        try {
            const codes = await viewFunction({
                contractId: CONTRACT_ID,
                method: 'get_active_pool_codes',
                args: {from_index: 0, limit: 500}
            });
            if (codes) setAllPoolCodes(codes);
        } catch (e) {
            console.error("Error fetching pool codes", e);
        }
    }, [viewFunction]);

    useEffect(() => {
        localStorage.setItem('lang', lang);
        if (!viewFunction) return;

        const fetchPoolData = async () => {
            try {
                await fetchPoolCodes();

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
    }, [viewFunction, lang, fetchPoolCodes]);

    // Таймер зворотного відліку
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
            // Оновлюємо коди відразу після покупки
            setTimeout(fetchPoolCodes, 2000);
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

    const formatAddress = (address: string) => {
        if (address.length > 25) {
            return `${address.slice(0, 10)}...${address.slice(-10)}`;
        }
        return address;
    };

    const getTopHolders = () => {
        const counts: Record<string, number> = {};
        allPoolCodes.forEach(address => {
            counts[address] = (counts[address] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([address, count]) => ({address, count, percent: (count / allPoolCodes.length) * 100}))
            .sort((a, b) => b.count - a.count); // Сортуємо: найбільші холдери зверху
    };

    const topHolders = getTopHolders();

    return (
        <main className="container mt-4 mb-5">
            {/* ... блок кнопок перемикання мов ... */}
            <div className="d-flex justify-content-end gap-2 mb-2 pt-2">
                <button className="btn btn-sm" onClick={() => setLang('en')} style={{
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    backgroundColor: lang === 'en' ? '#212529' : 'transparent',
                    color: lang === 'en' ? '#fff' : '#6c757d',
                    border: lang === 'en' ? '2px solid #212529' : '2px solid #ced4da',
                    fontWeight: lang === 'en' ? 'bold' : 'normal',
                    padding: '4px 12px'
                }}>EN
                </button>
                <button className="btn btn-sm" onClick={() => setLang('ua')} style={{
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    backgroundColor: lang === 'ua' ? '#212529' : 'transparent',
                    color: lang === 'ua' ? '#fff' : '#6c757d',
                    border: lang === 'ua' ? '2px solid #212529' : '2px solid #ced4da',
                    fontWeight: lang === 'ua' ? 'bold' : 'normal',
                    padding: '4px 12px'
                }}>UA
                </button>
            </div>

            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>

            {/* ... блок переможця ... */}
            {lastWinner && (
                <div className="alert alert-success border-0 shadow-sm mb-4 d-flex align-items-center"
                     style={{borderRadius: '15px'}}>
                    <div className="fs-1 me-3">🏆</div>
                    <div>
                        <h5 className="mb-1 fw-bold">{t.lastJackpot}</h5>
                        <p className="mb-0">{t.winnerPrefix} <strong>{lastWinner.account_id}</strong> {t.winnerSuffix}
                            <strong>{lastWinner.amount} NEAR</strong></p>
                    </div>
                </div>
            )}

            <div className="row">
                <div className="col-md-7 mb-4">
                    {nextDrawTime > 0 && (
                        <div className="alert alert-warning text-center shadow-sm mb-4" style={{borderRadius: '15px'}}>
                            <h5 className="mb-1 text-dark">{t.nextDraw} </h5>
                            <h2 className="mb-0 fw-bold font-monospace text-danger">{timeLeft}</h2>
                        </div>
                    )}

                    <div className="card p-4 shadow-sm h-100" style={{borderRadius: '15px'}}>
                        <h2>{t.prizePool} <strong>{poolSizeNear} NEAR</strong></h2>
                        <h3>{t.tickets} {ticketsCount}</h3>
                        <p className="text-muted">{t.price} 0.10 NEAR</p>
                        <hr className="my-4"/>

                        <div className="buy-section">
                            <label
                                className="form-label fw-bold">{lang === 'ua' ? "Скільки pool code ви хочете купити?" : "How many pool codes do you want to buy?"}</label>
                            <div className="input-group mb-2" style={{maxWidth: '400px'}}>
                                <input type="number" className="form-control" value={buyCount} min="1"
                                       onChange={(e) => setBuyCount(Number(e.target.value))}/>
                                <button className={`btn ${signedAccountId ? 'btn-success' : 'btn-primary'}`}
                                        onClick={handleBuyTickets}>
                                    {signedAccountId ? `${t.buyBtn} ${(buyCount * 0.10).toFixed(2)} NEAR` : t.connectBtn}
                                </button>
                            </div>

                            {signedAccountId && (
                                <div className="mt-4 p-4 bg-white border rounded shadow-sm"
                                     style={{borderRadius: '20px'}}>
                                    {(() => {
                                        const userCodesCount = allPoolCodes.filter(id => id === signedAccountId).length;
                                        const totalCodes = allPoolCodes.length > 0 ? allPoolCodes.length : ticketsCount;
                                        const sharePercent = totalCodes > 0 ? (userCodesCount / totalCodes) * 100 : 0;

                                        return (
                                            <>
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h5 className="fw-bold mb-0 text-dark">{lang === 'ua' ? "Ваша частка пулу" : "Your Pool Share"}</h5>
                                                    <span
                                                        className="badge bg-success rounded-pill px-3 py-2 fs-6">{sharePercent.toFixed(2)}%</span>
                                                </div>

                                                <div className="progress mb-3" style={{
                                                    height: '14px',
                                                    borderRadius: '7px',
                                                    backgroundColor: '#f0f2f5'
                                                }}>
                                                    <div
                                                        className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                                                        role="progressbar" style={{
                                                        width: `${sharePercent}%`,
                                                        transition: 'width 1.5s ease-in-out',
                                                        boxShadow: '0 0 15px rgba(0, 114, 206, 0.3)'
                                                    }}></div>
                                                </div>

                                                <div className="d-flex justify-content-between mb-4 small text-muted">
                                                    <span>{userCodesCount} {lang === 'ua' ? "активних кодів" : "active codes"}</span>
                                                    <span>{lang === 'ua' ? "Всього:" : "Total:"} {totalCodes}</span>
                                                </div>

                                                <div className="pool-codes-list mt-3">
                                                    <h6 className="small fw-bold text-uppercase text-muted mb-2">{lang === 'ua' ? "Ваші Pool Codes:" : "Your Pool Codes:"}</h6>
                                                    <div className="d-flex flex-wrap gap-2" style={{
                                                        maxHeight: '150px',
                                                        overflowY: 'auto',
                                                        padding: '5px'
                                                    }}>
                                                        {allPoolCodes.map((owner, index) => (
                                                            owner === signedAccountId && (
                                                                <span key={index}
                                                                      className="badge border text-primary bg-light font-monospace"
                                                                      style={{
                                                                          fontSize: '0.75rem',
                                                                          padding: '6px 10px',
                                                                          borderRadius: '6px'
                                                                      }}>
                                                                    #{(index + 1).toString().padStart(4, '0')}
                                                                </span>
                                                            )
                                                        ))}
                                                        {userCodesCount === 0 &&
                                                            <p className="text-muted small italic">{lang === 'ua' ? "У вас поки немає активних кодів" : "No active codes yet"}</p>}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-5 mb-4">
                    <div className="card p-4 shadow-sm h-100 bg-light" style={{borderRadius: '15px'}}>
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

            <div className="card p-4 shadow-sm mb-5"
                 style={{borderRadius: '15px', border: 'none', backgroundColor: '#fff'}}>
                <h4 className="mb-4 d-flex align-items-center">
                    <span className="me-2">📊</span>
                    {lang === 'ua' ? "Розподіл Pool-Codes" : "Pool-Codes Distribution"}
                </h4>

                <div className="row align-items-center">
                    {/* Візуалізація списку топ-власників */}
                    <div className="col-md-6">
                        <div className="holders-list"
                             style={{maxHeight: '300px', overflowY: 'auto', paddingRight: '10px'}}>
                            {topHolders.map((holder, index) => (
                                <div key={index}
                                     className={`d-flex align-items-center p-2 mb-2 rounded ${holder.address === signedAccountId ? 'bg-primary bg-opacity-10 border border-primary' : 'bg-light'}`}>
                                    <div className="me-3 fw-bold text-muted" style={{width: '25px'}}>{index + 1}.</div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between mb-1">
                                <span className="font-monospace small fw-bold" title={holder.address}>
    {holder.address === signedAccountId
        ? `⭐ ${formatAddress(holder.address)} (You)`
        : formatAddress(holder.address)}
</span>
                                            <span
                                                className="small fw-bold">{holder.count} {lang === 'ua' ? "шт" : "pcs"}</span>
                                        </div>
                                        <div className="progress" style={{height: '6px'}}>
                                            <div
                                                className="progress-bar bg-primary"
                                                style={{width: `${holder.percent}%`}}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="ms-3 small fw-bold text-primary"
                                         style={{width: '50px', textAlign: 'right'}}>
                                        {holder.percent.toFixed(1)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Секція статистики пулу */}
                    <div className="col-md-6 text-center">
                        <div className="p-4 rounded-4 bg-light border">
                            <div className="display-6 fw-bold text-primary mb-1">{topHolders.length}</div>
                            <div
                                className="text-muted small text-uppercase mb-4">{lang === 'ua' ? "Унікальних учасників" : "Unique Participants"}</div>

                            <div className="row">
                                <div className="col-6 border-end">
                                    <div className="h4 mb-0 fw-bold">{allPoolCodes.length}</div>
                                    <div
                                        className="extra-small text-muted">{lang === 'ua' ? "Всього часток codes" : "Total Codes"}</div>
                                </div>
                                <div className="col-6">
                                    <div
                                        className="h4 mb-0 fw-bold">{(allPoolCodes.length / (topHolders.length || 1)).toFixed(1)}</div>
                                    <div
                                        className="extra-small text-muted">{lang === 'ua' ? "Сер. часток codes на особу" : "Avg Codes / Person"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ... історія ... */}
            {drawHistory.length > 0 && (
                <div className="card p-4 shadow-sm mb-5" style={{borderRadius: '15px'}}>
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
                                    <td className="text-end text-success fw-bold">+{(Number(draw.amount) / 1e24).toFixed(4)} NEAR</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <HowItWorks lang={lang}/>
            <About lang={lang} contractId={CONTRACT_ID}/>
        </main>
    );
}