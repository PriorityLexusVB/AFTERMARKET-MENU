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
            <div className="text-gray-400 text-sm">{children}</div>
        </div>
    </div>
);

interface SetupGuideProps {
    error: string | null;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ error }) => {
    return (
        <div className="animate-fade-in text-left">
            <p className="text-center text-gray-300 mb-6">This app is in <strong>Demo Mode</strong>. To enable authentication and data persistence, please connect to your Firebase project.</p>

            <div className="space-y-6">
                <Step number={1} title="Create a .env file">
                    <p>In the root of the project, create a new file named <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">.env</code>. You can copy the contents of <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">.env.example</code> to get started.</p>
                </Step>
                <Step number={2} title="Add Firebase Configuration">
                    <p>Fill in the <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">.env</code> file with your Firebase project's credentials. All variables must start with <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">VITE_</code>.</p>
                    <p className="text-xs text-gray-500 mt-2">Find your config object in your Firebase project's settings page under "Your apps".</p>
                </Step>
            </div>
            
            {error && (
                <div className="mt-6 border-t border-gray-700 pt-4">
                    <h4 className="text-base font-bold text-red-400">Diagnostic Information</h4>
                    <pre className="mt-2 bg-gray-900 text-red-300 p-3 rounded-md text-xs whitespace-pre-wrap font-mono">{error}</pre>
                </div>
            )}

            <div className="mt-6 text-center text-xs text-gray-500">
                <p>After adding the environment variables, the app preview will restart automatically.</p>
            </div>
        </div>
    );
};