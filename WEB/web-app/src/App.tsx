import { IProps } from "./types/IProps";

export const App = ({}: IProps) => {
  return (
    <>
      <div className="flex flex-col items-center justify-center p-8 bg-gray-100 min-h-screen"  style={{
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
          <pre className="font-mono text-blue-600 text-center text-lg font-bold">
            {`
   ____              _     _   _   _    ____                        
  |  _ \\  __ _ __  _(_) __| | | | | |  |  _ \\  __ _ _ __  _ __  _   _ 
  | | | |/ _\` |\\ \\/ / |/ _\` | | | | |  | | | |/ _\` | '_ \\| '_ \\| | | |
  | |_| | (_| | >  <| | (_| | |_| |_|  | |_| | (_| | | | | | | | |_| |
  |____/ \\__,_|/_/\\_\\_|\\__,_| (_) (_)  |____/ \\__,_|_| |_|_| |_|\\__, |
                                                               |___/ 
`}
          </pre>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div className="bg-gray-800 text-white py-2 px-6 rounded-full flex items-center space-x-4 justify-center">
              <span className="font-bold">Dev by</span>
              <span className="ml-2">🚀</span>
              <div>
                <span className="font-bold">David</span>
                <span className="text-gray-400">||</span>
                <span className="font-bold">Danny</span>
              </div>
            </div>
          </div>
          <p
            style={{
              display: "flex",
              gap: "0.5rem",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Beautiful code, exceptional results
          </p>
        </div>
      </div>
      {/* Aquí irá el enrutador*/}
    </>
  );
};
