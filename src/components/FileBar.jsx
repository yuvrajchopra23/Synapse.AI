import React from 'react';
import './FileBar.css';

function getFileIcon(filename){
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        pdf:  '📄',
        ppt:  '📊',
        pptx: '📊',
        doc:  '📝',
        docx: '📝',
        xls:  '📈',
        xlsx: '📈',
        txt:  '📃',
    };
    return icons[ext] || '📎';
}

export default function FileBar({ files, onRemove, internetOn, onToggleInternet}){
    if(files.length === 0) return null;

    return (
        <div className ="filebar">
            <div className="filebar__files">
                {files.map((file, i) => (
                    <div key ={i} className ="filebar__file">
                        <span className="filebar__file-icon">{getFileIcon(file.name)}</span>
                        <span className="filebar__file-name">{file.name}</span>
                        <button
                            className="filebar__file-remove"
                            onClick={()=>onRemove(i)}
                            title="Remove file"
                        >
                        ✕
                        </button>
                    </div>
                ))}
            </div>

            <div className="filebar__controls">
                <span className="filebar__label">Use internet:</span>
                <button
                    className={`filebar__toggle ${internetOn ? 'filebar__toggle--on' : ''}`}
                    onClick={onToggleInternet}
                >
                {internetOn ? 'ON' : 'OFF'}
                </button>
            {!internetOn && (
            <span className="filebar__hint">Graph will use file content only</span>
            )}
            {internetOn && (
            <span className="filebar__hint">File content + internet knowledge</span>
            )}
        </div> 
    </div>
    );
}