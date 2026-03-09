import { useState, useEffect } from 'react';
import { useNearWallet } from 'near-connect-hooks';

const CONTRACT_ID = 'pool.kyba.testnet';

interface useNearHook {
    signedAccountId: string | null;
    signIn: () => void;
    callFunction: (params: { contractId: string; method: string; args?: Record<string, unknown>; deposit?: string }) => Promise<any>;
    viewFunction: (params: { contractId: string; method: string; args?: Record<string, unknown> }) => Promise<any>;
}

// Додаємо інтерфейс для записів історії
interface DrawRecord {
    winner_id: string;
    amount: string;
    timestamp_ms: number;
}

export default function Home() {
    // Усі хуки стану мають бути ВСЕРЕДИНІ компонента
    const [ticketsCount, setTicketsCount] = useState<number>(0);
    const [poolSizeNear, setPoolSizeNear] = useState<string>("0");
    const [buyCount, setBuyCount] = useState<number>(1);
    const [lastWinner, setLastWinner] = useState<{account_id: string, amount: string} | null>(null);

    // Стейти для Статистики та історії
    const [globalStats, setGlobalStats] = useState({ totalWon: "0.0000", totalFee: "0.0000" });
    const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);

    // Стейти для Таймера
    const [nextDrawTime, setNextDrawTime] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<string>("00:00:00");

    const { signedAccountId, signIn, callFunction, viewFunction } = useNearWallet() as unknown as useNearHook;

    // --- ОСНОВНИЙ ЕФЕКТ: Запит даних з блокчейну (кожні 5 секунд) ---
    useEffect(() => {
        if (!viewFunction) return;

        const fetchPoolData = async () => {
            try {
                // 1. Інфо про пул
                const poolInfo = await viewFunction({
                    contractId: CONTRACT_ID,
                    method: 'get_pool_info'
                });
                if (poolInfo) {
                    setTicketsCount(poolInfo[0]);
                    setPoolSizeNear((Number(poolInfo[1]) / 1e24).toFixed(2));
                }

                // 2. Останній переможець
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

                // 3. Глобальна статистика
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

                // 4. Історія розіграшів
                const historyInfoStr = await viewFunction({
                    contractId: CONTRACT_ID,
                    method: 'get_draw_history'
                });
                if (historyInfoStr && historyInfoStr !== "") {
                    const parsedHistory: DrawRecord[] = JSON.parse(historyInfoStr);
                    setDrawHistory(parsedHistory.reverse());
                }

                // 5. Час наступного розіграшу (НОВЕ)
                const nextDrawStr = await viewFunction({
                    contractId: CONTRACT_ID,
                    method: 'get_next_draw_time'
                });
                if (nextDrawStr) {
                    setNextDrawTime(Number(nextDrawStr));
                }

            } catch (error) {
                console.log("Очікування даних з контракту...", error);
            }
        };

        fetchPoolData();
        const interval = setInterval(fetchPoolData, 5000);
        return () => clearInterval(interval);
    }, [viewFunction]);


    // --- НОВИЙ ЕФЕКТ: Живий таймер (оновлюється кожну секунду) ---
    useEffect(() => {
        if (!nextDrawTime) return;

        const timerInterval = setInterval(() => {
            const now = Date.now();
            const diff = nextDrawTime - now;

            if (diff <= 0) {
                setTimeLeft("Час розіграшу! 🎲");
            } else {
                const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
                const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
                const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
                setTimeLeft(`${h}:${m}:${s}`);
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [nextDrawTime]);


    const handleBuyTickets = async () => {
        if (!signedAccountId) {
            if (signIn) signIn();
            return;
        }
        // Оновлено для 0.10 NEAR (23 нулі)
        const depositYocto = (BigInt(buyCount) * BigInt("100000000000000000000000")).toString();
        try {
            await callFunction({
                contractId: CONTRACT_ID,
                method: 'buy_tickets',
                args: {},
                deposit: depositYocto
            });
        } catch (error) {
            console.error("Помилка під час транзакції:", error);
        }
    };

    const formatDate = (timestampMs: number) => {
        const date = new Date(timestampMs);
        return date.toLocaleString('uk-UA', {
            timeZone: 'UTC',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }) + ' UTC';
    };

    return (
        <main className="container mt-4 mb-5">
            <h1>JOMO Pool 🧘‍♂️</h1>
            <p>Накопичуй крипту, ігноруй шум. Спокійно рухаємося до цілі!</p>

            {/* Плашка останнього переможця */}
            {lastWinner && (
                <div className="alert alert-success border-0 shadow-sm mb-4 d-flex align-items-center" style={{ borderRadius: '15px' }}>
                    <div className="fs-1 me-3">🏆</div>
                    <div>
                        <h5 className="mb-1 fw-bold">Останній джекпот розіграно!</h5>
                        <p className="mb-0">
                            Гравець <strong>{lastWinner.account_id}</strong> забрав <strong>{lastWinner.amount} NEAR</strong>
                        </p>
                    </div>
                </div>
            )}

            <div className="row">
                {/* Головна картка пулу */}
                <div className="col-md-7 mb-4">
                    {/* НОВИЙ БЛОК: Живий таймер */}
                    {nextDrawTime > 0 && (
                        <div className="alert alert-warning text-center shadow-sm mb-4" style={{ borderRadius: '15px' }}>
                            <h5 className="mb-1 text-dark">До наступного розіграшу:</h5>
                            <h2 className="mb-0 fw-bold font-monospace text-danger">{timeLeft}</h2>
                        </div>
                    )}

                    <div className="card p-4 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                        <h2>Поточний котел: <strong>{poolSizeNear} NEAR</strong></h2>
                        <h3>Придбано квитків: {ticketsCount}</h3>
                        <p className="text-muted">Ціна 1 квитка: 0.10 NEAR</p>

                        <hr className="my-4" />

                        <div className="buy-section">
                            <label className="form-label fw-bold">Скільки квитків купуємо?</label>
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
                                    {signedAccountId ? `Купити за ${(buyCount * 0.10).toFixed(2)} NEAR` : "Підключити гаманець"}
                                </button>
                            </div>

                            {signedAccountId && (
                                <p className="text-success small mt-2">
                                    Підключено: <strong>{signedAccountId}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Картка глобальної статистики */}
                <div className="col-md-5 mb-4">
                    <div className="card p-4 shadow-sm h-100 bg-light" style={{ borderRadius: '15px' }}>
                        <h4 className="mb-4">🌍 Глобальна статистика</h4>
                        <div className="mb-3">
                            <span className="text-muted d-block">Всього розіграно гравцям:</span>
                            <span className="fs-3 fw-bold text-success">{globalStats.totalWon} NEAR</span>
                        </div>
                        <div>
                            <span className="text-muted d-block">Зароблено (3% JOMO Fee):</span>
                            <span className="fs-4 fw-bold text-primary">{globalStats.totalFee} NEAR</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Таблиця історії розіграшів */}
            {drawHistory.length > 0 && (
                <div className="card p-4 shadow-sm" style={{ borderRadius: '15px' }}>
                    <h4 className="mb-4">📜 Історія розіграшів</h4>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                            <tr>
                                <th>Дата та час (UTC)</th>
                                <th>Гаманець переможця</th>
                                <th className="text-end">Сума виграшу</th>
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
        </main>
    );
}