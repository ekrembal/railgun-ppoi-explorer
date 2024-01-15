// components/App.tsx
// import { useExplorer } from '../services/explorer';
import {
  BlindedCommitmentType,
  NETWORK_CONFIG,
  NetworkName,
  NodeStatusAllNetworks,
  TXIDVersion,
} from '@railgun-community/shared-models';
import {
  getRailgunTransactionDataForUnshieldToAddress,
  getRailgunTxidsForUnshields,
} from '@railgun-community/wallet';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from '@components/Dropdown';
import { ErrorComponent } from '@components/Error';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { ProofCounter } from '@components/ProofCounter';
import { SearchBar } from '@components/SearchBar';
import { SearchButton } from '@components/SearchButton';
import { AvailableNodes } from '@constants/nodes';
import { POINodeRequest } from '@services/poi-node-request';
import { ResultList } from '../components/ResultList';
export enum QueryTypeEnum {
  ADDRESS = 'address',
  TX = 'tx',
}
export type Query = {
  network: NetworkName;
  type: QueryTypeEnum;
  value: string;
};
export declare enum POIStatus {
  Valid = 'Valid',
  ShieldBlocked = 'ShieldBlocked',
  ProofSubmitted = 'ProofSubmitted',
  Missing = 'Missing',
}
export type POIsPerList = {
  [listKey: string]: POIStatus;
};
export type POIsPerListMap = {
  [blindedCommitment: string]: POIsPerList;
};
export type POIResult = {
  txid: string;
  poisPerList: POIsPerListMap;
};
const aggregatorNode = AvailableNodes[0];

export const App: React.FC<{ initialQuery: Query | undefined }> = ({
  initialQuery,
}) => {
  const [result, setResult] = useState<POIResult[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [isInternalError, setIsInternalError] = useState<boolean>(false);

  // const [aggregatorNode, setAggregatorNode] = useState<string>(
  //   AvailableNodes[0],
  // );
  const [nodeStatusForAllNetworks, setNodeStatusForAllNetworks] = useState<
    NodeStatusAllNetworks | undefined
  >(undefined);

  // Function to fetch NodeStatusAllNetworks
  const fetchNodeStatusForAllNetworks = async () => {
    console.log('fetchNodeStatusForAllNetworks called');
    const data = await POINodeRequest.getNodeStatusAllNetworks(aggregatorNode);
    // setNodeStatusForAllNetworks(data);
    return data;
  };

  const makeQuery = async (
    query: Query,
    nodeStatus: NodeStatusAllNetworks,
  ): Promise<POIResult[] | undefined> => {
    console.log('make query called');
    try {
      let queryData: { txid: string; railgunTxids: string[] }[];
      if (query.type === QueryTypeEnum.ADDRESS) {
        queryData = await getRailgunTransactionDataForUnshieldToAddress(
          NETWORK_CONFIG[query.network].chain,
          query.value,
        );
      } else if (query.type === QueryTypeEnum.TX) {
        let railgunTxids = await getRailgunTxidsForUnshields(
          NETWORK_CONFIG[query.network].chain,
          query.value,
        );
        queryData = [
          {
            txid: query.value,
            railgunTxids,
          },
        ];
      } else {
        queryData = [];
      }

      if (
        queryData.length == 0 ||
        (queryData.length == 1 && queryData[0].railgunTxids.length == 0)
      ) {
        console.error('Query is empty');
        setIsNotFound(true);
        return undefined;
      }

      console.log(queryData);

      const data = await Promise.all(
        queryData.map(async queryTx => {
          const poisPerList = await POINodeRequest.getPOIsPerList(
            aggregatorNode,
            query.network,
            TXIDVersion.V2_PoseidonMerkle,
            nodeStatus?.listKeys ?? [],
            queryTx.railgunTxids.map(blindedCommitment => ({
              blindedCommitment: '0x' + blindedCommitment,
              type: BlindedCommitmentType.Unshield,
            })),
          );
          return { txid: queryTx.txid, poisPerList };
        }),
      );
      return data;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  };

  useEffect(() => {
    setIsInternalError(false);
    setIsNotFound(false);
    setIsLoading(true);

    fetchNodeStatusForAllNetworks()
      .then(result => {
        if (initialQuery) {
          // setNodeStatusForAllNetworks(result);
          makeQuery(initialQuery, result)
            .then(result => {
              setResult(result);
              setIsLoading(false);
            })
            .catch(e => {
              console.error(e);
              setIsInternalError(true);
              setIsLoading(false);
            });
        } else {
          setNodeStatusForAllNetworks(result);
          setIsLoading(false);
        }
      })
      .catch(e => {
        setIsLoading(false);
        setIsInternalError(true);
        console.error(e);
      });
  }, [initialQuery]);

  const queryHandler = (query: Query) => {
    if (!nodeStatusForAllNetworks) {
      console.log('nodeStatusForAllNetworks is undefined');
      return;
    }
    setIsLoading(true);
    makeQuery(query, nodeStatusForAllNetworks)
      .then(result => {
        setResult(result);
        setIsLoading(false);
      })
      .catch(e => {
        console.error(e);
        setIsLoading(false);
      });
  };

  const getTotalLegacyProofs = (
    nodeStatus: NodeStatusAllNetworks | undefined,
  ) => {
    // Check if nodeStatus is defined and has the forNetwork property
    if (nodeStatus != undefined) {
      // Reduce all networks to sum their legacyTransactProofs
      return Object.values(nodeStatus.forNetwork).reduce((total, status) => {
        // Add the legacyTransactProofs if it exists, otherwise add 0
        return total + (status?.legacyTransactProofs ?? 0);
      }, 0);
    }

    // Return 0 if nodeStatus is not defined or doesn't have the forNetwork property
    return 0;
  };

  return (
    <div className="flex flex-col space-y-4 max-w-screen-lg w-full p-16">
      <div className="text-black text-2xl font-semibold mb-0.5">
        Private Proofs of Innocence Explorer
      </div>
      <div className="text-black text-base font-normal pb-9">
        Enter a transaction number to check the Private Proofs of Innocence
        status of RAILGUN private transactions. This explorer only looks at the
        blinded proofs of Private POI and does not contain any other transaction
        information.
      </div>
      <SearchBar
        initialNetwork={initialQuery ? initialQuery.network : undefined}
        initialQueryValue={initialQuery ? initialQuery.value : undefined}
        makeQuery={queryHandler}
      />
      {!isLoading && isNotFound && (
        <ErrorComponent
          title="Search not found"
          description="Oops! We couldn’t find any data related to the entered value."
          image="/SearchNotFound.png"
        />
      )}

      {!isLoading && isInternalError && (
        <ErrorComponent
          title="Internal error"
          description="Oops! We had an issue on our end, try again later."
          image="/InternalError.png"
        />
      )}
      {!isLoading && !result && nodeStatusForAllNetworks !== undefined && (
        <ProofCounter
          totalProofs={getTotalLegacyProofs(nodeStatusForAllNetworks)}
        />
      )}
      {isLoading && <LoadingSpinner />}
      {!isLoading && result && <ResultList results={result} />}
    </div>
  );
};
