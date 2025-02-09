import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  faClock,
  faEllipsisV,
  faMagnifyingGlass,
  faTrash,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";

import { ProjectPermissionCan } from "@app/components/permissions";
import {
  EmptyState,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  IconButton,
  Input,
  Table,
  TableContainer,
  TableSkeleton,
  Tag,
  TBody,
  Td,
  Th,
  THead,
  Tooltip,
  Tr
} from "@app/components/v2";
import {
  ProjectPermissionActions,
  ProjectPermissionSub,
  useUser,
  useWorkspace
} from "@app/context";
import { useGetWorkspaceUsers } from "@app/hooks/api";
import { ProjectMembershipRole } from "@app/hooks/api/roles/types";
import { UsePopUpState } from "@app/hooks/usePopUp";

const MAX_ROLES_TO_BE_SHOWN_IN_TABLE = 2;
const formatRoleName = (role: string, customRoleName?: string) => {
  if (role === ProjectMembershipRole.Custom) return customRoleName;
  if (role === ProjectMembershipRole.Member) return "Developer";
  if (role === ProjectMembershipRole.NoAccess) return "No access";
  return role;
};

type Props = {
  handlePopUpOpen: (
    popUpName: keyof UsePopUpState<["removeMember", "upgradePlan"]>,
    data?: {}
  ) => void;
};

export const MembersTable = ({ handlePopUpOpen }: Props) => {
  const [searchMemberFilter, setSearchMemberFilter] = useState("");

  const { currentWorkspace } = useWorkspace();
  const { user } = useUser();
  const router = useRouter();

  const userId = user?.id || "";
  const workspaceId = currentWorkspace?.id || "";

  const { data: members, isLoading: isMembersLoading } = useGetWorkspaceUsers(workspaceId);

  const filterdUsers = useMemo(
    () =>
      members?.filter(
        ({ user: u, inviteEmail }) =>
          u?.firstName?.toLowerCase().includes(searchMemberFilter.toLowerCase()) ||
          u?.lastName?.toLowerCase().includes(searchMemberFilter.toLowerCase()) ||
          u?.username?.toLowerCase().includes(searchMemberFilter.toLowerCase()) ||
          u?.email?.toLowerCase().includes(searchMemberFilter.toLowerCase()) ||
          inviteEmail?.includes(searchMemberFilter.toLowerCase())
      ),
    [members, searchMemberFilter]
  );

  return (
    <div>
      <Input
        value={searchMemberFilter}
        onChange={(e) => setSearchMemberFilter(e.target.value)}
        leftIcon={<FontAwesomeIcon icon={faMagnifyingGlass} />}
        placeholder="Search members..."
      />
      <TableContainer className="mt-4">
        <Table>
          <THead>
            <Tr>
              <Th>Name</Th>
              <Th>Username</Th>
              <Th>Role</Th>
              <Th className="w-5" />
            </Tr>
          </THead>
          <TBody>
            {isMembersLoading && <TableSkeleton columns={4} innerKey="project-members" />}
            {!isMembersLoading &&
              filterdUsers?.map((projectMember) => {
                const { user: u, inviteEmail, id: membershipId, roles } = projectMember;
                const name = u.firstName || u.lastName ? `${u.firstName} ${u.lastName || ""}` : "-";
                const email = u?.email || inviteEmail;

                return (
                  <Tr
                    key={`membership-${membershipId}`}
                    className="group w-full cursor-pointer transition-colors duration-100 hover:bg-mineshaft-700"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(evt) => {
                      if (evt.key === "Enter") {
                        router.push(`/project/${workspaceId}/members/${membershipId}`);
                      }
                    }}
                    onClick={() => router.push(`/project/${workspaceId}/members/${membershipId}`)}
                  >
                    <Td>{name}</Td>
                    <Td>{email}</Td>
                    <Td>
                      <div className="flex items-center space-x-2">
                        {roles
                          .slice(0, MAX_ROLES_TO_BE_SHOWN_IN_TABLE)
                          .map(
                            ({ role, customRoleName, id, isTemporary, temporaryAccessEndTime }) => {
                              const isExpired =
                                new Date() > new Date(temporaryAccessEndTime || ("" as string));
                              return (
                                <Tag key={id}>
                                  <div className="flex items-center space-x-2">
                                    <div className="capitalize">
                                      {formatRoleName(role, customRoleName)}
                                    </div>
                                    {isTemporary && (
                                      <div>
                                        <Tooltip
                                          content={
                                            isExpired ? "Timed role expired" : "Timed role access"
                                          }
                                        >
                                          <FontAwesomeIcon
                                            icon={faClock}
                                            className={twMerge(isExpired && "text-red-600")}
                                          />
                                        </Tooltip>
                                      </div>
                                    )}
                                  </div>
                                </Tag>
                              );
                            }
                          )}
                        {roles.length > MAX_ROLES_TO_BE_SHOWN_IN_TABLE && (
                          <HoverCard>
                            <HoverCardTrigger>
                              <Tag>+{roles.length - MAX_ROLES_TO_BE_SHOWN_IN_TABLE}</Tag>
                            </HoverCardTrigger>
                            <HoverCardContent className="border border-gray-700 bg-mineshaft-800 p-4">
                              {roles
                                .slice(MAX_ROLES_TO_BE_SHOWN_IN_TABLE)
                                .map(
                                  ({
                                    role,
                                    customRoleName,
                                    id,
                                    isTemporary,
                                    temporaryAccessEndTime
                                  }) => {
                                    const isExpired =
                                      new Date() >
                                      new Date(temporaryAccessEndTime || ("" as string));
                                    return (
                                      <Tag key={id} className="capitalize">
                                        <div className="flex items-center space-x-2">
                                          <div>{formatRoleName(role, customRoleName)}</div>
                                          {isTemporary && (
                                            <div>
                                              <Tooltip
                                                content={
                                                  isExpired ? "Access expired" : "Temporary access"
                                                }
                                              >
                                                <FontAwesomeIcon
                                                  icon={faClock}
                                                  className={twMerge(
                                                    new Date() >
                                                      new Date(temporaryAccessEndTime as string) &&
                                                      "text-red-600"
                                                  )}
                                                />
                                              </Tooltip>
                                            </div>
                                          )}
                                        </div>
                                      </Tag>
                                    );
                                  }
                                )}
                            </HoverCardContent>
                          </HoverCard>
                        )}
                      </div>
                    </Td>
                    <Td>
                      {userId !== u?.id && (
                        <div className="flex items-center space-x-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <ProjectPermissionCan
                            I={ProjectPermissionActions.Delete}
                            a={ProjectPermissionSub.Member}
                          >
                            {(isAllowed) => (
                              <IconButton
                                colorSchema="danger"
                                variant="plain"
                                ariaLabel="update"
                                className="ml-4"
                                isDisabled={userId === u?.id || !isAllowed}
                                onClick={(evt) => {
                                  evt.preventDefault();
                                  evt.stopPropagation();
                                  handlePopUpOpen("removeMember", { username: u.username });
                                }}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </IconButton>
                            )}
                          </ProjectPermissionCan>
                          <IconButton ariaLabel="more-icon" variant="plain">
                            <FontAwesomeIcon icon={faEllipsisV} />
                          </IconButton>
                        </div>
                      )}
                    </Td>
                  </Tr>
                );
              })}
          </TBody>
        </Table>
        {!isMembersLoading && filterdUsers?.length === 0 && (
          <EmptyState title="No project members found" icon={faUsers} />
        )}
      </TableContainer>
    </div>
  );
};
