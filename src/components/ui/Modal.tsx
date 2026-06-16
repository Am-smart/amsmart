import React from 'react';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
    asForm?: boolean;
    onSubmit?: (e: React.FormEvent) => void;
}

export const Modal: React.FC<ModalProps> = ({
    title,
    onClose,
    children,
    footer,
    maxWidth = 'max-w-2xl',
    asForm = false,
    onSubmit
}) => {
    const Container = asForm ? 'form' : 'div';
    const formProps = asForm ? { onSubmit } : {};

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[1100] p-2 sm:p-4 animate-in fade-in duration-200">
            <div className={`bg-white w-full ${maxWidth} rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh]`}>
                <header className="p-4 sm:p-6 md:p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-lg md:text-2xl font-bold text-slate-900 truncate pr-4">{title}</h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors shrink-0" aria-label="Close modal">✕</button>
                </header>

                <Container {...formProps} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1">
                        {children}
                    </div>
                    {footer && (
                        <footer className="p-4 sm:p-6 md:p-8 bg-slate-50 border-t shrink-0">
                            {footer}
                        </footer>
                    )}
                </Container>
            </div>
        </div>
    );
};
