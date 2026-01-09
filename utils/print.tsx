import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nProvider } from '../contexts/I18nContext';
import { AuthProvider } from '../contexts/AuthContext';

export const openPrintWindow = (title: string, component: React.ReactElement) => {
    const printWindow = window.open('', '_blank', 'height=800,width=1000');
    if (!printWindow) {
        alert('Please allow popups for this website to print reports.');
        return;
    }

    printWindow.document.title = title;

    // Set basic HTML structure
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
                tailwind.config = {
                    corePlugins: {
                        preflight: false,
                    }
                }
            </script>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
                body {
                    font-family: 'Cairo', sans-serif;
                    direction: rtl;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
                /* Ensure Arabic text renders properly */
                * {
                    text-rendering: optimizeLegibility;
                }
                /* Force RTL for all elements */
                * {
                    direction: rtl !important;
                }
            </style>
        </head>
        <body class="bg-white">
            <div id="print-root"></div>
        </body>
        </html>
    `);

    // Create a root element in the new window
    const printRoot = printWindow.document.getElementById('print-root');
    if (!printRoot) {
        console.error('Failed to create print root element');
        return;
    }

    const root = ReactDOM.createRoot(printRoot);

    // The component might need contexts. Wrap it with the necessary providers.
    root.render(
        <React.StrictMode>
            <AuthProvider>
                <I18nProvider>
                    {component}
                </I18nProvider>
            </AuthProvider>
        </React.StrictMode>
    );

    // Wait for the content to render before printing
    setTimeout(() => {
        try {
            // Check if content is loaded
            const content = printWindow.document.getElementById('print-root');
            if (content && content.innerHTML.trim() === '') {
                console.warn('Print content not loaded yet, retrying...');
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                }, 1000);
            } else {
                printWindow.focus();
                printWindow.print();
            }
        } catch (error) {
            console.error('Print failed:', error);
            alert('فشل في طباعة التقرير. يرجى المحاولة مرة أخرى.');
        }
    }, 3000); // Increased delay to allow Tailwind CSS to load and styles to apply
};

