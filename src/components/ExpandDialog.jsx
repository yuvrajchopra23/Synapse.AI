import React from 'react';
import './ExpandDialog.css';

export default function ExpandDialog({nodeLabel, onKeep, onUseInternet, onClose}){
    return (
        <div className="expand-dialog__overlay" onClick={onClose}>
            <div className="expand-dialog" onClick={e => e.stopPropagation()}>
                <div className="expand-dialog__icon">⚠</div>
                <h3 className="expand-dialog__title">No more content found</h3>
                <p className="expand-dialog__body">
                    There isn't enough content in your uploaded files to expand <strong>"{nodeLabel}"</strong> further.
                </p>
                <p className="expand-dialog__body">
                    What would you like to do?
                </p>
                <div className="expand-dialog__actions">
                    <button className="expand-dialog__btn expand-dialog__btn--secondary" onClick={onKeep}>
                        keep as is
                    </button>
                    <button className='expand-dialog__btn expand-dialog__btn--primary' onClick={onUseInternet}>
                        Expand using internet
                    </button>
                </div>
            </div>
        </div>
    );
}