import React, {useState} from 'react';
import './ShareModal.css';

export default function ShareModal({graphId, onClose, onShare}){
    const[link, setLink] = useState('');
    const[loading, setLoading] = useState(false);
    const[copied, setCopied] = useState(false);

    async function generate(){
        setLoading(true);
        try{
            const url = await onShare(graphId);
            setLink(url);
        }catch(err){
            console.error(err);
        }finally{
            setLoading(false);
        }
    }

    function copy(){
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000)
    }

    return(
        <div className="share-modal__overlay" onCLick={onClose}>
            <div className="share-modal" onClick={e => e.stopPropagation()}>
                <div className="share-modal__header">
                    <h3>Share Graph</h3>
                    <button onClick={onClose}>✕</button>
                </div>
                <p className="share-modal__desc">
                    Anyone with this link can view this graph without logging in.
                </p>
                {!link ? (
                    <button
                        className="share-modal__btn"
                        onClick={generate}
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Generate Share Link'}
                    </button>
                ):(
                    <div className="share-modal__link-row">
                        <input
                            className="share-modal__link-input"
                            value={link}
                            readOnly
                        />
                    <button className="share-modal__copy" onClick={copy}>
                        {copied? '✓ Copied' : 'Copy'}
                    </button>
                    </div>
                )}
            </div>
        </div>
    );
}
