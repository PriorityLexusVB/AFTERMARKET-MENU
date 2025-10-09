import React from 'react';

const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 inline-block mr-2 align-text-bottom">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
);

const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white">{number}</div>
        <div>
            <h4 className="font-bold text-lg text-gray-100">{title}</h4>
            <div className="text-gray-400">{children}</div>
        </div>
    </div>
);


export const SetupGuide: React.FC = () => {
    return (
        <div className="flex-grow flex items-center justify-center animate-fade-in">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
                <h2 className="text-4xl font-bold font-teko tracking-wider text-yellow-400 text-center">Connection Required</h2>
                <p className="text-center text-gray-300 mt-2 mb-8">This app is in <strong>Demo Mode</strong>. To connect to your live Supabase database, please follow these steps.</p>

                <div className="space-y-6">
                    <Step number={1} title="Open the Secrets Panel">
                        <p>In the Google AI Studio left sidebar, click the <KeyIcon /> <strong>Secrets</strong> icon.</p>
                    </Step>
                    <Step number={2} title="Add Supabase URL">
                        <p>Click <strong>"+ Add secret"</strong> and create a new secret:</p>
                        <ul className="mt-2 text-sm list-disc list-inside bg-gray-900 p-3 rounded-md font-mono">
                            <li><strong>Name:</strong> <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">SUPABASE_URL</code></li>
                            <li><strong>Value:</strong> Your project's URL from the Supabase dashboard.</li>
                        </ul>
                    </Step>
                    <Step number={3} title="Add Supabase Key">
                        <p>Click <strong>"+ Add secret"</strong> again:</p>
                        <ul className="mt-2 text-sm list-disc list-inside bg-gray-900 p-3 rounded-md font-mono">
                            <li><strong>Name:</strong> <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">SUPABASE_ANON_KEY</code></li>
                            <li><strong>Value:</strong> Your project's `anon` `public` key from Supabase.</li>
                        </ul>
                    </Step>
                </div>
                
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>After adding the secrets, the app preview will restart automatically and connect to your database.</p>
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};
