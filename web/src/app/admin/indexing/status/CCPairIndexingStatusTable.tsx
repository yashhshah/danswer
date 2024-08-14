import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Table,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
} from "@tremor/react";
import { IndexAttemptStatus } from "@/components/Status";
import { timeAgo } from "@/lib/time";
import {
  ConnectorIndexingStatus,
  ConnectorSummary,
  GroupedConnectorSummaries,
  ValidSources,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiSettings,
  FiXCircle,
} from "react-icons/fi";
import { Tooltip } from "@/components/tooltip/Tooltip";
import { SourceIcon } from "@/components/SourceIcon";
import { getSourceDisplayName } from "@/lib/sources";
import { CustomTooltip } from "@/components/tooltip/CustomTooltip";
import { Warning } from "@phosphor-icons/react";
import Cookies from "js-cookie";
import { TOGGLED_CONNECTORS_COOKIE_NAME } from "@/lib/constants";
import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import { ConnectorCredentialPairStatus } from "../../connector/[ccPairId]/types";

const columnWidths = {
  first: "20%",
  second: "15%",
  third: "15%",
  fourth: "15%",
  fifth: "15%",
  sixth: "15%",
  seventh: "5%",
};

function SummaryRow({
  source,
  summary,
  isOpen,
  onToggle,
}: {
  source: ValidSources;
  summary: ConnectorSummary;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const activePercentage = (summary.active / summary.count) * 100;
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();

  return (
    <TableRow
      onClick={onToggle}
      className="border-border bg-white rounded-sm !border sbg-white cursor-pointer"
    >
      <TableCell className={`py-4 w-[${columnWidths.first}]`}>
        <div className="text-xl flex items-center truncate ellipsis gap-x-2 font-semibold">
          <div className="cursor-pointer">
            {isOpen ? (
              <FiChevronDown size={20} />
            ) : (
              <FiChevronRight size={20} />
            )}
          </div>
          <SourceIcon iconSize={20} sourceType={source} />
          {getSourceDisplayName(source)}
        </div>
      </TableCell>

      <TableCell className={`py-4 w-[${columnWidths.first}]`}>
        <div className="text-sm text-gray-500">Total Connectors</div>
        <div className="text-xl font-semibold">{summary.count}</div>
      </TableCell>

      <TableCell className={` py-4 w-[${columnWidths.second}]`}>
        <div className="text-sm text-gray-500">Active Connectors</div>
        <Tooltip
          content={`${summary.active} out of ${summary.count} connectors are active`}
        >
          <div className="flex items-center mt-1">
            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${activePercentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium whitespace-nowrap">
              {summary.active} ({activePercentage.toFixed(0)}%)
            </span>
          </div>
        </Tooltip>
      </TableCell>

      {isPaidEnterpriseFeaturesEnabled && (
        <TableCell className={`py-4 w-[${columnWidths.fourth}]`}>
          <div className="text-sm text-gray-500">Public Connectors</div>
          <p className="flex text-xl mx-auto font-semibold items-center text-lg mt-1">
            {summary.public}/{summary.count}
          </p>
        </TableCell>
      )}

      <TableCell className={`py-4 w-[${columnWidths.fifth}]`}>
        <div className="text-sm text-gray-500">Total Docs Indexed</div>
        <div className="text-xl font-semibold">
          {summary.totalDocsIndexed.toLocaleString()}
        </div>
      </TableCell>

      <TableCell className={`w-[${columnWidths.sixth}]`}>
        <div className="text-sm text-gray-500">Errors</div>

        <div className="flex items-center text-lg gap-x-1 font-semibold">
          {summary.errors > 0 && <Warning className="text-error h-6 w-6" />}
          {summary.errors}
        </div>
      </TableCell>

      <TableCell className={`w-[${columnWidths.seventh}]`}></TableCell>
    </TableRow>
  );
}

function ConnectorRow({
  ccPairsIndexingStatus,
  invisible,
}: {
  ccPairsIndexingStatus: ConnectorIndexingStatus<any, any>;
  invisible?: boolean;
}) {
  const router = useRouter();
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();

  const handleManageClick = (e: any) => {
    e.stopPropagation();
    router.push(`/admin/connector/${ccPairsIndexingStatus.cc_pair_id}`);
  };

  const getActivityBadge = () => {
    if (
      ccPairsIndexingStatus.cc_pair_status ===
      ConnectorCredentialPairStatus.DELETING
    ) {
      return (
        <Badge
          color="red"
          className="w-fit px-2 py-1 rounded-full border border-red-500"
        >
          <div className="flex text-xs items-center gap-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            Deleting
          </div>
        </Badge>
      );
    } else if (
      ccPairsIndexingStatus.cc_pair_status ===
      ConnectorCredentialPairStatus.PAUSED
    ) {
      return (
        <Badge
          color="yellow"
          className="w-fit px-2 py-1 rounded-full border border-yellow-500"
        >
          <div className="flex text-xs items-center gap-x-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            Paused
          </div>
        </Badge>
      );
    }

    // ACTIVE case
    switch (ccPairsIndexingStatus.last_status) {
      case "in_progress":
        return (
          <Badge
            color="green"
            className="w-fit px-2 py-1 rounded-full border border-green-500"
          >
            <div className="flex text-xs items-center gap-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Indexing
            </div>
          </Badge>
        );
      case "not_started":
        return (
          <Badge
            color="purple"
            className="w-fit px-2 py-1 rounded-full border border-purple-500"
          >
            <div className="flex text-xs items-center gap-x-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              Scheduled
            </div>
          </Badge>
        );
      default:
        return (
          <Badge
            color="green"
            className="w-fit px-2 py-1 rounded-full border border-green-500"
          >
            <div className="flex text-xs items-center gap-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Active
            </div>
          </Badge>
        );
    }
  };

  return (
    <TableRow
      className={`hover:bg-hover-light ${
        invisible ? "invisible h-0 !-mb-10" : "border border-border !border-b"
      }  w-full cursor-pointer relative`}
      onClick={() =>
        router.push(`/admin/connector/${ccPairsIndexingStatus.cc_pair_id}`)
      }
    >
      <TableCell className={`!pr-0 w-[${columnWidths.first}]`}>
        <p className="w-[200px] inline-block ellipsis truncate">
          {ccPairsIndexingStatus.name}
        </p>
      </TableCell>
      <TableCell className={` w-[${columnWidths.fifth}]`}>
        {timeAgo(ccPairsIndexingStatus?.last_success) || "-"}
      </TableCell>
      <TableCell className={`w-[${columnWidths.third}]`}>
        {getActivityBadge()}
      </TableCell>
      {isPaidEnterpriseFeaturesEnabled && (
        <TableCell className={`w-[${columnWidths.fourth}]`}>
          {ccPairsIndexingStatus.public_doc ? (
            <FiCheck className="my-auto text-emerald-600" size="18" />
          ) : (
            <FiXCircle className="my-auto text-red-600" />
          )}
        </TableCell>
      )}
      <TableCell className={`w-[${columnWidths.sixth}]`}>
        {ccPairsIndexingStatus.docs_indexed}
      </TableCell>
      <TableCell className={`w-[${columnWidths.second}]`}>
        <IndexAttemptStatus
          status={ccPairsIndexingStatus.last_finished_status || null}
          errorMsg={ccPairsIndexingStatus?.latest_index_attempt?.error_msg}
          size="xs"
        />
      </TableCell>
      <TableCell className={`w-[${columnWidths.seventh}]`}>
        <CustomTooltip content="Manage Connector">
          <FiSettings className="cursor-pointer" onClick={handleManageClick} />
        </CustomTooltip>
      </TableCell>
    </TableRow>
  );
}

export function CCPairIndexingStatusTable({
  ccPairsIndexingStatuses,
}: {
  ccPairsIndexingStatuses: ConnectorIndexingStatus<any, any>[];
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const [connectorsToggled, setConnectorsToggled] = useState<
    Record<ValidSources, boolean>
  >(() => {
    const savedState = Cookies.get(TOGGLED_CONNECTORS_COOKIE_NAME);
    return savedState ? JSON.parse(savedState) : {};
  });

  const { groupedStatuses, sortedSources, groupSummaries } = useMemo(() => {
    const grouped: Record<ValidSources, ConnectorIndexingStatus<any, any>[]> =
      {} as Record<ValidSources, ConnectorIndexingStatus<any, any>[]>;
    ccPairsIndexingStatuses.forEach((status) => {
      const source = status.connector.source;
      if (!grouped[source]) {
        grouped[source] = [];
      }
      grouped[source].push(status);
    });

    const sorted = Object.keys(grouped).sort() as ValidSources[];

    const summaries: GroupedConnectorSummaries =
      {} as GroupedConnectorSummaries;
    sorted.forEach((source) => {
      const statuses = grouped[source];
      summaries[source] = {
        count: statuses.length,
        active: statuses.filter(
          (status) =>
            status.cc_pair_status === ConnectorCredentialPairStatus.ACTIVE
        ).length,
        public: statuses.filter((status) => status.public_doc).length,
        totalDocsIndexed: statuses.reduce(
          (sum, status) => sum + status.docs_indexed,
          0
        ),
        errors: statuses.filter((status) => status.last_status === "failed")
          .length,
      };
    });

    return {
      groupedStatuses: grouped,
      sortedSources: sorted,
      groupSummaries: summaries,
    };
  }, [ccPairsIndexingStatuses]);

  const toggleSource = (
    source: ValidSources,
    toggled: boolean | null = null
  ) => {
    const newConnectorsToggled = {
      ...connectorsToggled,
      [source]: toggled == null ? !connectorsToggled[source] : toggled,
    };
    setConnectorsToggled(newConnectorsToggled);
    Cookies.set(
      TOGGLED_CONNECTORS_COOKIE_NAME,
      JSON.stringify(newConnectorsToggled)
    );
  };
  const toggleSources = () => {
    const currentToggledCount =
      Object.values(connectorsToggled).filter(Boolean).length;
    const shouldToggleOn = currentToggledCount < sortedSources.length / 2;

    const connectors = sortedSources.reduce(
      (acc, source) => {
        acc[source] = shouldToggleOn;
        return acc;
      },
      {} as Record<ValidSources, boolean>
    );

    setConnectorsToggled(connectors);
    Cookies.set(TOGGLED_CONNECTORS_COOKIE_NAME, JSON.stringify(connectors));
  };
  const shouldExpand =
    Object.values(connectorsToggled).filter(Boolean).length <
    sortedSources.length / 2;

  return (
    <div className="-mt-20">
      <Table>
        <ConnectorRow
          invisible
          ccPairsIndexingStatus={{
            cc_pair_id: 1,
            name: "Sample File Connector",
            cc_pair_status: ConnectorCredentialPairStatus.ACTIVE,
            last_status: "success",
            connector: {
              name: "Sample File Connector",
              source: "file",
              input_type: "poll",
              connector_specific_config: {
                file_locations: ["/path/to/sample/file.txt"],
              },
              refresh_freq: 86400,
              prune_freq: null,
              indexing_start: new Date("2023-07-01T12:00:00Z"),
              id: 1,
              credential_ids: [],
              time_created: "2023-07-01T12:00:00Z",
              time_updated: "2023-07-01T12:00:00Z",
            },
            credential: {
              id: 1,
              name: "Sample Credential",
              source: "file",
              user_id: "1",
              time_created: "2023-07-01T12:00:00Z",
              time_updated: "2023-07-01T12:00:00Z",
              credential_json: {},
              admin_public: false,
            },
            public_doc: true,
            docs_indexed: 1000,
            last_success: "2023-07-01T12:00:00Z",
            last_finished_status: "success",
            latest_index_attempt: null,
            owner: "1",
            error_msg: "",
            deletion_attempt: null,
            is_deletable: true,
          }}
        />
        <div className="-mb-10" />

        <TableBody>
          <div className="flex items-center mt-4 gap-x-2">
            <input
              type="text"
              ref={searchInputRef}
              placeholder="Search connectors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ml-2 w-96 h-9 flex-none rounded-md border-2 border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />

            <Button className="h-9" onClick={() => toggleSources()}>
              {!shouldExpand ? "Collapse All" : "Expand All"}
            </Button>
          </div>
          {sortedSources
            .filter((source) => source != "not_applicable")
            .map((source, ind) => {
              const sourceMatches = source
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
              const matchingConnectors = groupedStatuses[source].filter(
                (status) =>
                  (status.name || "")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
              );
              if (sourceMatches || matchingConnectors.length > 0) {
                return (
                  <React.Fragment key={ind}>
                    <div className="mt-4" />

                    <SummaryRow
                      source={source}
                      summary={groupSummaries[source]}
                      isOpen={connectorsToggled[source] || false}
                      onToggle={() => toggleSource(source)}
                    />

                    {connectorsToggled[source] && (
                      <>
                        <TableRow className="border border-border">
                          <TableHeaderCell
                            className={`w-[${columnWidths.first}]`}
                          >
                            Name
                          </TableHeaderCell>
                          <TableHeaderCell
                            className={`w-[${columnWidths.fifth}]`}
                          >
                            Last Indexed
                          </TableHeaderCell>
                          <TableHeaderCell
                            className={`w-[${columnWidths.second}]`}
                          >
                            Activity
                          </TableHeaderCell>
                          {isPaidEnterpriseFeaturesEnabled && (
                            <TableHeaderCell
                              className={`w-[${columnWidths.fourth}]`}
                            >
                              Public
                            </TableHeaderCell>
                          )}
                          <TableHeaderCell
                            className={`w-[${columnWidths.sixth}]`}
                          >
                            Total Docs
                          </TableHeaderCell>
                          <TableHeaderCell
                            className={`w-[${columnWidths.third}]`}
                          >
                            Last Status
                          </TableHeaderCell>
                          <TableHeaderCell
                            className={`w-[${columnWidths.seventh}]`}
                          ></TableHeaderCell>
                        </TableRow>
                        {(sourceMatches
                          ? groupedStatuses[source]
                          : matchingConnectors
                        ).map((ccPairsIndexingStatus) => (
                          <ConnectorRow
                            key={ccPairsIndexingStatus.cc_pair_id}
                            ccPairsIndexingStatus={ccPairsIndexingStatus}
                          />
                        ))}
                      </>
                    )}
                  </React.Fragment>
                );
              }
              return null;
            })}
        </TableBody>

        <div className="invisible w-full pb-40" />
      </Table>
    </div>
  );
}
