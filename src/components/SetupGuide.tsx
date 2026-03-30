import React from "react";

const Step: React.FC<{
  number?: string;
  title: string;
  children: React.ReactNode;
}> = ({ number, title, children }) => (
  <div className="flex items-start gap-3 sm:gap-4">
    {number && (
      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base">
        {number}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <h4 className="font-bold text-base sm:text-lg text-gray-100">{title}</h4>
      <div className="text-gray-400 text-xs sm:text-sm space-y-2">{children}</div>
    </div>
  </div>
);

interface SetupGuideProps {
  error: string | null;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ error }) => {
  return (
    <div className="animate-fade-in text-left max-w-2xl mx-auto">
      <p className="text-center text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
        This app is in <strong>Demo Mode</strong>. To enable authentication and
        data persistence, please connect to your Firebase project.
      </p>

      <div className="space-y-4 sm:space-y-6">
        <Step number="1" title="Create a .env.local file">
          <p>
            In the root of the project, create a new file named{" "}
            <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">
              .env.local
            </code>
            . You can copy the template from the project's{" "}
            <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">
              README.md
            </code>{" "}
            file as a starting point.
          </p>
        </Step>
        <Step number="2" title="Add Firebase Credentials">
          <p>
            Add your Firebase credentials to enable authentication and data
            persistence.
          </p>

          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-900/50 rounded-lg">
            <h5 className="font-semibold text-gray-200">
              Firebase: Option A (Recommended)
            </h5>
            <p className="text-xs text-gray-400 mt-1">
              Paste your entire Firebase config object from your project
              settings as the value for a single `VITE_FIREBASE_CONFIG`
              variable.
            </p>
            <pre className="mt-2 text-[10px] sm:text-xs bg-gray-900 p-2 sm:p-3 rounded-md font-mono text-gray-300 whitespace-pre-wrap break-all sm:break-normal overflow-x-auto">
              {`VITE_FIREBASE_CONFIG='{"apiKey":"...","authDomain":"...","projectId":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}'`}
            </pre>
          </div>

          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-900/50 rounded-lg">
            <h5 className="font-semibold text-gray-200">
              Firebase: Option B (Alternative)
            </h5>
            <p className="text-xs text-gray-400 mt-1">
              Alternatively, you can define each key individually. All variables
              must start with{" "}
              <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">
                VITE_
              </code>
              .
            </p>
            <pre className="mt-2 text-[10px] sm:text-xs bg-gray-900 p-2 sm:p-3 rounded-md font-mono text-gray-300 whitespace-pre-wrap break-all sm:break-normal overflow-x-auto">
              {`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...`}
            </pre>
          </div>
        </Step>
      </div>

      {error && (
        <div className="mt-4 sm:mt-6 border-t border-gray-700 pt-3 sm:pt-4">
          <h4 className="text-sm sm:text-base font-bold text-red-400">
            Diagnostic Information
          </h4>
          <pre className="mt-2 bg-gray-900 text-red-300 p-2 sm:p-3 rounded-md text-[10px] sm:text-xs whitespace-pre-wrap break-all sm:break-normal font-mono overflow-x-auto">
            {error}
          </pre>
        </div>
      )}

      <div className="mt-4 sm:mt-6 text-center text-[11px] sm:text-xs text-gray-500">
        <p>
          After creating the{" "}
          <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">
            .env.local
          </code>{" "}
          file, you must restart the development server.
        </p>
      </div>
    </div>
  );
};
