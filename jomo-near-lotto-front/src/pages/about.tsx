import React from 'react';
import { translations, Language } from './translations';

interface AboutProps {
    lang: Language;
    contractId: string;
}

const About: React.FC<AboutProps> = ({ lang, contractId }) => {
    const t = translations[lang];

    return (
        <section className="about-section mt-5 p-4 bg-light rounded shadow-sm" style={{ borderRadius: '15px' }}>
            <h3 className="mb-4 text-center" style={{ color: '#212529' }}>
                {t.about}
            </h3>
            <div className="row">
                <div className="col-md-6 mb-3">
                    <div className="card h-100 border-0 shadow-none bg-white p-3" style={{ borderRadius: '12px' }}>
                        <h5>{t.transparency}</h5>
                        <p className="text-muted small">
                            {t.transparencyDesc}
                        </p>
                        <a
                            href={`https://nearblocks.io/address/${contractId}`}
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
        </section>
    );
};

export default About;