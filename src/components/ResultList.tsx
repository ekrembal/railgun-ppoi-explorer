import { POIStatus } from '@railgun-community/shared-models';
import React from 'react';
import { POIResult } from '@screens/App';

interface ResultListProps {
  results: POIResult[];
}

const LIST_NAME_MAPPING: { [key: string]: string } = {
  efc6ddb59c098a13fb2b618fdae94c1c3a807abc8fb1837c93620c9143ee9e88:
    'SDN+BlockedPersons',
};

const LIST_TOOLTIP_TEXT: { [key: string]: string } = {
  efc6ddb59c098a13fb2b618fdae94c1c3a807abc8fb1837c93620c9143ee9e88:
    'The Specially Designated Nationals list maintained by US Department of Treasury – Office of Foreign Assets Control. This list is only input data and does not give data providers any insight into RAILGUN transactions.',
};

const IGNORED_LISTS = [
  '55049dc47b4435bca4a8f8ac27b1858e409f9f72b317fde4a442095cfc454893',
];

export const ResultList: React.FC<ResultListProps> = ({ results }) => {
  return (
    <div className="w-full flex flex-col items-center space-y-[50px] pt-[50px]">
      {results.map(result =>
        Object.entries(result.poisPerList).map(([blindedCommitment, list]) => (
          <div
            key={blindedCommitment}
            className="w-full h-auto mb-4 bg-white rounded-lg shadow"
          >
            <div className="flex flex-row p-4 border-b border-zinc-400 border-opacity-50 px-[50px] py-[25px]">
              <div className="text-lg font-semibold mr-2">Txn Hash: </div>
              <div className="text-lg font-normal">{result.txid}</div>
            </div>

            <div className="flex flex-col space-y-[40px] mx-[50px] pt-[40px]">
              {Object.entries(list)
                .filter(([listKey, _]) => !IGNORED_LISTS.includes(listKey))
                .map(([listKey, status], index, filteredList) => (
                  <div
                    key={listKey}
                    className={`pb-[40px] ${
                      index === filteredList.length - 1
                        ? ''
                        : 'border-b border-zinc-400 border-opacity-50'
                    }`}
                  >
                    <div className="flex flex-row">
                      <div className="text-base font-normal text-zinc-400 w-[180px]">
                        List Name:
                      </div>
                      <div className="relative tooltip group">
                        <div className="absolute hidden group-hover:block tooltiptext bg-[#45CCA6] mb-4 rounded">
                          <div className="p-4 text-white text-sm">
                            {LIST_TOOLTIP_TEXT[listKey] ?? 'Unknown list'}
                          </div>
                          <div className="tooltip-arrow"></div>
                        </div>
                        <div className="text-base font-semibold text-emerald-400">
                          {LIST_NAME_MAPPING[listKey] ?? 'Unknown'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row">
                      <div className="text-base font-normal text-zinc-400 w-[180px]">
                        List Key:
                      </div>
                      <div className="text-base font-normal">{listKey}</div>
                    </div>

                    <div className="flex flex-row">
                      <div className="text-base font-normal text-zinc-400 w-[180px]">
                        Status:
                      </div>
                      <div
                        className={`text-base font-normal ${
                          status === POIStatus.Valid
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {status}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )),
      )}
    </div>
  );
};
