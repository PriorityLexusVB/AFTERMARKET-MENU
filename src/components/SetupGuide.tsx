import React from "react";

const Step: React.FC<{
  number?: string;
  title: string;
  children: React.ReactNode;
}> = ({ number, title, children }) => (
  <div className="flex items-start gap-4">
    {number && (
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white">
        {number}
      </div>
    )}
    <div>
      <h4 className="font-bold text-lg text-gray-100">{title}</h4>
      <div className="text-gray-400 text-sm space-y-2">{children}</div>
    </div>
  </div>
);

interface SetupGuideProps {
  error: string | null;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ error }) => {
  return (
    <div className="animate-fade-in text-left">
      <p className="text-center text-gray-300 mb-6">
        This app is in <strong>Demo Mode</strong>. To enable authentication and
        data persistence, please connect to your Firebase project.
      </p>

      <div className="space-y-6">
        <Step number="1" title="Create a .env file">
          <p>
            In the root of the project, create a new file named{" "}
            <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">
              .env
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

          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
            <h5 className="font-semibold text-gray-200">
              Firebase: Option A (Recommended)
            </h5>
            <p className="text-xs text-gray-400 mt-1">
              Paste your entire Firebase config object from your project
              settings as the value for a single `FIREBASE_CONFIG` variable.
            </p>
            <pre className="mt-2 text-xs bg-gray-900 p-3 rounded-md font-mono text-gray-300 whitespace-pre-wrap">
              {`FIREBASE_CONFIG='{...}'`}
            </pre>
          </div>

          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
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
            <pre className="mt-2 text-xs bg-gray-900 p-3 rounded-md font-mono text-gray-300 whitespace-pre-wrap">
              {`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...`}
            </pre>
          </div>
        </Step>
      </div>

      {error && (
        <div className="mt-6 border-t border-gray-700 pt-4">
          <h4 className="text-base font-bold text-red-400">
            Diagnostic Information
          </h4>
          <pre className="mt-2 bg-gray-900 text-red-300 p-3 rounded-md text-xs whitespace-pre-wrap font-mono">
            {error}
          </pre>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-gray-500">
        <p>
          After creating the{" "}
          <code className="bg-gray-700 px-1 py-0.5 rounded text-yellow-300">
            .env
          </code>{" "}
          file, you must restart the development server.
        </p>
      </div>
    </div>
  );
};
