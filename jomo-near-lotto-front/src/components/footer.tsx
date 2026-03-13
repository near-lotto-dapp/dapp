import React, { useState } from 'react';

export const Footer = ({ t }: { t: any }) => {
    // Створюємо стан для керування видимістю модального вікна
    const [showTerms, setShowTerms] = useState(false);

    return (
        <>
            <footer className="container mt-5 mb-4 text-center">
                <div className="py-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <p className="footer-text m-0">
                        <i className="bi bi-shield-check me-1 text-success"></i>
                        Code verified on{' '}
                        <a
                            href="https://explorer.near.org/accounts/pool-dapp-jomo.near"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-link"
                        >
                            NEAR Explorer
                        </a>
                        <span className="mx-2" style={{ opacity: 0.3 }}>|</span>
                        {/* Змінюємо alert на зміну стану */}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setShowTerms(true);
                            }}
                            className="footer-link"
                        >
                            Terms & Conditions
                        </a>
                    </p>

                    <p className="footer-text mt-2 px-3" style={{ fontSize: '0.75rem', maxWidth: '700px', margin: '0 auto', opacity: 0.5, lineHeight: '1.4' }}>
                        {t.shortDisclaimer}
                    </p>

                    <p className="footer-text mt-3" style={{ fontSize: '0.7rem', opacity: 0.4 }}>
                        Built on NEAR Protocol. 2026 JOMO Pool Codes.
                    </p>
                </div>
            </footer>

            {/* Модальне вікно для Terms & Conditions */}
            {showTerms && (
                <div
                    className="modal d-block"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)' }}
                    tabIndex={-1}
                    onClick={() => setShowTerms(false)} // Закриття при кліку на фон
                >
                    <div
                        className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
                        onClick={(e) => e.stopPropagation()} // Щоб клік по самому вікну його не закривав
                    >
                        <div
                            className="modal-content"
                            style={{
                                backgroundColor: '#0a192f', // Темно-синій під стиль сайту
                                border: '1px solid rgba(84, 214, 255, 0.2)',
                                color: '#fff',
                                borderRadius: '12px'
                            }}
                        >
                            <div className="modal-header border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                <h5 className="modal-title fw-bold">Terms & Conditions</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowTerms(false)}
                                ></button>
                            </div>
                            <div className="modal-body text-start">
                                {/* whiteSpace: 'pre-wrap' дозволяє відображати переноси рядків (\n) з твого тексту */}
                                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                    {t.fullTerms}
                                </p>
                            </div>
                            <div className="modal-footer border-top-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-sm w-100"
                                    style={{ backgroundColor: 'rgba(84, 214, 255, 0.1)', color: '#54d6ff', border: '1px solid #54d6ff' }}
                                    onClick={() => setShowTerms(false)}
                                >
                                    I Understand
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};